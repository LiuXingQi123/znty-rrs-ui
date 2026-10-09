// 无需安装依赖：node --test tests/stock_pool_excel_import.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pages/stock_pool_excel_import.html'), 'utf8');

// 以页面实际 Vue 方法执行行为，接口由测试替身返回。
function harness(userId = '1') {
    let options;
    function Vue(config) { options = config; }
    const context = vm.createContext({ Vue, FormData, Blob, Uint8Array, atob, URL, window: { RrsAuth: { getCurrentUser: () => ({ userId, userName: '测试用户' }) } }, moment: () => ({ format: () => '2026-10-06' }) });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (match[1].trim()) vm.runInContext(match[1], context);
    const messages = [];
    const page = { ...options.data(), $set: (object, key, value) => { object[key] = value; }, $message: Object.fromEntries(['success', 'warning', 'error'].map(type => [type, text => messages.push({ type, text })])) };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.entries(options.computed).forEach(([key, getter]) => { Object.defineProperty(page, key, { get: () => getter.call(page) }); });
    return { page, messages };
}

// 默认一般流程及独立来源行。
function item(overrides = {}) {
    return { stockCode: '600001.SH', stockShortName: '测试股票', sourceItemId: 10, rowNo: 2, targetPoolId: 1, poolName: '股票库/一级库', adjustDirection: 'in', itemTag: 'manual', adjustGroupKey: 'source-10', canAdjust: true, flowOptions: [{ flowId: 7, flowKey: 'stock-general', flowType: 'normalInbound', flowName: '股票一般流程', selectable: true, recommended: true }], ...overrides };
}

// 应用已校验批次。
function checked(page, rows = [item()]) {
    page.applyTask({ impId: 'STOCK_IMPORT_TEST', checkDone: true, saveRslt: '0', chkRslt: '1', checkItems: rows });
}

test('四列只读预览、两种主项流程和菜单文档入口完整', () => {
    const { page } = harness();
    assert.equal(page.templateColumns.length, 4);
    assert.match(html, /prop="stockName"/); assert.match(html, /prop="stockCode"/);
    assert.equal((html.match(/label="Excel行号" prop="rowNo"/g) || []).length, 2);
    assert.doesNotMatch(html, /v-model(?:\.trim)?="row\.(stockScore|stockInvestmentType|needRiskLeaderApproval)/);
    assert.doesNotMatch(html, /选择报告|上传附件/);
    const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(index, /page: 'pages\/stock_pool_excel_import.html'/);
    assert.match(index, /page: 'docs\/stock-pool-excel-import.html'/);
    assert.match(fs.readFileSync(path.join(root, 'docs/module-tables-index.html'), 'utf8'), /href="stock-pool-excel-import.html"/);
});


test('上传传递固定选项并锁定参数，已提交批次不上传', async () => {
    const { page } = harness(); const requests = [];
    Object.assign(page.form, { clearTarget: true, allowLinkMutex: false });
    page.apiPost = async (url, body) => { requests.push({ url, body }); return { impId: 'I1', saveRslt: '0', items: { records: [], total: 0 } }; };
    await page.processSelectedFile(new File(['xls'], '股票.xlsx'));
    assert.equal(requests.length, 1); assert.match(requests[0].url, /stockPoolExcelImport\/uploadExcel$/);
    const body = JSON.parse(await requests[0].body.get('request').text());
    assert.equal(body.clearTarget, true); assert.equal(body.allowLinkMutex, false);
    assert.equal(requests[0].body.get('originalFileNameListJson'), '["股票.xlsx"]');
    assert.equal(page.parametersLocked, true); assert.equal(page.loading, false);
    page.task.saveRslt = '1'; await page.processSelectedFile(new File(['new'], 'new.xlsx'));
    assert.equal(requests.length, 1);
});

test('非法文件不取消旧批次；取消失败保留结果并释放 loading', async () => {
    const { page } = harness(); checked(page); const previous = page.checkItems;
    let requests = 0; page.apiPost = async () => { requests++; throw new Error('取消失败'); };
    await page.processSelectedFile(new File(['x'], 'wrong.txt'));
    await page.processSelectedFile({ name: 'large.xlsx', size: 6 * 1024 * 1024 });
    assert.equal(requests, 0); assert.equal(page.impId, 'STOCK_IMPORT_TEST');
    await page.processSelectedFile(new File(['xls'], 'new.xlsx'));
    assert.equal(requests, 1); assert.equal(page.checkItems, previous); assert.equal(page.loading, false);
    await page.handleReset(); assert.equal(page.impId, 'STOCK_IMPORT_TEST'); assert.equal(page.parametersLocked, true);
});

test('同股票来源行独立，失败主项阻止自身附属项提交', () => {
    const { page } = harness();
    checked(page, [item({ canAdjust: false }), item({ itemTag: 'linkage', targetPoolId: 2, flowOptions: [] }), item({ sourceItemId: 20, adjustGroupKey: 'source-20', targetPoolId: 3 })]);
    assert.equal(page.validCheckItems.length, 1); assert.equal(page.validCheckItems[0].sourceItemId, 20);
    assert.equal(page.canSubmit, true);
    const passed = page.validCheckItems[0]; const identity = [passed.stockCode, passed.targetPoolId, passed.adjustDirection, passed.sourceItemId].join('|');
    passed.selectedFlowOptionKey = 'forged'; page.handleRowFlowChange(passed);
    assert.equal(page.canSubmit, false); assert.equal(page.flowDialogVisible, false);
    assert.equal([passed.stockCode, passed.targetPoolId, passed.adjustDirection, passed.sourceItemId].join('|'), identity);
});

test('清空与手工项都要求可选流程，不允许孤立联动项提交', () => {
    const { page } = harness();
    checked(page, [item(), item({ sourceItemId: 30, itemTag: 'clear', targetPoolId: 5, adjustDirection: 'out', flowOptions: [{ flowId: 8, flowKey: 'out', flowType: 'normalOutbound', selectable: false }] })]);
    assert.equal(page.validManualCheckItems.length, 2); assert.equal(page.canSubmit, false);
    page.openSubmitDialog(); assert.equal(page.flowDialogVisible, false);
    checked(page, [item({ itemTag: 'linkage' })]); assert.equal(page.canSubmit, false);
    checked(page); page.openSubmitDialog(); assert.equal(page.flowDialogVisible, true);
});

test('重新校验失败清除旧快照，不能继续提交', async () => {
    const { page } = harness(); checked(page);
    page.apiPost = async () => { throw new Error('校验失败'); };
    await page.handleCheck();
    assert.equal(page.checkItems.length, 0); assert.equal(page.task.checkDone, false); assert.equal(page.canSubmit, false); assert.equal(page.checking, false);
});

test('分页查询保留明细页，刷新摘要不覆盖流程选择', async () => {
    const { page } = harness();
    const rows = [item({ flowOptions: [...item().flowOptions, { flowId: 8, flowKey: 'other', flowType: 'normalInbound', selectable: true }] })];
    checked(page, rows); page.checkItems[0].selectedFlowOptionKey = '0_1'; page.handleRowFlowChange(page.checkItems[0]);
    page.pagination.pageIndex = 2; page.filterChkRslt = '2'; page.keyword = '000001';
    const calls = [];
    page.apiPost = async (url, body) => { calls.push({ url, body }); return url.endsWith('queryItemPage') ? { records: [{ rowNo: 22 }], total: 50 } : { impId: 'STOCK_IMPORT_TEST', checkItems: rows, items: { records: [{ rowNo: 2 }], total: 50, pageIndex: 1 } }; };
    await page.loadItemPage();
    assert.equal(calls[0].body.pageIndex, 2); assert.equal(calls[0].body.chkRslt, '2'); assert.equal(calls[0].body.keyword, '000001');
    assert.equal(page.tableData[0].rowNo, 22); assert.equal(page.pagination.pageIndex, 2); assert.equal(page.checkItems[0].selectedFlowKey, 'other');
});

test('仅回传快照流程，提交状态防重且反馈申请数量和管理员批次', async () => {
    const { page, messages } = harness(); checked(page); const requests = [];
    page.apiPost = async (url, body) => { requests.push({ url, body }); return { impId: 'STOCK_IMPORT_TEST', saveRslt: '1', logIds: [101, 102], adjustBatchNoList: ['STOCK202610060001'] }; };
    await page.confirmFlowSelection();
    const submitted = requests[0].body.checkItems[0];
    assert.equal(submitted.stockCode, '600001.SH'); assert.equal(submitted.adjustDirection, 'in'); assert.equal(submitted.sourceItemId, 10);
    assert.equal(submitted.selectedFlowId, 7); assert.equal(submitted.selectedFlowKey, 'stock-general'); assert.equal(submitted.selectedFlowType, 'normalInbound');
    assert.equal('selectedFlowOptionKey' in submitted, false); assert.equal('flowOptions' in submitted, false);
    assert.equal(page.isSubmitted, true); assert.equal(page.canSubmit, false); assert.equal(page.isUploadDisabled, true); assert.equal(page.submitting, false);
    assert.match(messages.at(-1).text, /申请已提交，共 2 条.*STOCK202610060001/);
    assert.doesNotMatch(messages.at(-1).text, /入池成功/);
    await page.confirmFlowSelection(); await page.handleCheck(); assert.equal(requests.length, 1);
});

test('成功清空解锁参数；已提交批次仅清空页面不调用取消', async () => {
    const { page } = harness(); checked(page); const calls = [];
    page.apiPost = async url => { calls.push(url); };
    await page.handleReset(); assert.equal(calls.length, 1); assert.match(calls[0], /cancelImport$/); assert.equal(page.parametersLocked, false); assert.equal(page.checkItems.length, 0);
    checked(page); page.task.saveRslt = '1'; await page.handleReset(); assert.equal(calls.length, 1); assert.equal(page.impId, '');
});
