// 无需安装依赖：node --test tests/fund_pool_excel_import.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pages/fund_pool_excel_import.html'), 'utf8');

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
    return { fundCode: '000001.OF', fundShortName: '测试基金', sourceItemId: 10, rowNo: 2, targetPoolId: 1, poolName: '基金库/一级库', adjustDirection: 'in', itemTag: 'manual', adjustGroupKey: 'source-10', canAdjust: true, fundScore: 0, fundInvestmentType: 'stock', needRiskLeaderApproval: 0, flowOptions: [{ flowId: 7, flowKey: 'fund-general', flowType: 'normalInbound', flowName: '基金一般流程', selectable: true, recommended: true }], ...overrides };
}

// 应用已校验批次。
function checked(page, rows = [item()]) {
    page.applyTask({ impId: 'FUND_IMPORT_TEST', checkDone: true, saveRslt: '0', chkRslt: '1', checkItems: rows });
}

test('七列只读预览、两种主项流程和菜单文档入口完整', () => {
    const { page } = harness();
    assert.equal(page.templateColumns.length, 7);
    assert.match(html, /prop="fundScoreRaw"/);
    assert.equal((html.match(/label="Excel行号" prop="rowNo"/g) || []).length, 2);
    assert.match(html, /investmentTypeLabel\(row.fundInvestmentTypeRaw\)/);
    assert.match(html, /riskLeaderLabel\(row.needRiskLeaderApprovalRaw\)/);
    assert.doesNotMatch(html, /v-model(?:\.trim)?="row\.(fundScore|fundInvestmentType|needRiskLeaderApproval)/);
    assert.doesNotMatch(html, /选择报告|上传附件/);
    const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(index, /page: 'pages\/fund_pool_excel_import.html'/);
    assert.match(index, /page: 'docs\/fund-pool-excel-import.html'/);
    assert.match(fs.readFileSync(path.join(root, 'docs/module-tables-index.html'), 'utf8'), /href="fund-pool-excel-import.html"/);
});

test('数字零、否值和非法投资类型原值均不丢失', () => {
    const { page } = harness();
    assert.equal(page.hasValue(0), true); assert.equal(page.riskLeaderLabel(0), '否');
    assert.equal(page.investmentTypeLabel('stock'), '股票型');
    assert.equal(page.investmentTypeLabel('illegal_type'), 'illegal_type');
    assert.equal(page.riskLeaderLabel('2'), '2'); assert.equal(page.hasValue(null), false);
    page.form.clearTarget = true; page.form.clearFundScore = '0'; page.form.clearFundInvestmentType = 'stock'; page.form.clearNeedRiskLeaderApproval = 0;
    assert.equal(page.validateImportParameters(), '');
    page.form.clearFundScore = 'NaN'; assert.match(page.validateImportParameters(), /评分/);
    page.form.direction = 'out'; assert.equal(page.validateImportParameters(), '');
    page.onDirectionChange('out'); assert.equal(page.form.clearTarget, false);
});

test('上传传递清空三字段并锁定参数，已提交批次不上传', async () => {
    const { page } = harness(); const requests = [];
    Object.assign(page.form, { clearTarget: true, clearFundScore: '0', clearFundInvestmentType: 'money_market', clearNeedRiskLeaderApproval: 0 });
    page.apiPost = async (url, body) => { requests.push({ url, body }); return { impId: 'I1', saveRslt: '0', items: { records: [], total: 0 } }; };
    await page.processSelectedFile(new File(['xls'], '基金.xlsx'));
    assert.equal(requests.length, 1); assert.match(requests[0].url, /fundPoolExcelImport\/uploadExcel$/);
    const body = JSON.parse(await requests[0].body.get('request').text());
    assert.equal(body.clearFundScore, 0); assert.equal(body.clearNeedRiskLeaderApproval, 0); assert.equal(body.clearFundInvestmentType, 'money_market');
    assert.equal(requests[0].body.get('originalFileNameListJson'), '["基金.xlsx"]');
    assert.equal(page.parametersLocked, true); assert.equal(page.loading, false);
    page.task.saveRslt = '1'; await page.processSelectedFile(new File(['new'], 'new.xlsx'));
    assert.equal(requests.length, 1);
});

test('非法文件不取消旧批次；取消失败保留结果并释放 loading', async () => {
    const { page } = harness(); checked(page); const previous = page.checkItems;
    let requests = 0; page.apiPost = async () => { requests++; throw new Error('取消失败'); };
    await page.processSelectedFile(new File(['x'], 'wrong.txt'));
    await page.processSelectedFile({ name: 'large.xlsx', size: 6 * 1024 * 1024 });
    assert.equal(requests, 0); assert.equal(page.impId, 'FUND_IMPORT_TEST');
    await page.processSelectedFile(new File(['xls'], 'new.xlsx'));
    assert.equal(requests, 1); assert.equal(page.checkItems, previous); assert.equal(page.loading, false);
    await page.handleReset(); assert.equal(page.impId, 'FUND_IMPORT_TEST'); assert.equal(page.parametersLocked, true);
});

test('同基金来源行独立，失败主项阻止自身附属项提交', () => {
    const { page } = harness();
    checked(page, [item({ canAdjust: false }), item({ itemTag: 'linkage', targetPoolId: 2, flowOptions: [] }), item({ sourceItemId: 20, adjustGroupKey: 'source-20', targetPoolId: 3 })]);
    assert.equal(page.validCheckItems.length, 1); assert.equal(page.validCheckItems[0].sourceItemId, 20);
    assert.equal(page.canSubmit, true);
    const passed = page.validCheckItems[0]; const identity = [passed.fundCode, passed.targetPoolId, passed.adjustDirection, passed.sourceItemId].join('|');
    passed.selectedFlowOptionKey = 'forged'; page.handleRowFlowChange(passed);
    assert.equal(page.canSubmit, false); assert.equal(page.flowDialogVisible, false);
    assert.equal([passed.fundCode, passed.targetPoolId, passed.adjustDirection, passed.sourceItemId].join('|'), identity);
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
    page.apiPost = async (url, body) => { calls.push({ url, body }); return url.endsWith('queryItemPage') ? { records: [{ rowNo: 22 }], total: 50 } : { impId: 'FUND_IMPORT_TEST', checkItems: rows, items: { records: [{ rowNo: 2 }], total: 50, pageIndex: 1 } }; };
    await page.loadItemPage();
    assert.equal(calls[0].body.pageIndex, 2); assert.equal(calls[0].body.chkRslt, '2'); assert.equal(calls[0].body.keyword, '000001');
    assert.equal(page.tableData[0].rowNo, 22); assert.equal(page.pagination.pageIndex, 2); assert.equal(page.checkItems[0].selectedFlowKey, 'other');
});

test('仅回传快照流程，提交状态防重且反馈申请数量和管理员批次', async () => {
    const { page, messages } = harness(); checked(page); const requests = [];
    page.apiPost = async (url, body) => { requests.push({ url, body }); return { impId: 'FUND_IMPORT_TEST', saveRslt: '1', logIds: [101, 102], adjustBatchNoList: ['FUND202610060001'] }; };
    await page.confirmFlowSelection();
    const submitted = requests[0].body.checkItems[0];
    assert.equal(submitted.selectedFlowId, 7); assert.equal(submitted.selectedFlowKey, 'fund-general'); assert.equal(submitted.selectedFlowType, 'normalInbound');
    assert.equal(submitted.fundScore, 0); assert.equal(submitted.fundCode, '000001.OF'); assert.equal(submitted.adjustDirection, 'in');
    assert.equal('selectedFlowOptionKey' in submitted, false); assert.equal('flowOptions' in submitted, false);
    assert.equal(page.isSubmitted, true); assert.equal(page.canSubmit, false); assert.equal(page.isUploadDisabled, true); assert.equal(page.submitting, false);
    assert.match(messages.at(-1).text, /申请已提交，共 2 条.*FUND202610060001/);
    assert.doesNotMatch(messages.at(-1).text, /入池成功/);
    await page.confirmFlowSelection(); await page.handleCheck(); assert.equal(requests.length, 1);
});

test('成功清空解锁参数；已提交批次仅清空页面不调用取消', async () => {
    const { page } = harness(); checked(page); const calls = [];
    page.apiPost = async url => { calls.push(url); };
    await page.handleReset(); assert.equal(calls.length, 1); assert.match(calls[0], /cancelImport$/); assert.equal(page.parametersLocked, false); assert.equal(page.checkItems.length, 0);
    checked(page); page.task.saveRslt = '1'; await page.handleReset(); assert.equal(calls.length, 1); assert.equal(page.impId, '');
});
