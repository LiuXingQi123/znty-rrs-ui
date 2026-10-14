// 无需安装依赖：node --test tests/report_materials.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 加载实际公共组件，模拟工作台和独立浏览器的导航边界。
function harness(inWorkbench = true) {
    const tabs = [], opened = [], components = {};
    const window = {
        Vue: { component(name, options) { components[name] = options; } },
        RrsWorkbench: {
            buildTabIndex: (name, keys) => name + ':' + keys.join(':'),
            formatDetailTitle: title => title,
            openDetailTab: tab => { tabs.push(tab); return inWorkbench; }
        },
        RrsAuth: {
            getCurrentUser: () => ({ userId: '17' }),
            buildPageUrl: url => url + '&loginUserId=17'
        },
        open: (...args) => opened.push(args)
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/report_materials.js'), 'utf8'), { window, URLSearchParams });
    return { ...window.RrsReportMaterials, tabs, opened, components };
}

// 同一报告的两份 PDF 加一份手工 PDF 必须显示两个业务入口。
for (const prefix of ['credit_report', 'material', 'fund_report', 'fund_material', 'stock_report', 'stock_material']) {
    test(prefix + '：两个报告附件聚合成一份报告，手工文件独立', () => {
        const { groupMaterials } = harness();
        const files = [1, 2].map(id => ({ id, attachmentCategory: prefix + '_in', sourceReportId: 20, sourceReportSource: 'internal', sourceReportTitle: '24交投信用债01报告' }));
        files.push({ id: 3, attachmentCategory: prefix + '_hand', originalFileName: '补充材料.pdf' });
        const items = groupMaterials(files);
        assert.equal(items.length, 2);
        assert.equal(items[0].kind, 'report');
        assert.equal(items[0].title, '24交投信用债01报告');
        assert.deepEqual(Array.from(items[0].indexes), [0, 1]);
        assert.equal(items[1].kind, 'file');
        assert.equal(items[1].file.id, 3);
    });
}

test('内部与外部同 ID 报告分别展示；同名手工文件不被误合并', () => {
    const { groupMaterials } = harness();
    const items = groupMaterials([
        { id: 1, attachmentCategory: 'credit_report_in', sourceReportId: 7, sourceReportSource: 'internal', sourceReportTitle: '同名报告' },
        { id: 2, attachmentCategory: 'credit_report_out', sourceReportId: 7, sourceReportSource: 'external', sourceReportTitle: '同名报告' },
        { id: 3, attachmentCategory: 'credit_report_hand', originalFileName: '同名报告.pdf' },
        { id: 4, attachmentCategory: 'credit_report_hand', originalFileName: '同名报告.pdf' }
    ]);
    assert.equal(items.length, 4);
    assert.notEqual(items[0].key, items[1].key);
});

test('来源缺失明确显示异常，不把报告误当成手工 PDF', () => {
    const { groupMaterials } = harness();
    const items = groupMaterials([{ id: 9, attachmentCategory: 'material_in', originalFileName: '报告.pdf' }]);
    assert.equal(items[0].kind, 'invalid');
});

test('工作台报告页签由来源和 ID 共同定位，不跳走调库表单', () => {
    const { openReportDetail, tabs, opened } = harness();
    openReportDetail({ id: 7, source: 'internal', title: '报告' });
    openReportDetail({ id: 7, source: 'external', title: '报告' });
    assert.equal(tabs[0].page, 'pages/report_detail.html');
    assert.equal(new URLSearchParams(tabs[0].query).get('reportId'), '7');
    assert.notEqual(tabs[0].index, tabs[1].index);
    assert.equal(opened.length, 0);
});

test('独立页面在新窗口打开报告并保留当前用户，非法来源不会导航', () => {
    const { openReportDetail, opened } = harness(false);
    openReportDetail({ id: 7, source: 'internal' });
    assert.match(opened[0][0], /report_detail.html\?source=internal&reportId=7&loginUserId=17/);
    assert.deepEqual(opened[0].slice(1), ['_blank', 'noopener']);
    assert.throws(() => openReportDetail({ id: 7, source: 'unknown' }), /来源或 ID 缺失/);
    assert.equal(opened.length, 1);
});

test('移除聚合报告时按倒序删除全部关联，保留手工文件', () => {
    const { groupMaterials } = harness();
    const files = [1, 2].map(id => ({ id, attachmentCategory: 'credit_report_in', sourceReportId: 7, sourceReportSource: 'internal' }));
    files.splice(1, 0, { id: 3, attachmentCategory: 'credit_report_hand' });
    groupMaterials(files)[0].indexes.slice().sort((a, b) => b - a).forEach(index => files.splice(index, 1));
    assert.deepEqual(files.map(file => file.id), [3]);
});

test('所有调库页接入公共入口；详情页保留完整附件列表和单个下载', () => {
    const pages = fs.readdirSync(path.join(__dirname, '../pages')).filter(name => /(?:^batch_|^stock_security_batch_|_pool_adjust(?:_approve|_detail)?\.html$)/.test(name) && !name.includes('_history'));
    for (const name of pages) {
        const html = fs.readFileSync(path.join(__dirname, '../pages', name), 'utf8');
        if (!html.includes('queryInReportPage')) continue;
        assert.ok(html.includes('../js/report_materials.js'), name);
        assert.ok(html.includes('rrs-report-title') || html.includes('rrs-report-materials'), name);
    }
    const html = fs.readFileSync(path.join(__dirname, '../pages/report_detail.html'), 'utf8');
    assert.ok(html.includes(':data="report.attachments"'));
    assert.ok(html.includes('/api/v1/reports/queryReportDetail'));
    assert.ok(html.includes('/api/v1/attachments/downloadAttachment'));
});
