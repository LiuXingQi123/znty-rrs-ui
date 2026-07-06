/*
* 页面公共资源同步加载器
* 集中维护第三方依赖、公共脚本和页面样式引用，保证内联 Vue 实例执行前依赖已就绪
*/
(function() {
    'use strict'

    const loaderScript = document.currentScript
    if (!loaderScript || !loaderScript.src) {
        throw new Error('resource_loader.js 必须通过同步 script 标签加载')
    }
    if (document.readyState !== 'loading') {
        throw new Error('resource_loader.js 必须放在 head 中同步加载，禁止使用 async 或 defer')
    }

    const pageMatch = decodeURIComponent(window.location.pathname).match(/\/([A-Za-z0-9_-]+)\.html$/i)
    if (!pageMatch) {
        throw new Error('无法根据当前 HTML 地址推导页面 CSS 文件名')
    }

    const pageName = pageMatch[1]
    const projectRootUrl = new URL('../', loaderScript.src)
    const loadCommonCss = loaderScript.hasAttribute('data-common')
    const loadMomentLocale = loaderScript.hasAttribute('data-moment-locale')
    const loadMoment = loaderScript.hasAttribute('data-moment') || loadMomentLocale

    const resourceUrls = {
        elementCss: 'https://unpkg.com/element-ui@2.15.14/lib/theme-chalk/index.css',
        vue: 'https://unpkg.com/vue@2.5.16/dist/vue.min.js',
        elementJs: 'https://unpkg.com/element-ui@2.15.14/lib/index.js',
        axios: 'https://unpkg.com/axios@1.7.9/dist/axios.min.js',
        api: new URL('js/api.js', projectRootUrl).href,
        moment: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js',
        momentLocale: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/locale/zh-cn.min.js',
        pageCss: new URL('css/' + pageName + '.css', projectRootUrl).href,
        commonCss: new URL('css/common.css', projectRootUrl).href,
    }

    // 转义资源地址，避免生成无效的 HTML 属性
    function escapeAttribute(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    }

    // 构建样式引用
    function buildStyleTag(url) {
        return '<link rel="stylesheet" href="' + escapeAttribute(url) + '">'
    }

    // 构建同步脚本引用
    function buildScriptTag(url) {
        return '<script src="' + escapeAttribute(url) + '"><\/script>'
    }

    const resourceTags = [
        buildStyleTag(resourceUrls.elementCss),
        buildScriptTag(resourceUrls.vue),
        buildScriptTag(resourceUrls.elementJs),
        buildScriptTag(resourceUrls.axios),
        buildScriptTag(resourceUrls.api),
    ]
    if (loadMoment) {
        resourceTags.push(buildScriptTag(resourceUrls.moment))
    }
    if (loadMomentLocale) {
        resourceTags.push(buildScriptTag(resourceUrls.momentLocale))
    }
    resourceTags.push(buildStyleTag(resourceUrls.pageCss))
    if (loadCommonCss) {
        resourceTags.push(buildStyleTag(resourceUrls.commonCss))
    }

    document.write(resourceTags.join('\n'))
})()
