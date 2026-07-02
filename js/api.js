/*
* 公共 API 请求配置
* 统一后端接口地址、响应解析、错误提示与文件下载响应处理
*/
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
