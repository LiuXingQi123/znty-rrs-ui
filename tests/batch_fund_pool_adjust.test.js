// 无需安装依赖：node --test tests/batch_fund_pool_adjust.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pages/batch_fund_pool_adjust.html'), 'utf8');

// 执行实际页面 Vue 方法，隔离浏览器组件和网络请求。
function harness() {
    let options;
    function Vue(config) { options = config; }
    const context = vm.createContext({
        Vue, FormData, Blob, File, Uint8Array, atob, URL,
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '8', userName: '基金研究员' }) } },
        moment: () => ({ format: () => '2026-10-08' })
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

// 基金单笔返回的校验主项与一般流程候选。
function item(overrides = {}) {
    return {
        fundCode: '000001.OF', fundShortName: '测试基金', targetPoolId: 1, poolName: '基金库/一级库', poolType: 'normal',
        adjustMode: '调入', itemTag: 'manual', adjustGroupKey: 'in-1', canAdjust: true, failReasons: [], warnings: [],
        flowOptions: [{ flowId: 7, flowKey: 'fund-general', flowType: 'normalInbound', flowName: '基金一般流程', selectable: true, recommended: true }],
        ...overrides
    };
}

// 将实际后端校验结果装入工作台，共享字段使用合法零值。
function reviewed(page, rows = [item()]) {
    page.currentPool = { id: 1, poolFullName: '基金库/一级库' };
    page.fundAdjustForm = { fundScore: 0, fundInvestmentType: 'stock', needRiskLeaderApproval: 0 };
    page.adjustReviewList = page.applyAdjustGroupColors(rows.map((row, index) => page.buildReviewRow(row, index)));
}

test('两步基金工作台保留报告、上传和流程确认，不携带放开规则或债券字段', () => {
    harness();
    assert.match(html, /基金池批量调整/);
    assert.match(html, /基金评分/);
    assert.match(html, /基金投资类型/);
    assert.match(html, /分管领导审批/);
    assert.match(html, /选择调库流程/);
    assert.match(html, /queryInReportPage/);
    assert.match(html, /queryOutReportPage/);
    assert.match(html, /originalFileNameListJson/);
    assert.match(html, /row-key="fundCode"/);
    assert.match(html, /popper-class="batch-fund-flow-select-dropdown" :popper-append-to-body="true"/);
    assert.doesNotMatch(html, /releaseRules|放开规则|guarantor|rightsHolder|bondYesFlags|queryGuarantorGrade/);
    const css = fs.readFileSync(path.join(root, 'css/batch_fund_pool_adjust.css'), 'utf8');
    assert.match(css, /#batch_fund_pool_adjust/);
    assert.match(css, /body\.batch-fund-pool-adjust-page \.batch-fund-flow-select-dropdown/);
    assert.doesNotMatch(css, /#batch_security_pool_adjust/);
});

test('基金跨页勾选、当前页取消、标签移除和清空保持同步', () => {
    const { page } = harness();
    const a = { fundCode: 'A' }, b = { fundCode: 'B' }, c = { fundCode: 'C' };
    page.fundTableData = [a, b];
    page.handleFundSelectionChange([a, b]);
    page.fundTableData = [c];
    page.handleFundSelectionChange([c]);
    assert.deepEqual(Object.keys(page.selectedFundMap).sort(), ['A', 'B', 'C']);
    page.fundTableData = [a, b];
    page.handleFundSelectionChange([a]);
    assert.deepEqual(Object.keys(page.selectedFundMap).sort(), ['A', 'C']);
    const restored = [];
    page.$refs.fundTableRef = { toggleRowSelection: (row, selected) => restored.push([row.fundCode, selected]), clearSelection: () => {} };
    page.restoreCurrentPageSelection();
    assert.deepEqual(restored, [['A', true], ['B', false]]);
    page.removeSelectedFund('A');
    assert.deepEqual(Object.keys(page.selectedFundMap), ['C']);
    page.fundTableData = [b];
    page.handleFundSelectionChange([a, b]);
    assert.deepEqual(Object.keys(page.selectedFundMap).sort(), ['B', 'C']);
    page.clearSelectedFunds();
    assert.equal(page.selectedFunds.length, 0);
});

test('评分零和审批否有效，五种投资类型及评分存储精度显式验证', () => {
    const { page } = harness();
    reviewed(page);
    assert.equal(page.validateFundAdjustInfo(), '');
    for (const score of [0, '0', '999999.9999', '-999999.9999', '.1234', '0000001.123400']) assert.equal(page.fundScoreError(score), '');
    for (const score of ['', null, 'NaN', 'Infinity', 'abc']) assert.ok(page.fundScoreError(score));
    for (const score of ['1000000', '-1000000', '0.12345']) assert.match(page.fundScoreError(score), /六位整数、四位小数/);
    page.fundAdjustForm.fundInvestmentType = 'invalid';
    assert.match(page.validateFundAdjustInfo(), /投资类型/);
    page.fundAdjustForm.fundInvestmentType = 'stock';
    page.fundAdjustForm.needRiskLeaderApproval = '';
    assert.match(page.validateFundAdjustInfo(), /分管领导审批/);
    page.fundAdjustForm.needRiskLeaderApproval = 0;
    assert.equal(page.validateFundAdjustInfo(), '');
});

test('候选基金透传用户、目标池、方向及基金筛选，产品类型使用单笔接口', async () => {
    const { page } = harness();
    page.currentPool = { id: 13 };
    page.direction = 'out';
    page.fundSearchForm = { fundCode: '000001', fundShortName: '测试', securityType: 'fund_type', fundAdministrator: '管理人' };
    const requests = [];
    page.apiPost = async (url, body) => { requests.push({ url, body }); return { records: [{ fundCode: 'A' }], total: 1 }; };
    await page.loadFundList();
    assert.equal(requests[0].url, '/api/v1/batchFundPoolAdjust/queryFundPage');
    assert.equal(requests[0].body.currentUserId, '8');
    assert.equal(requests[0].body.poolId, 13);
    assert.equal(requests[0].body.direction, 'out');
    assert.equal(requests[0].body.securityType, 'fund_type');
    assert.equal(requests[0].body.fundAdministrator, '管理人');
    assert.equal(page.fundTableData[0].fundCode, 'A');
    assert.equal(page.fundPagination.total, 1);
});

test('校验按跨页基金调用批量接口，保留相反方向关系项及一般流程', async () => {
    const { page } = harness();
    page.currentPool = { id: 1 };
    page.fundAdjustForm = { fundScore: 0, fundInvestmentType: 'stock', needRiskLeaderApproval: 0 };
    page.selectedFundMap = { A: { fundCode: 'A' }, B: { fundCode: 'B' } };
    let request;
    page.apiPost = async (url, body) => {
        request = { url, body };
        return { items: [item({ fundCode: 'A', adjustMode: 'in' }), item({ fundCode: 'A', targetPoolId: 2, itemTag: 'mutex', adjustMode: 'out', flowOptions: [] })] };
    };
    await page.goToStep2();
    assert.equal(request.url, '/api/v1/batchFundPoolAdjust/checkAdjust');
    assert.deepEqual(Array.from(request.body.funds, fund => fund.fundCode), ['A', 'B']);
    assert.equal(request.body.direction, 'in');
    assert.equal('fundScore' in request.body, false);
    assert.equal(page.adjustStep, 2);
    assert.equal(page.adjustReviewList[0].direction, '调入');
    assert.equal(page.adjustReviewList[1].direction, '调出');
    assert.equal(page.adjustReviewList[0].flowId, 7);
    assert.equal(page.adjustReviewList[0].groupColorIndex, page.adjustReviewList[1].groupColorIndex);
});

test('基金调库信息在选择页填写，下一步必填校验并跨步骤保留零值', async () => {
    const { page, messages } = harness();
    const infoStart = html.indexOf('<div class="section-card fund-adjust-info">');
    assert.ok(infoStart > 0 && infoStart < html.indexOf('<div class="candidate-toolbar">'));
    assert.doesNotMatch(html, /class="section-card fund-adjust-info"\s+v-show=/);
    page.currentPool = { id: 1 };
    page.selectedFundMap = { A: { fundCode: 'A' } };
    let calls = 0;
    page.apiPost = async () => { calls++; return { items: [item({ fundCode: 'A' })] }; };

    await page.goToStep2();
    assert.equal(calls, 0);
    assert.equal(page.adjustStep, 1);
    assert.match(messages.at(-1).text, /评分/);
    page.fundAdjustForm.fundScore = 0;
    await page.goToStep2();
    assert.equal(calls, 0);
    assert.match(messages.at(-1).text, /投资类型/);
    page.fundAdjustForm.fundInvestmentType = 'stock';
    await page.goToStep2();
    assert.equal(calls, 0);
    assert.match(messages.at(-1).text, /分管领导审批/);

    page.fundAdjustForm.needRiskLeaderApproval = 0;
    await page.goToStep2();
    assert.equal(calls, 1);
    assert.equal(page.adjustStep, 2);
    page.goToStep1();
    assert.equal(page.adjustStep, 1);
    assert.equal(page.fundAdjustForm.fundScore, 0);
    assert.equal(page.fundAdjustForm.fundInvestmentType, 'stock');
    assert.equal(page.fundAdjustForm.needRiskLeaderApproval, 0);
});

test('完整通过组提交手工与反向互斥，失败组和孤立关系项均不提交', () => {
    const { page } = harness();
    reviewed(page, [
        item({ fundCode: 'A' }), item({ fundCode: 'A', itemTag: 'mutex', adjustMode: '调出', targetPoolId: 2, flowOptions: [] }),
        item({ fundCode: 'B', canAdjust: false }), item({ fundCode: 'B', itemTag: 'linkage', targetPoolId: 3 }),
        item({ fundCode: 'C' }), item({ fundCode: 'C', itemTag: 'mutex', targetPoolId: 4, canAdjust: false }),
        item({ fundCode: 'D', itemTag: 'linkage', targetPoolId: 5 })
    ]);
    const data = page.buildSubmitPayloadAndFiles();
    assert.equal(data.payload.items.length, 2);
    assert.deepEqual(Array.from(data.payload.items, row => row.fundCode), ['A', 'A']);
    assert.deepEqual(Array.from(data.payload.items, row => row.adjustMode), ['调入', '调出']);
    assert.equal(data.payload.fundScore, 0);
    assert.equal(data.payload.needRiskLeaderApproval, 0);
    assert.equal(page.validManualAdjustReviewList.length, 1);
    assert.equal(page.validCount, 2);
});

test('共享报告与上传文件只上传一次，完整保存中文文件名和来源附件去重', async () => {
    const { page } = harness();
    reviewed(page, [item({ fundCode: 'A' }), item({ fundCode: 'B' })]);
    const report = new File(['report'], '基金研究报告.pdf');
    const material = new File(['material'], '其他材料.docx');
    page.creditReportFiles = [{ raw: report, name: report.name }];
    page.materialFiles = [{ raw: material, name: material.name }];
    page.selectedCreditReports = [{ attachments: [{ id: 4 }, { id: 4 }] }];
    page.selectedMaterialReports = [{ attachments: [{ id: 5 }] }];
    const data = page.buildSubmitPayloadAndFiles();
    assert.equal(data.files.length, 2);
    assert.deepEqual(Array.from(data.payload.items[0].reportFileIndexes), [0]);
    assert.deepEqual(Array.from(data.payload.items[1].materialFileIndexes), [1]);
    assert.deepEqual(Array.from(data.payload.items[0].reportSourceAttachmentIds), [4]);
    assert.deepEqual(Array.from(data.payload.items[1].materialSourceAttachmentIds), [5]);
    let request;
    page.apiPost = async (url, body) => { request = { url, body }; return {}; };
    await page.submitAdjustMultipart('/api/v1/batchFundPoolAdjust/addAdjustLogWithFiles', data.payload, data.files);
    assert.equal(request.body.getAll('files').length, 2);
    assert.deepEqual(JSON.parse(request.body.get('originalFileNameListJson')), ['基金研究报告.pdf', '其他材料.docx']);
    const payload = JSON.parse(await request.body.get('request').text());
    assert.equal(payload.items[1].targetPoolName, '基金库/一级库');
    assert.equal(payload.fundScore, 0);
    assert.equal('releaseRules' in payload, false);
});

test('提交前校验共享三字段，未选流程阻止提交，确认时阻止重复点击', async () => {
    const { page, messages } = harness();
    reviewed(page);
    page.fundAdjustForm.fundScore = '';
    await page.submitAdjust();
    assert.equal(page.flowDialogVisible, false);
    assert.match(messages.at(-1).text, /评分/);
    page.fundAdjustForm.fundScore = 0;
    page.adjustReviewList[0].selectedFlowKey = '';
    await page.submitAdjust();
    assert.equal(page.flowDialogVisible, false);
    reviewed(page);
    await page.submitAdjust();
    assert.equal(page.flowDialogVisible, true);
    let complete;
    let count = 0;
    page.apiPost = async () => { count++; return new Promise(resolve => { complete = resolve; }); };
    page.backToPoolList = () => { page.pageMode = 'poolList'; };
    page.initPage = async () => {};
    const pending = page.confirmFlowSelection();
    assert.equal(page.submitLoading, true);
    await page.confirmFlowSelection();
    assert.equal(count, 1);
    complete({ fundCount: 1, submitCount: 1 });
    await pending;
    assert.equal(page.submitLoading, false);
    assert.equal(page.pageMode, 'poolList');
});

test('校验失败清空旧结果，退出工作台后延迟校验响应不恢复提交状态', async () => {
    const { page } = harness();
    reviewed(page);
    page.selectedFundMap = { A: { fundCode: 'A' } };
    page.apiPost = async () => { throw new Error('校验失败'); };
    await page.goToStep2();
    assert.equal(page.adjustReviewList.length, 0);
    assert.equal(page.checkLoading, false);
    let complete;
    page.apiPost = async () => new Promise(resolve => { complete = resolve; });
    const pending = page.goToStep2();
    page.backToPoolList();
    complete({ items: [item()] });
    await pending;
    assert.equal(page.pageMode, 'poolList');
    assert.equal(page.adjustStep, 1);
    assert.equal(page.adjustReviewList.length, 0);
});
