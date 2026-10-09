// 无需安装依赖：node --test tests/batch_stock_pool_adjust.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pages/batch_stock_pool_adjust.html'), 'utf8');

// 执行实际页面 Vue 方法，隔离浏览器组件和网络请求。
function harness() {
    let options;
    function Vue(config) { options = config; }
    const context = vm.createContext({
        Vue, FormData, Blob, File, Uint8Array, atob, URL,
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '8', userName: '股票研究员' }) } },
        moment: () => ({ format: () => '2026-10-09' })
    });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const messages = [];
    const page = {
        $refs: {}, $nextTick: callback => callback(),
        $set: (object, key, value) => { object[key] = value; },
        $message: Object.fromEntries(['success', 'warning', 'error'].map(type => [type, text => messages.push({ type, text })]))
    };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.assign(page, options.data.call(page));
    Object.entries(options.computed).forEach(([key, getter]) => { Object.defineProperty(page, key, { get: () => getter.call(page) }); });
    return { page, messages };
}

// 股票单笔返回的校验主项与一般流程候选。
function item(overrides = {}) {
    return {
        stockCode: '600001.SH', stockShortName: '测试股票', targetPoolId: 50, poolName: '股票库/一级库', poolType: 'normal',
        adjustMode: '调入', itemTag: 'manual', adjustGroupKey: 'in-50', canAdjust: true, failReasons: [], warnings: [],
        flowOptions: [{ flowId: 7, flowKey: 'stock-general', flowType: 'normalInbound', flowName: '股票一般流程', selectable: true, recommended: true }],
        ...overrides
    };
}

// 报告编码保留精确证券归属，报告类型仍沿用单笔允许的类型。
function report(overrides = {}) {
    return { id: 1, title: '股票研究报告', securityCode: '600001.SH', securityType: 'stock', reportType: 'other_report', source: 'internal', attachments: [{ id: 101 }], ...overrides };
}

// 将后端完整校验结果放入工作台，并保留跨页已选股票。
function reviewed(page, rows = [item()]) {
    page.currentPool = { id: 50, poolFullName: '股票库/一级库' };
    page.pageMode = 'adjustWorkbench';
    page.selectedStockMap = Object.fromEntries(rows.map(row => [row.stockCode, { stockCode: row.stockCode, stockShortName: row.stockShortName }]));
    page.adjustReviewList = page.applyAdjustGroupColors(rows.map((row, index) => page.buildReviewRow(row, index)));
}

test('两步股票工作台保留完整报告、附件与固定底栏，不携带基金或债券专有字段', () => {
    const { page } = harness();
    for (const label of ['股票池批量调整', '股票报告', '其他附件', '调库校验结果', '选择调库流程', '所属行业', '最新评级', '上次评级', '昨收', '数据日期']) assert.ok(html.includes(label));
    assert.match(html, /row-key="stockCode"/);
    assert.match(html, /popper-class="batch-stock-flow-select-dropdown" :popper-append-to-body="true"/);
    assert.match(html, /queryInReportPage/);
    assert.match(html, /queryOutReportPage/);
    assert.doesNotMatch(html, /fundScore|fundInvestmentType|needRiskLeaderApproval|stockScore|releaseRules|guarantor|rightsHolder|stockAdministrator|latestNav/);
    assert.equal(page.ratingLabel('buy'), '买入');
    assert.equal(page.ratingLabel(null), '');
    assert.equal(page.securityMarketLabel('HKEX'), '香港交易所');
    const css = fs.readFileSync(path.join(root, 'css/batch_stock_pool_adjust.css'), 'utf8');
    assert.match(css, /#batch_stock_pool_adjust/);
    assert.match(css, /body\.batch-stock-pool-adjust-page \.batch-stock-flow-select-dropdown/);
    assert.match(css, /padding-bottom: 72px !important/);
    assert.doesNotMatch(css, /#batch_fund_pool_adjust|#batch_security_pool_adjust/);
});

test('池树与行业接口使用股票单笔编码，投资池查询保留权限与分页', async () => {
    const { page } = harness();
    const requests = [];
    page.apiPost = async (url, body) => {
        requests.push({ url, body });
        if (url.endsWith('queryIndustryList')) return [{ industryCode: 'I1', industryName: '制造业' }];
        if (url.endsWith('queryPoolTreeList')) return [];
        return { records: [{ id: 50 }], total: 1 };
    };
    await page.initPage();
    assert.equal(requests[0].url, '/api/v1/common/queryPoolTreeList');
    assert.deepEqual(Array.from(requests[0].body.includeVarietyCodes), ['stock']);
    assert.equal(requests[1].url, '/api/v1/stockPoolAdjust/queryIndustryList');
    assert.equal(requests[2].url, '/api/v1/batchStockPoolAdjust/queryPoolPage');
    assert.equal(requests[2].body.currentUserId, '8');
    assert.equal(page.industryOptions[0].industryCode, 'I1');
});

test('股票跨页勾选、当前页取消、标签移除及清空保持同步', () => {
    const { page } = harness();
    const a = { stockCode: 'A' }, b = { stockCode: 'B' }, c = { stockCode: 'C' };
    page.stockTableData = [a, b]; page.handleStockSelectionChange([a, b]);
    page.stockTableData = [c]; page.handleStockSelectionChange([c]);
    assert.deepEqual(Object.keys(page.selectedStockMap).sort(), ['A', 'B', 'C']);
    page.stockTableData = [a, b]; page.handleStockSelectionChange([a]);
    assert.deepEqual(Object.keys(page.selectedStockMap).sort(), ['A', 'C']);
    const restored = [];
    page.$refs.stockTableRef = { toggleRowSelection: (row, selected) => restored.push([row.stockCode, selected]), clearSelection() {} };
    page.restoreCurrentPageSelection();
    assert.deepEqual(restored, [['A', true], ['B', false]]);
    page.removeSelectedStock('A'); assert.deepEqual(Object.keys(page.selectedStockMap), ['C']);
    page.clearSelectedStocks(); assert.equal(page.selectedStocks.length, 0);
});

test('候选查询透传目标池、方向、股票代码简称行业市场，不携带基金筛选', async () => {
    const { page } = harness();
    page.currentPool = { id: 50 }; page.direction = 'out';
    page.stockSearchForm = { stockCode: '600001', stockShortName: '测试', industryCode: 'I1', marketCode: 'SSE' };
    let request;
    page.apiPost = async (url, body) => { request = { url, body }; return { records: [{ stockCode: 'A' }], total: 1 }; };
    await page.loadStockList();
    assert.equal(request.url, '/api/v1/batchStockPoolAdjust/queryStockPage');
    assert.deepEqual(JSON.parse(JSON.stringify(request.body)), {
        currentUserId: '8', poolId: 50, direction: 'out', stockCode: '600001', stockShortName: '测试', industryCode: 'I1', marketCode: 'SSE', pageIndex: 1, pageSize: 10
    });
    assert.equal(page.stockTableData[0].stockCode, 'A'); assert.equal(page.stockPagination.total, 1);
});

test('退出投资池后旧候选响应不覆盖新池，也不结束新请求的loading', async () => {
    const { page } = harness();
    page.currentPool = { id: 50 }; page.pageMode = 'adjustWorkbench';
    const responses = [];
    page.apiPost = async () => new Promise(resolve => responses.push(resolve));
    const old = page.loadStockList();
    page.backToPoolList(); page.currentPool = { id: 51 }; page.direction = 'out'; page.pageMode = 'adjustWorkbench';
    const latest = page.loadStockList();
    responses[0]({ records: [{ stockCode: 'OLD' }], total: 99 }); await old;
    assert.equal(page.stockTableData.length, 0); assert.equal(page.stockLoading, true);
    responses[1]({ records: [{ stockCode: 'NEW' }], total: 1 }); await latest;
    assert.equal(page.stockTableData[0].stockCode, 'NEW'); assert.equal(page.stockPagination.total, 1); assert.equal(page.stockLoading, false);
});

test('快速翻页仅接受最新候选，迟到旧页不会改变分页统计或跨页选择', async () => {
    const { page } = harness(); page.currentPool = { id: 50 };
    page.selectedStockMap = { KEPT: { stockCode: 'KEPT' } };
    const responses = [];
    page.apiPost = async () => new Promise(resolve => responses.push(resolve));
    const old = page.loadStockList(); page.stockPagination.pageIndex = 2;
    const latest = page.loadStockList();
    responses[1]({ records: [{ stockCode: 'PAGE2' }], total: 20 }); await latest;
    responses[0]({ records: [{ stockCode: 'PAGE1' }], total: 10 }); await old;
    assert.equal(page.stockTableData[0].stockCode, 'PAGE2'); assert.equal(page.stockPagination.pageIndex, 2);
    assert.equal(page.stockPagination.total, 20); assert.deepEqual(Object.keys(page.selectedStockMap), ['KEPT']);
});

test('股票校验透传跨页代码，保留反向互斥，仅显示并推荐一般流程', async () => {
    const { page } = harness();
    page.currentPool = { id: 50 }; page.selectedStockMap = { A: { stockCode: 'A' }, B: { stockCode: 'B' } };
    let request;
    page.apiPost = async (url, body) => {
        request = { url, body };
        return { items: [item({ stockCode: 'A', adjustMode: 'in', flowOptions: [
            { flowId: 8, flowKey: 'fast', flowType: 'fastInbound', recommended: true },
            { flowId: 7, flowKey: 'normal', flowType: 'normalInbound', selectable: true },
            { flowId: 9, flowKey: 'batch', flowType: 'batchInbound' }
        ] }), item({ stockCode: 'A', targetPoolId: 51, itemTag: 'mutex', adjustMode: 'out', flowOptions: [] })] };
    };
    await page.goToStep2();
    assert.equal(request.url, '/api/v1/batchStockPoolAdjust/checkAdjust');
    assert.deepEqual(Array.from(request.body.stocks, stock => stock.stockCode), ['A', 'B']);
    assert.equal(page.adjustStep, 2); assert.equal(page.adjustReviewList[0].flowId, 7);
    assert.equal(page.adjustReviewList[0].flowOptions.length, 1);
    assert.equal(page.adjustReviewList[1].direction, '调出');
    assert.equal(page.adjustReviewList[1].flowId, 7);
    assert.equal(page.adjustReviewList[1].flowType, 'normalInbound');
    assert.equal(page.adjustReviewList[0].groupColorIndex, page.adjustReviewList[1].groupColorIndex);
    page.goToStep1(); assert.equal(page.selectedStocks.length, 2);
});

test('完整通过股票组提交全部关系项，失败组和孤立关系项均不提交', () => {
    const { page } = harness();
    reviewed(page, [
        item({ stockCode: 'A' }), item({ stockCode: 'A', itemTag: 'mutex', adjustMode: '调出', targetPoolId: 51, flowOptions: [] }),
        item({ stockCode: 'B', canAdjust: false }), item({ stockCode: 'B', itemTag: 'linkage', targetPoolId: 52 }),
        item({ stockCode: 'C' }), item({ stockCode: 'C', itemTag: 'mutex', targetPoolId: 53, canAdjust: false }),
        item({ stockCode: 'D', itemTag: 'linkage', targetPoolId: 54 })
    ]);
    const result = page.buildSubmitPayloadAndFiles();
    assert.deepEqual(Array.from(result.payload.items, row => row.stockCode), ['A', 'A']);
    assert.deepEqual(Array.from(result.payload.items, row => row.adjustMode), ['调入', '调出']);
    assert.equal(page.validManualAdjustReviewList.length, 1); assert.equal(page.validCount, 2);
    assert.notEqual(page.adjustReviewList[0].groupColorIndex, page.adjustReviewList[2].groupColorIndex);
});

test('股票报告仅精确匹配已选股票与stock品种，合法其他报告类型继续可用', () => {
    const { page, messages } = harness();
    reviewed(page); page.internalReportData = [report()];
    page.handleInternalReportSelectionChange([report()]);
    assert.equal(page.selectedInternalReports[0].securityCode, '600001.SH');
    assert.equal(page.selectedInternalReports[0].securityType, 'stock');
    assert.equal(page.validateStockReports([report({ reportType: 'other_report' })]), '');
    page.handleInternalReportSelectionChange([report({ securityType: 'fund' })]);
    assert.match(messages.at(-1).text, /不是股票报告/);
    assert.equal(page.selectedInternalReports[0].securityType, 'stock');
    page.handleExternalReportSelectionChange([report({ securityCode: '600001' })]);
    assert.match(messages.at(-1).text, /不属于已选股票/);
    page.handleExternalReportSelectionChange([report({ attachments: [] })]);
    assert.match(messages.at(-1).text, /没有可引用附件/);
    page.handleExternalReportSelectionChange([report({ source: 'external', id: 2 })]);
    assert.equal(page.selectedExternalReports[0].securityCode, '600001.SH');
    page.handleConfirmReportDialog(); assert.equal(page.selectedCreditReports.length, 2);
    page.removeSelectedStock('600001.SH');
    assert.match(page.validateStockReports(page.selectedCreditReports), /不属于已选股票/);
    assert.throws(() => page.buildSubmitPayloadAndFiles(), /不属于已选股票/);
});

test('其他附件保留任意报告选择，错误股票报告在确认与下一步明确阻断', async () => {
    const { page, messages } = harness(); reviewed(page);
    page.reportDialogColumn = 'material';
    page.handleInternalReportSelectionChange([report({ securityType: 'fund', securityCode: 'F' })]);
    page.handleConfirmReportDialog(); assert.equal(page.selectedMaterialReports[0].securityCode, 'F');
    page.reportDialogColumn = 'credit'; page.reportDialogVisible = true;
    page.selectedInternalReports = [report({ securityCode: 'OTHER' })]; page.selectedExternalReports = [];
    page.handleConfirmReportDialog(); assert.equal(page.reportDialogVisible, true);
    assert.match(messages.at(-1).text, /不属于已选股票/);
    page.selectedCreditReports = [report({ securityType: 'bond' })];
    let calls = 0; page.apiPost = async () => { calls++; return { items: [] }; };
    await page.goToStep2(); assert.equal(calls, 0); assert.match(messages.at(-1).text, /不是股票报告/);
});

test('共享文件只上传一次，同股全部日志附对应报告引用和整批材料，中文名称保留', async () => {
    const { page } = harness();
    reviewed(page, [item(), item({ itemTag: 'mutex', targetPoolId: 51, adjustMode: '调出', flowOptions: [] }), item({ stockCode: '000001.SZ' })]);
    const shared = new File(['report'], '股票研究报告.pdf'), material = new File(['material'], '其他材料.docx');
    page.creditReportFiles = [{ raw: shared, name: shared.name }]; page.materialFiles = [{ raw: material, name: material.name }];
    page.selectedCreditReports = [report({ attachments: [{ id: 101 }, { id: 101 }] }), report({ id: 2, securityCode: '000001.SZ', attachments: [{ id: 102 }] })];
    page.selectedMaterialReports = [report({ securityType: 'fund', attachments: [{ id: 200 }] })];
    const data = page.buildSubmitPayloadAndFiles();
    assert.equal(data.files.length, 2);
    for (const row of data.payload.items) {
        assert.deepEqual(Array.from(row.reportFileIndexes), [0]); assert.deepEqual(Array.from(row.materialFileIndexes), [1]);
        assert.deepEqual(Array.from(row.materialSourceAttachmentIds), [200]);
    }
    assert.deepEqual(Array.from(data.payload.items[0].reportSourceAttachmentIds), [101]);
    assert.deepEqual(Array.from(data.payload.items[1].reportSourceAttachmentIds), [101]);
    assert.deepEqual(Array.from(data.payload.items[2].reportSourceAttachmentIds), [102]);
    let request; page.apiPost = async (url, body) => { request = { url, body }; return {}; };
    await page.submitAdjustMultipart('/api/v1/batchStockPoolAdjust/addAdjustLogWithFiles', data.payload, data.files);
    assert.equal(request.body.getAll('files').length, 2);
    assert.deepEqual(JSON.parse(request.body.get('originalFileNameListJson')), ['股票研究报告.pdf', '其他材料.docx']);
    const payload = JSON.parse(await request.body.get('request').text());
    assert.equal(payload.direction, 'in'); assert.equal(payload.items[1].adjustMode, '调出');
    assert.equal(payload.adjusterId, '8'); assert.equal(payload.adjusterName, '股票研究员');
    assert.equal('fundScore' in payload, false);
});

test('一般流程未选择或不可用时阻止提交，确认请求加载时防止重复点击', async () => {
    const { page } = harness(); reviewed(page);
    page.adjustReviewList[0].selectedFlowKey = '';
    await page.submitAdjust(); assert.equal(page.flowDialogVisible, false);
    reviewed(page, [item({ flowOptions: [{ flowType: 'fastInbound', flowId: 8 }] })]);
    assert.equal(page.allValidRowsHaveFlow, false);
    reviewed(page); await page.submitAdjust(); assert.equal(page.flowDialogVisible, true);
    let complete, calls = 0;
    page.apiPost = async () => { calls++; return new Promise(resolve => { complete = resolve; }); };
    page.initPage = async () => {};
    const pending = page.confirmFlowSelection(); assert.equal(page.submitLoading, true);
    await page.confirmFlowSelection(); assert.equal(calls, 1);
    complete({ stockCount: 1, submitCount: 1 }); await pending;
    assert.equal(page.submitLoading, false); assert.equal(page.pageMode, 'poolList');
});

test('校验失败清空旧结果，退出工作台后迟到响应不恢复可提交状态', async () => {
    const { page } = harness(); reviewed(page);
    page.apiPost = async () => { throw new Error('校验失败'); };
    await page.goToStep2(); assert.equal(page.adjustReviewList.length, 0); assert.equal(page.checkLoading, false);
    let complete; page.apiPost = async () => new Promise(resolve => { complete = resolve; });
    const pending = page.goToStep2(); page.backToPoolList(); complete({ items: [item()] }); await pending;
    assert.equal(page.pageMode, 'poolList'); assert.equal(page.adjustStep, 1); assert.equal(page.adjustReviewList.length, 0);
});

test('校验期间修改股票选择时忽略旧选择结果，保持第一步可重新校验', async () => {
    const { page } = harness(); reviewed(page); page.adjustStep = 1;
    let complete;
    page.apiPost = async () => new Promise(resolve => { complete = resolve; });
    const pending = page.goToStep2(); page.removeSelectedStock('600001.SH');
    assert.equal(page.checkLoading, false);
    page.selectedStockMap = { '000001.SZ': { stockCode: '000001.SZ' } };
    complete({ items: [item()] }); await pending;
    assert.equal(page.adjustStep, 1); assert.equal(page.adjustReviewList.length, 0); assert.equal(page.checkLoading, false);
});

test('勾选和清空仅在代码集合变化时令校验失效，分页恢复不会撤销结果', async () => {
    const { page } = harness(); reviewed(page);
    page.stockTableData = [{ stockCode: '600001.SH' }]; page.adjustStep = 2;
    const seq = page.checkSeq;
    page.handleStockSelectionChange([{ stockCode: '600001.SH' }]);
    assert.equal(page.checkSeq, seq); assert.equal(page.adjustReviewList.length, 1);
    page.selectionSyncing = true; page.handleStockSelectionChange([]);
    assert.equal(page.checkSeq, seq); assert.equal(page.adjustReviewList.length, 1);
    page.selectionSyncing = false;
    let complete; page.apiPost = async () => new Promise(resolve => { complete = resolve; });
    const pending = page.goToStep2(); const runningSeq = page.checkSeq;
    page.handleStockSelectionChange([]);
    assert.equal(page.checkSeq, runningSeq + 1); assert.equal(page.checkLoading, false);
    complete({ items: [item()] }); await pending;
    assert.equal(page.adjustReviewList.length, 0); assert.equal(page.adjustStep, 1);
    reviewed(page); page.flowDialogVisible = true; page.clearSelectedStocks();
    assert.equal(page.adjustReviewList.length, 0); assert.equal(page.flowDialogVisible, false);
});

test('主项改选一般流程后同股关系项同步继承，其他股票分组保持原流程', () => {
    const { page } = harness();
    reviewed(page, [item(), item({ itemTag: 'mutex', targetPoolId: 51, adjustMode: '调出', flowOptions: [] }), item({ stockCode: '000001.SZ' })]);
    const master = page.adjustReviewList[0];
    master.flowOptions.push({ optionKey: 'normal-two', flowId: 9, flowKey: 'second-normal', flowType: 'normalInbound', flowName: '股票一般流程二', selectable: true });
    master.selectedFlowKey = 'normal-two'; page.handleRowFlowChange(master);
    assert.equal(page.adjustReviewList[1].flowId, 9); assert.equal(page.adjustReviewList[1].flowName, '股票一般流程二');
    assert.equal(page.adjustReviewList[2].flowId, 7);
    const payload = page.buildSubmitPayloadAndFiles().payload;
    assert.equal(payload.items[1].flowKey, 'second-normal'); assert.equal(payload.items[1].adjustMode, '调出');
});

test('报告查询保持归属字段，关闭弹窗后迟到响应不改变报告列表', async () => {
    const { page } = harness();
    let complete;
    page.apiPost = async () => new Promise(resolve => { complete = resolve; });
    const pending = page.queryInternalReports(); page.handleReportDialogClosed();
    complete({ records: [report({ reportTitle: '迟到报告' })], total: 1 }); await pending;
    assert.equal(page.internalReportData.length, 0); assert.equal(page.internalReportLoading, false);
    const normalized = page.normalizeReportRecord(report({ reportTitle: '行业报告' }), 'internal');
    assert.equal(normalized.securityCode, '600001.SH'); assert.equal(normalized.securityType, 'stock'); assert.equal(normalized.title, '行业报告');
});
