// 调库材料公共组件：报告按来源和主键聚合，手工文件保留独立下载入口。
(function(global) {
    'use strict';

    // 库引用分类与手工上传分类分开，手工文件不参与报告聚合。
    const reportCategories = new Set([
        'credit_report_in', 'credit_report_out', 'material_in', 'material_out',
        'fund_report_in', 'fund_report_out', 'fund_material_in', 'fund_material_out',
        'stock_report_in', 'stock_report_out', 'stock_material_in', 'stock_material_out'
    ]);

    // 仅使用明确的报告来源关联，缺失关联时展示错误，不猜测标题或归属。
    function groupMaterials(files) {
        const result = [];
        const reports = new Map();

        (files || []).forEach((file, index) => {
            if (!reportCategories.has(file.attachmentCategory)) {
                result.push({
                    key: 'file-' + file.id,
                    kind: 'file',
                    file,
                    indexes: [index]
                });
                return;
            }

            // 不完整的来源保留为异常项，避免误展示成可直接下载的手工文件。
            if (!file.sourceReportId || !['internal', 'external'].includes(file.sourceReportSource)) {
                result.push({
                    key: 'invalid-' + file.id,
                    kind: 'invalid',
                    file,
                    indexes: [index]
                });
                return;
            }

            // 内外报告可能使用相同 ID，必须把来源一起作为分组键。
            const key = file.sourceReportSource + '-' + file.sourceReportId;
            if (!reports.has(key)) {
                const report = {
                    key,
                    kind: 'report',
                    id: file.sourceReportId,
                    source: file.sourceReportSource,
                    title: file.sourceReportTitle || '',
                    indexes: []
                };
                reports.set(key, report);
                result.push(report);
            }
            // 保留原列表中的所有索引，移除整份报告时用于删除全部关联。
            reports.get(key).indexes.push(index);
        });
        return result;
    }

    // 在工作台复用同一份报告的页签；单独打开业务页时使用新浏览器页。
    function openReportDetail(report) {
        if (!report || !report.id || !['internal', 'external'].includes(report.source)) {
            throw new Error('报告来源或 ID 缺失，无法查看详情');
        }
        const query = new URLSearchParams({
            source: report.source,
            reportId: report.id
        }).toString();
        const workbench = global.RrsWorkbench;

        // 同一来源和 ID 复用工作台页签，原调库页及未提交内容继续保留。
        if (workbench && workbench.openDetailTab({
            index: workbench.buildTabIndex('report-detail', [report.source, report.id]),
            title: workbench.formatDetailTitle(report.title || report.reportTitle, '报告', '详情'),
            page: 'pages/report_detail.html',
            query
        })) {
            return;
        }

        // 独立页面沿用当前用户上下文，在新浏览器页面查看报告。
        const url = global.RrsAuth.buildPageUrl('report_detail.html?' + query, global.RrsAuth.getCurrentUser());
        global.open(url, '_blank', 'noopener');
    }

    global.RrsReportMaterials = {
        groupMaterials,
        openReportDetail
    };
    if (!global.Vue || !global.Vue.component) {
        return;
    }

    // 已选报告和已绑定报告共用标题入口，点击行为保持一致。
    global.Vue.component('rrs-report-title', {
        props: {
            report: {
                type: Object,
                required: true
            }
        },
        template: `
            <button
                type="button"
                class="rrs-report-link"
                :title="report.title || report.reportTitle"
                @click.stop="open">
                {{ report.title || report.reportTitle }}
            </button>
        `,
        methods: {
            // 打开报告详情，非法来源明确提示。
            open() {
                try {
                    openReportDetail(this.report);
                } catch (e) {
                    this.$message.error(e.message);
                }
            }
        }
    });

    // 材料展示组件只发出下载和移除事件，业务页面负责权限与提交状态。
    global.Vue.component('rrs-report-materials', {
        props: {
            files: {
                type: Array,
                default: () => []
            },
            removable: {
                type: Boolean,
                default: false
            }
        },
        computed: {
            // 同来源、同报告只展示一个入口，内外报告同 ID 不合并。
            items() {
                return groupMaterials(this.files);
            }
        },
        template: `
            <div class="rrs-material-list">
                <div
                    v-for="item in items"
                    :key="item.key"
                    class="rrs-material-item"
                    :class="'is-' + item.kind">
                    <template v-if="item.kind === 'report'">
                        <i class="el-icon-document"></i>
                        <rrs-report-title :report="item"></rrs-report-title>
                        <span class="rrs-material-source">
                            {{ item.source === 'internal' ? '内' : '外' }}
                        </span>
                    </template>
                    <template v-else-if="item.kind === 'file'">
                        <i class="el-icon-paperclip"></i>
                        <button
                            type="button"
                            class="rrs-report-link"
                            :title="item.file.originalFileName"
                            @click.stop="$emit('download', item.file)">
                            {{ item.file.originalFileName }}
                        </button>
                    </template>
                    <span v-else class="rrs-material-error">
                        报告来源缺失（附件 {{ item.file.id }}）
                    </span>
                    <!-- 倒序移除原列表索引，避免前面的删除导致后续索引偏移。 -->
                    <button
                        v-if="removable"
                        type="button"
                        class="rrs-material-remove"
                        :aria-label="'移除' + (item.title || item.file.originalFileName)"
                        @click.stop="$emit('remove', item.indexes.slice().sort((a, b) => b - a))">
                        <i class="el-icon-close"></i>
                    </button>
                </div>
            </div>
        `
    });
})(window);
