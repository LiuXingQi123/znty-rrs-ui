/*
* 业务页打印导出 PDF
* 约定：要导出的卡片加 print-section；导出前由页面展开折叠，本文件负责标题、延时 print、结束后还原
*/
window.RrsPrintExport = {
    _restoreHandler: null,

    /*
    * 调起浏览器打印。
    * fileTitle：PDF 默认文件名的组成片段。
    * nextTick：页面的 Vue nextTick，用于等待展开后的 DOM 渲染完成。
    * prepare：打印前展开导出内容，并返回页面原状态快照。
    * restore：打印结束或取消后，根据快照恢复页面状态。
    */
    print(options) {
        const opts = options || {}
        if (typeof opts.prepare !== 'function') {
            return
        }

        // 清理上一次监听，并让业务页准备打印内容
        this.unbind()
        const snapshot = opts.prepare()

        // 临时切换页面标题和打印状态，供文件名及打印样式使用
        const fileTitle = this.buildFileTitle(opts.fileTitle)
        const selfTitle = document.title
        const parentTitle = this.setParentTitle(fileTitle)
        document.title = fileTitle
        document.documentElement.classList.add('is-print-export')
        document.body.classList.add('is-print-export')

        // 打印结束后恢复标题、打印样式和业务页原状态
        const restore = () => {
            document.documentElement.classList.remove('is-print-export')
            document.body.classList.remove('is-print-export')
            document.title = selfTitle
            this.setParentTitle(parentTitle)
            if (typeof opts.restore === 'function') {
                opts.restore(snapshot)
            }
            this.unbind()
        }
        this._restoreHandler = restore
        window.addEventListener('afterprint', restore)

        const runPrint = () => {
            window.print()
        }
        const waitMs = opts.waitMs == null ? 50 : opts.waitMs

        // 连续等待两次 nextTick，避免折叠区块或表格尚未完成布局
        if (typeof opts.nextTick === 'function') {
            opts.nextTick(() => {
                opts.nextTick(() => {
                    window.setTimeout(runPrint, waitMs)
                })
            })
            return
        }
        window.setTimeout(runPrint, waitMs)
    },

    // 组装另存 PDF 默认文件名
    buildFileTitle(parts) {
        const list = Array.isArray(parts) ? parts : [parts]
        return list.filter(Boolean).join('_').replace(/[\\/:*?"<>|]/g, '')
    },

    // 同步工作台顶层标题；非 iframe 或跨域时忽略
    setParentTitle(title) {
        if (!title || window.parent === window) {
            return null
        }
        try {
            const previous = window.parent.document.title
            window.parent.document.title = title
            return previous
        } catch (e) {
            return null
        }
    },

    // 移除打印还原监听
    unbind() {
        if (this._restoreHandler) {
            window.removeEventListener('afterprint', this._restoreHandler)
            this._restoreHandler = null
        }
    },
}
