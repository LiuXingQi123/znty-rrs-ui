/*
* 公共 API 请求配置
* 统一登录用户、后端接口地址、响应解析、错误提示与文件下载响应处理
*/
const RRS_AUTH_STORAGE_KEY = 'rrs-login-user'
const RRS_DEFAULT_USER = { userId: '1001', userName: '管理员', loginName: 'admin' }

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
