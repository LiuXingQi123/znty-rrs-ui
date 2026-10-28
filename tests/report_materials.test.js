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

// 加载调库页面的真实方法，提交请求由测试截获，不上传文件或写入业务数据
function bondAdjustPage(name) {
    let options;
    const window = {
        location: { search: '', hash: '' },
        RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) }
    };
    const context = vm.createContext({ Vue: function(config) { options = config; }, window, URLSearchParams, moment() {} });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    const html = fs.readFileSync(path.join(__dirname, '../pages', name), 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = { ...options.data() };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    page.$message = { success() {}, error(message) { assert.fail(message); } };
    page.backToList = () => {};
    return page;
}

const bondAdjustPages = ['security_pool_adjust.html', 'security_pool_adjust_detail.html', 'security_pool_adjust_approve.html'];
for (const name of bondAdjustPages) {
    for (const exemption of ['', 'productSource']) {
        test(name + '：' + (exemption ? '免材料' : '普通') + '申请同时提交报告库引用和本地文件', async () => {
            const page = bondAdjustPage(name);
            const creditFile = { name: '上传信评.pdf' }, materialFile = { name: '上传材料.pdf' };
            page.bondDetail = { windCode: '108008901.IB', shortName: '测试券', securityType: 'bond' };
            page.adjustReviewList = [{
                valid: true, itemTag: 'manual', adjustGroupKey: 'G1', poolId: 10, direction: '调入',
                flowId: 107, flowKey: 'bond:batch', flowType: 'batchInbound', materialExemptionType: exemption,
                creditReports: [{ attachments: [{ id: 701 }, { id: 703 }] }, { attachments: [{ id: 701 }] }],
                otherMaterials: [{ attachments: [{ id: 702 }] }],
                attachmentFiles: [{ raw: creditFile }], materialFiles: [{ raw: materialFile }]
            }, {
                valid: false, poolId: 11, creditReports: [{ attachments: [{ id: 799 }] }],
                attachmentFiles: [{ raw: { name: '无效项.pdf' } }]
            }];
            let captured;
            page.submitAdjustMultipart = async (url, payload, files) => { captured = { url, payload, files }; };
            await page.submitAdjustLog();
            assert.ok(captured, '实际提交方法必须发送请求');
            assert.equal(captured.url, '/api/v1/securityPoolAdjust/addAdjustLogWithFiles');
            assert.equal(captured.payload.items.length, 1, '不可调整项不提交');
            const item = captured.payload.items[0];
            assert.deepEqual(Array.from(item.creditReportSourceAttachmentIds || []), [701, 703]);
            assert.deepEqual(Array.from(item.materialSourceAttachmentIds || []), [702]);
            assert.deepEqual(Array.from(item.creditReportFileIndexes), [0]);
            assert.deepEqual(Array.from(item.materialFileIndexes), [1]);
            assert.equal(captured.files.length, 2);
            assert.equal(captured.files[0], creditFile);
            assert.equal(captured.files[1], materialFile);
            assert.equal(item.materialExemptionType, exemption, '豁免不丢弃用户选择的材料');
            assert.equal(item.flowId, 107);
            assert.equal(item.flowType, 'batchInbound');
            assert.equal(page.submitLoading, false);
        });
    }

    test(name + '：未选择报告库材料时，本地上传仍独立提交', async () => {
        const page = bondAdjustPage(name);
        const file = { name: '仅上传.pdf' };
        page.bondDetail = { windCode: '108008901.IB', securityType: 'bond' };
        page.adjustReviewList = [{
            valid: true, itemTag: 'manual', poolId: 10, direction: '调入', attachmentFiles: [{ raw: file }]
        }];
        let captured;
        page.submitAdjustMultipart = async (url, payload, files) => { captured = { payload, files }; };
        await page.submitAdjustLog();
        const item = captured.payload.items[0];
        assert.deepEqual(Array.from(item.creditReportSourceAttachmentIds || []), []);
        assert.deepEqual(Array.from(item.materialSourceAttachmentIds || []), []);
        assert.deepEqual(Array.from(item.creditReportFileIndexes), [0]);
        assert.equal(captured.files.length, 1);
        assert.equal(captured.files[0], file);
    });
}

test('审核修改节点同时保留报告库引用、本地上传和删除记录', () => {
    const page = bondAdjustPage('security_pool_adjust_approve.html');
    const file = { name: '审核补充.pdf' };
    const log = { id: 123, targetPoolId: 10 };
    const key = page.getLogRowKey(log);
    page.adjustLogList = [log];
    page.attachmentFiles = { [key]: [{ raw: file }] };
    page.materialFiles = {};
    page.creditReportSelections = { [key]: [{ attachments: [{ id: 701 }] }] };
    page.otherMaterialSelections = { [key]: [{ attachments: [{ id: 702 }] }] };
    page.deletedAttachmentIds = { [key]: [700] };
    const files = [];
    const changes = page.buildAuditAttachmentChanges(files);
    assert.deepEqual(JSON.parse(JSON.stringify(changes)), [{
        adjustLogId: 123, creditReportFileIndexes: [0], materialFileIndexes: [],
        creditReportSourceAttachmentIds: [701], materialSourceAttachmentIds: [702], deleteAttachmentIds: [700]
    }]);
    assert.equal(files[0], file);
});
