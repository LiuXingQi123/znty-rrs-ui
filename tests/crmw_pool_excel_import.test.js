// 无需安装依赖：node --test tests/crmw_pool_excel_import.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../pages/crmw_pool_excel_import.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/crmw_pool_excel_import.css'), 'utf8');

// 执行页面真实归一化、筛选和提交方法，接口仅在内存中截获
function harness() {
    let options;
    const window = {
        location: { search: '', hash: '' },
        RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) }
    };
    const context = vm.createContext({ Vue: function(config) { options = config; }, window, URLSearchParams });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = { ...options.data(), $nextTick() {}, $set(object, key, value) { object[key] = value; } };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.entries(options.computed).forEach(([key, method]) => {
        Object.defineProperty(page, key, { get: method.bind(page) });
    });
    page.$message = { success() {}, warning(message) { assert.fail(message); } };
    page.currentUser = { userId: '1', userName: '测试用户' };
    page.onTableDataChange = options.watch.tableData.bind(page);
    return page;
}

function manual() {
    return {
        sourceItemId: 10, sourceSecurityCode: '108008901.IB', securityCode: '108008901.IB',
        crmwScode: 'C.IB', crmwStype: 'crmw', targetPoolId: 5, itemTag: 'manual', adjustGroupKey: 'G1', adjustMode: '调入', canAdjust: true,
        failReasons: ['证券当前在调入限制池中：债券禁止库', '证券当前在禁止池中'],
        flowId: 107, flowKey: 'bond:batch', flowType: 'batchInbound',
        flowOptions: [{ flowId: 107, flowKey: 'bond:batch', flowType: 'batchInbound', selectable: true, recommended: true }]
    };
}

test('两张表优先展示组合标识和业务操作列', () => {
    const importTable = html.split('class="table-wrap table-wrap-import"')[1].split('</el-table>')[0];
    const checkTable = html.split('class="table-wrap table-wrap-check"')[1].split('</el-table>')[0];
    const labels = table => Array.from(table.matchAll(/<el-table-column\b[^>]*\blabel="([^"]+)"/g), match => match[1]);
    const identity = ['序号', 'CRMW代码', 'CRMW全称', '证券代码', '证券全称'];

    assert.deepEqual(labels(importTable).slice(0, 9), [...identity, '担保人', '权益人', '自选权益人', '担保人主体内评分']);
    assert.deepEqual(labels(checkTable).slice(0, 10), [...identity, '审批流程', '调整说明', '调整类型', '调整方向', '投资池名称']);
    assert.match(checkTable, /prop="targetPoolName" label="投资池名称"/);
    assert.match(importTable, /label="校验说明"[^>]*fixed="right"/);
    assert.match(checkTable, /label="校验结果"[^>]*fixed="right"/);
});

test('导入明细和校验结果共用表格布局，明细渲染后对齐固定列', () => {
    const page = harness();
    const calls = [];
    let afterRender;
    page.$nextTick = callback => { afterRender = callback; };
    page.$refs = { importTable: { doLayout() { calls.push('layout'); } } };

    page.onTableDataChange();
    assert.deepEqual(calls, []);
    afterRender();

    assert.deepEqual(calls, ['layout']);
    assert.match(html, /<el-table ref="importTable" :data="tableData"/);
    assert.match(css, /\.table-wrap-import,\s*#crmw_pool_excel_import \.table-wrap-check \{[^}]*flex: 1;/);
});

test('有业务调整提示的行仍进入提交集合，同组关联项一并提交', async () => {
    const page = harness();
    const row = manual();
    const related = { ...row, securityCode: 'RELATED.SH', itemTag: 'related', flowOptions: [] };
    page.applyTask({ impId: 'EXCEL_TIPS', saveRslt: '0', chkRslt: '1', checkDone: true,
        checkItems: [row, related], checkPassCount: 2, checkFailCount: 0 });
    assert.equal(page.selectedCheckCount, 2);
    assert.equal(page.canSubmit, true);
    assert.equal(page.allSelectedRowsHaveFlow, true);
    let captured;
    page.apiPost = async (url, body) => { captured = { url, body }; return {}; };
    await page.confirmFlowSelection();
    assert.equal(captured.url, '/api/v1/crmwPoolExcelImport/submitImport');
    assert.equal(captured.body.checkItems.length, 2);
    assert.deepEqual(Array.from(captured.body.checkItems[0].failReasons), row.failReasons);
    assert.equal(captured.body.checkItems[0].flowType, 'batchInbound');
    assert.equal(captured.body.checkItems[0].flowId, 107);
    assert.equal(captured.body.checkItems[1].itemTag, 'related');
});

test('校验结果可调整项在前，保留组底色和不可调整原因', async () => {
    const page = harness();
    const main = manual();
    const unknown = { securityCode: 'UNKNOWN', canAdjust: false, failReasons: ['证券不存在'] };
    const duplicate = { ...main, sourceItemId: 11, canAdjust: false, flowOptions: [],
        failReasons: ['Excel 内相同 CRMW 代码、证券代码与子池重复'] };
    const related = { ...main, securityCode: 'RELATED.SH', itemTag: 'related', flowOptions: [] };
    page.applyTask({ impId: 'EXCEL_MIXED', saveRslt: '0', chkRslt: '2', checkDone: true,
        checkItems: [unknown, main, duplicate, related] });
    assert.deepEqual(Array.from(page.checkItems, row => row.securityCode),
        ['108008901.IB', 'RELATED.SH', 'UNKNOWN', '108008901.IB']);
    assert.equal(page.selectedCheckCount, 2);
    assert.equal(page.checkItems[0].failReasons.length, 2);
    assert.equal(page.checkItems[0].groupColorIndex, page.checkItems[1].groupColorIndex);
    assert.equal(page.checkItems[2].failReasons[0], '证券不存在');
    assert.equal(page.isCheckRowSelected(page.checkItems[3]), false);

    page.setCheckItemSelected(page.checkItems[0], false);
    assert.equal(page.allCheckItemsSelected, false);
    let submitted;
    page.apiPost = async (url, request) => { submitted = request.checkItems; return {}; };
    await page.confirmFlowSelection();
    assert.deepEqual(Array.from(submitted, row => row.securityCode), ['RELATED.SH']);
});

test('校验全部可调整但有调整提示时显示警告', async () => {
    const page = harness();
    const messages = [];
    page.impId = 'EXCEL_TIPS';
    page.$message = { success: text => messages.push(['success', text]), warning: text => messages.push(['warning', text]) };
    page.apiPost = async () => ({ impId: page.impId, chkRslt: '1', checkDone: true, checkItems: [manual()] });

    await page.handleCheck();

    assert.deepEqual(messages, [['warning', '全部可调整，存在调整提示']]);
    assert.equal(page.selectedCheckCount, 1);

    page.apiPost = async () => ({ impId: page.impId, chkRslt: '1', checkDone: true,
        checkItems: [{ ...manual(), failReasons: [] }] });
    await page.handleCheck();
    assert.deepEqual(messages[1], ['success', '校验全部通过']);
});

test('默认推荐批量流程，手动改选单笔后提交保留该选择', async () => {
    const page = harness();
    const row = manual();
    row.flowOptions.push({ flowId: 101, flowKey: 'crmw:normal', flowType: 'normalInbound', selectable: true, recommended: false });
    page.applyTask({ impId: 'EXCEL_FLOW', saveRslt: '0', chkRslt: '1', checkDone: true, checkItems: [row] });
    const selected = page.checkItems[0];
    assert.equal(selected.flowType, 'batchInbound');
    selected.selectedFlowKey = selected.flowOptions.find(option => option.flowType === 'normalInbound').optionKey;
    page.handleRowFlowChange(selected);
    let payload;
    page.apiPost = async (url, body) => { payload = body; return {}; };
    await page.confirmFlowSelection();
    assert.equal(payload.checkItems[0].flowId, 101);
    assert.equal(payload.checkItems[0].flowType, 'normalInbound');
});

test('提交响应按页面选项键回显无需审批', () => {
    const page = harness();
    const row = manual();
    row.flowOptions.push({ flowType: 'normalInbound', selectable: true });
    Object.assign(row, {
        flowId: null, flowKey: null, flowType: 'normalInbound', directFlow: true,
        selectedFlowKey: '0_normalInbound_1',
    });

    page.applyTask({ impId: 'EXCEL_DIRECT', saveRslt: '1', chkRslt: '1', checkDone: true, checkItems: [row] });

    assert.equal(page.checkItems[0].selectedFlowKey, '0_normalInbound_1');
    assert.equal(page.checkItems[0].flowName, '无需审批');
    assert.equal(page.checkItems[0].directFlow, true);
});

test('单笔与批量共用流程定义时按所选类型回显', () => {
    const page = harness();
    const row = manual();
    row.flowOptions.push({ ...row.flowOptions[0], flowType: 'normalInbound', recommended: false });
    row.flowType = 'normalInbound';
    row.selectedFlowKey = 'normalInbound_107_bond:batch';

    page.applyTask({ impId: 'EXCEL_FLOW', saveRslt: '1', checkDone: true,
        checkItems: [{ securityCode: 'UNKNOWN', canAdjust: false }, row] });

    assert.equal(page.checkItems[0].flowType, 'normalInbound');
    assert.equal(page.selectedCheckCount, 1);
});

test('可调整行展示调整提示，主体冲突等不可调整行展示未通过', () => {
    assert.match(html, /v-if="row\.failReasons && row\.failReasons\.length"/);
    assert.doesNotMatch(html, /v-if="!row\.canAdjust && row\.failReasons/);
    assert.match(html, /row\.canAdjust \? '调整提示' : '未通过'/);
    assert.match(html, /row\.canAdjust \? '可调整' : '不可调整'/);
});

test('主体冲突留在调整说明中，并从可提交集合排除', () => {
    const page = harness();
    const conflict = { ...manual(), canAdjust: false, flowOptions: [], failReasons: [
        'ABS[108008901.IB]已被在库或在途主体[C10008]占用，不能以主体[C10010]进入其他库'
    ] };
    page.applyTask({ impId: 'EXCEL_ABS_CONFLICT', saveRslt: '0', chkRslt: '2', checkDone: true,
        checkItems: [conflict], checkPassCount: 0, checkFailCount: 1 });
    assert.equal(page.selectedCheckCount, 0);
    assert.equal(page.canSubmit, false);
    assert.match(page.checkItems[0].failReasons[0], /C10008.*C10010/);
});

test('校验结果显示来源行的主体名称和代码，旧结果使用已保存的主体快照', () => {
    assert.match(html, /label="权益人\/担保人名称" prop="ratingCompanyName"/);
    assert.match(html, /label="权益人\/担保人代码" prop="ratingCompanyCode"/);
    const page = harness();
    const rows = page.normalizeCheckItems([
        { ...manual(), selectedRatingCompany: { companyName: '自选权益人', companyCode: 'S1' } },
        { canAdjust: false, ratingCompanyName: '关联主体', ratingCompanyCode: 'R1' },
        { canAdjust: false },
    ]);
    assert.equal(rows[0].ratingCompanyName, '自选权益人');
    assert.equal(rows[0].ratingCompanyCode, 'S1');
    assert.equal(rows[1].ratingCompanyName, '关联主体');
    assert.equal(rows[1].ratingCompanyCode, 'R1');
    assert.equal(rows[2].ratingCompanyName, undefined);
    assert.equal(rows[2].ratingCompanyCode, undefined);
});

test('ABS 自选权益人按行保存并清除旧校验，担保人及其内评独立保留', async () => {
    const page = harness();
    const related = { companyCode: 'R1', companyName: '关联主体', relationTypeCode: '115200000', innerRating: '3' };
    const guarantor = { companyCode: 'G1', companyName: '担保主体', relationTypeCode: '115004000', innerRating: '4' };
    const self = { companyCode: 'S1', companyName: '自选主体', innerRating: '2' };
    const first = { id: 10, securityType: 'abs', guarantFlag: 1, guarantorCode: 'G1',
        relatedCompanyCode: 'R1', relatedRatingCompanies: [guarantor, related] };
    const second = { ...first, id: 11 };
    page.applyTask({ impId: 'IMP_ABS', saveRslt: '0', checkDone: true,
        checkItems: [manual()], items: { records: [first, second] } });
    assert.equal(page.guarantorRating(page.tableData[0]), '4');

    const saved = [];
    page.apiPost = async (url, body) => {
        assert.equal(url, '/api/v1/crmwPoolExcelImport/editRatingCompany');
        saved.push(body);
        const row = { ...first, selfSelectedRightsHolderCode: body.selfSelectedRightsHolderCode,
            selfSelectedRightsHolder: body.selfSelectedRightsHolderCode ? self : null };
        return { impId: 'IMP_ABS', saveRslt: '0', checkDone: false,
            checkItems: [], items: { records: [row, second] } };
    };

    assert.equal(await page.saveRatingCompany(page.tableData[0], 'S1'), true);
    assert.equal(saved[0].itemId, 10);
    assert.equal(saved[0].relatedCompanyCode, 'R1');
    assert.equal(saved[0].guarantorCode, 'G1');
    assert.equal(saved[0].selfSelectedRightsHolderCode, 'S1');
    assert.equal(page.tableData[0].selectedSelfRightsHolder.innerRating, '2');
    assert.equal(page.tableData[1].selectedSelfRightsHolder, null);
    assert.equal(page.guarantorRating(page.tableData[0]), '4');
    assert.equal(page.canSubmit, false);
    assert.equal(page.checkItems.length, 0);

    await page.clearSelfRightsHolder(page.tableData[0]);
    assert.equal(saved[1].selfSelectedRightsHolderCode, '');
    assert.equal(page.tableData[0].selectedRelatedCompanyCode, 'R1');
    assert.equal(page.guarantorRating(page.tableData[0]), '4');
});


test('审核和详情正确显示批量流程标签', () => {
    for (const name of ['crmw_pool_adjust_approve', 'crmw_pool_adjust_detail']) {
        const source = fs.readFileSync(path.join(__dirname, '../pages/' + name + '.html'), 'utf8');
        const method = source.match(/flowTypeLabel\(type\)\s*\{([\s\S]*?)\n\s*\},/);
        assert.ok(method);
        const label = new Function('type', method[1]);
        assert.equal(label('batchInbound'), '批量调入');
        assert.equal(label('batchOutbound'), '批量调出');
    }
});
