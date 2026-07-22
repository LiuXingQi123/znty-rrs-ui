/*
* 公共 API 请求配置
* 统一登录用户、后端接口地址、响应解析、错误提示与文件下载响应处理
*/
const RRS_AUTH_STORAGE_KEY = 'rrs-login-user'
const RRS_DEFAULT_USER = { userId: '1', userName: '管理员', loginName: 'admin' }

window.RrsAuth = {
    // 规范化登录用户信息
    normalizeUser(user) {
        if (!user) return null
        const userId = String(user.userId || '').trim()
        const userName = String(user.userName || userId).trim()
        if (!userId || !userName) return null
        return {
            userId,
            userName,
            loginName: String(user.loginName || userId).trim() || userId,
        }
    },

    // 校验纯前端演示登录并保存用户（密码不持久化）
    authenticate(userId, password, userName, loginName) {
        const loginUserId = String(userId || '').trim()
        const loginPassword = String(password || '').trim()
        if (!loginUserId || !loginPassword) return null
        return this.saveCurrentUser({
            userId: loginUserId,
            userName: String(userName || loginUserId).trim(),
            loginName: String(loginName || loginUserId).trim(),
        })
    },

    // 保存当前登录用户
    saveCurrentUser(user) {
        const normalized = this.normalizeUser(user)
        if (!normalized) return null
        try {
            window.localStorage.setItem(RRS_AUTH_STORAGE_KEY, JSON.stringify(normalized))
        } catch (e) {}
        return normalized
    },

    // 从当前 URL 读取登录用户
    getUrlUser() {
        const params = new URLSearchParams(window.location.search)
        return this.normalizeUser({
            userId: params.get('loginUserId'),
            userName: params.get('loginUserName'),
            loginName: params.get('loginUserId'),
        })
    },

    // 读取已持久化的登录用户
    getStoredUser() {
        try {
            return this.normalizeUser(JSON.parse(window.localStorage.getItem(RRS_AUTH_STORAGE_KEY) || 'null'))
        } catch (e) {
            return null
        }
    },

    // 获取当前用户；业务页无登录信息时沿用管理员兜底
    getCurrentUser(allowDefault = true) {
        const urlUser = this.getUrlUser()
        if (urlUser) return this.saveCurrentUser(urlUser)
        const storedUser = this.getStoredUser()
        if (storedUser) return storedUser
        return allowDefault ? { ...RRS_DEFAULT_USER } : null
    },

    // 向查询参数追加当前登录用户
    appendUserParams(params, user) {
        const query = params instanceof URLSearchParams ? params : new URLSearchParams(params || {})
        const currentUser = this.normalizeUser(user) || this.getCurrentUser()
        query.set('loginUserId', currentUser.userId)
        query.set('loginUserName', currentUser.userName)
        return query
    },

    // 构建携带当前登录用户的页面地址
    buildPageUrl(page, user) {
        const hashIndex = page.indexOf('#')
        const hash = hashIndex >= 0 ? page.slice(hashIndex) : ''
        const pageWithoutHash = hashIndex >= 0 ? page.slice(0, hashIndex) : page
        const queryIndex = pageWithoutHash.indexOf('?')
        const path = queryIndex >= 0 ? pageWithoutHash.slice(0, queryIndex) : pageWithoutHash
        const queryText = queryIndex >= 0 ? pageWithoutHash.slice(queryIndex + 1) : ''
        const params = this.appendUserParams(new URLSearchParams(queryText), user)
        return path + '?' + params.toString() + hash
    },

    // 清除当前登录用户
    clearCurrentUser() {
        try {
            window.localStorage.removeItem(RRS_AUTH_STORAGE_KEY)
        } catch (e) {}
    },
}

axios.defaults.baseURL = 'http://localhost:18090'

/**
 * 剩余期限展示：库字段 date_exists 为天，前端 ÷365 显示为年（保留两位小数）。
 * 空值 / 非数字返回空串。
 */
Vue.prototype.formatRemainTermYears = function(days) {
    if (days === null || days === undefined || days === '') return ''
    const n = Number(days)
    if (!isFinite(n)) return ''
    return (n / 365).toFixed(2)
}

Vue.prototype.apiPost = async function(path, body, config) {
    const resp = await axios.post(path, body || {}, config || {})
    if (config && config.responseType === 'blob') return resp

    const json = resp.data || {}
    if (!json.success) {
        const message = json.message || '接口异常'
        this.$message.error(message)
        throw new Error(message)
    }
    return json.data
}

Vue.prototype.downloadBase64File = function(base64, fileName, contentType) {
    const binary = atob(base64 || '')
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: contentType || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    try {
        const link = document.createElement('a')
        link.href = url
        link.download = fileName || '附件'
        link.click()
    } finally {
        URL.revokeObjectURL(url)
    }
}

/**
 * 【参考实现，业务页请各自复制 methods 内写法，便于页面独立迁移】
 * 重算 el-table 固定列布局（Element UI fixed 列在异步数据/分页后需 doLayout）
 * @param {string|Object} tableRefOrName ref 名或表格组件实例
 *
 * 页面内推荐写法：
 * refreshTableLayout(refName) {
 *   this.$nextTick(() => {
 *     window.requestAnimationFrame(() => {
 *       const table = this.$refs[refName]
 *       if (table) {
 *         table.doLayout()
 *         window.setTimeout(() => table.doLayout(), 80)
 *         window.setTimeout(() => table.doLayout(), 180)
 *       }
 *     })
 *   })
 * }
 */
Vue.prototype.refreshElTableLayout = function(tableRefOrName) {
    const run = (table) => {
        if (!table || typeof table.doLayout !== 'function') return
        table.doLayout()
        window.setTimeout(() => table.doLayout(), 80)
        window.setTimeout(() => table.doLayout(), 180)
    }
    this.$nextTick(() => {
        window.requestAnimationFrame(() => {
            let table = tableRefOrName
            if (typeof tableRefOrName === 'string') {
                const ref = this.$refs[tableRefOrName]
                table = Array.isArray(ref) ? ref[0] : ref
            }
            run(table)
        })
    })
}

/**
 * 【参考实现，业务页请各自复制 methods 内写法，便于页面独立迁移】
 * 重算当前页面所有带 doLayout 的表格（窗口 resize / 步骤切换时用）
 *
 * 页面内推荐写法：
 * refreshAllTableLayout() {
 *   this.$nextTick(() => {
 *     window.requestAnimationFrame(() => {
 *       Object.keys(this.$refs).forEach(refName => {
 *         const ref = this.$refs[refName]
 *         const table = Array.isArray(ref) ? ref[0] : ref
 *         if (table && typeof table.doLayout === 'function') {
 *           table.doLayout()
 *           window.setTimeout(() => table.doLayout(), 80)
 *           window.setTimeout(() => table.doLayout(), 180)
 *         }
 *       })
 *     })
 *   })
 * }
 */
Vue.prototype.refreshAllElTableLayout = function() {
    this.$nextTick(() => {
        window.requestAnimationFrame(() => {
            Object.keys(this.$refs || {}).forEach(refName => {
                const ref = this.$refs[refName]
                const table = Array.isArray(ref) ? ref[0] : ref
                if (table && typeof table.doLayout === 'function') {
                    table.doLayout()
                    window.setTimeout(() => table.doLayout(), 80)
                    window.setTimeout(() => table.doLayout(), 180)
                }
            })
        })
    })
}
