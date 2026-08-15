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

// 工作台页签：列表进详情时新开 Tab，同业务键复用；脱离工作台时返回 false 由页面自行跳转
window.RrsWorkbench = {
    // 取得带开 Tab 能力的父窗口
    getHost() {
        try {
            if (window.parent && window.parent !== window && typeof window.parent.RrsWorkbenchOpenTab === 'function') {
                return window.parent
            }
        } catch (e) {}
        return null
    },

    // 组装页签唯一键，去掉空白
    buildTabIndex(prefix, parts) {
        const tokens = (parts || []).map(function (item) {
            return String(item == null ? '' : item).replace(/\s+/g, '')
        })
        return String(prefix || 'detail') + '-' + tokens.join('-')
    },

    // 页签标题：简称优先，过长截断；suffix 默认「详情」，审核页可传「审核」
    formatDetailTitle(name, fallback, suffix) {
        const tag = String(suffix || '详情').trim() || '详情'
        const raw = String(name || fallback || tag).trim() || tag
        const shortText = raw.length > 16 ? raw.slice(0, 16) + '…' : raw
        return shortText.slice(-tag.length) === tag ? shortText : shortText + ' ' + tag
    },

    // 在工作台新开或激活详情页签；成功返回 true
    openDetailTab(options) {
        const host = this.getHost()
        if (!host) return false
        host.RrsWorkbenchOpenTab(options || {})
        return true
    },

    // 关闭当前详情页签并回到来源页签；未关掉动态页签时返回 false，由页面走原返回逻辑
    closeActiveTab() {
        const host = this.getHost()
        if (!host || typeof host.RrsWorkbenchCloseActiveTab !== 'function') return false
        return host.RrsWorkbenchCloseActiveTab() === true
    },
}

axios.defaults.baseURL = 'http://localhost:18090'

Vue.prototype.apiPost = async function(path, body, config) {
    try {
        const resp = await axios.post(path, body || {}, config || {})
        if (config && config.responseType === 'blob') return resp

        const json = resp.data || {}
        if (!json.success) {
            // 业务失败提示
            const message = json.message || '接口异常'
            this.$message.error({ message: message, duration: 10000, showClose: true })
            throw new Error(message)
        }
        return json.data
    } catch (e) {
        // 已提示过的业务错误直接透传
        if (e && e.message && !(e.response || e.request)) {
            throw e
        }
        // 网络或 HTTP 错误
        let message = '网络异常，请稍后重试'
        if (e && e.response && e.response.data) {
            const data = e.response.data
            if (typeof data === 'string' && data.trim()) {
                message = data.trim().length > 600 ? (data.trim().slice(0, 600) + '...') : data.trim()
            } else if (data && data.message) {
                message = data.message
            } else if (e.response.status) {
                message = '请求失败 (HTTP ' + e.response.status + ')'
            }
        } else if (e && e.message) {
            message = e.message
        }
        this.$message.error({ message: message, duration: 10000, showClose: true })
        throw new Error(message)
    }
}

// Base64 转文件并触发浏览器下载
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

// 下载 classpath 模板（Base64）
Vue.prototype.downloadTemplate = async function(templateCode) {
    const data = await this.apiPost('/api/v1/commonFile/downloadTemplate', { templateCode: templateCode })
    if (!data || !data.contentBase64) {
        throw new Error('模板内容为空')
    }
    this.downloadBase64File(data.contentBase64, data.fileName || (templateCode + '.xlsx'), data.contentType)
    return data
}
