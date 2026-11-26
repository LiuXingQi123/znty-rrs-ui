// 无需安装依赖：node --test tests/batch_security_pool_adjust.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../pages/batch_security_pool_adjust.html'), 'utf8');

// 执行页面实际方法，隔离浏览器和接口请求
function harness(markup = html) {
    let options;
    function Vue(config) { options = config; }
    const context = vm.createContext({
        Vue,
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '管理员' }) } },
        moment: () => ({ format: () => '2026-10-26' })
    });
    for (const match of markup.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = { $refs: {}, $nextTick: callback => callback() };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.assign(page, options.data.call(page));
    Object.entries(options.computed).forEach(([key, getter]) => {
        Object.defineProperty(page, key, { get: getter.bind(page) });
    });
    return page;
}

// 两页共用校验结果和提交场景，分别使用自己的接口和快速入库口径
function testBothBatchPages(name, verify) {
    const pages = [
        {
            filename: 'batch_security_pool_adjust.html', apiPrefix: '/api/v1/batchSecurityPoolAdjust',
            fastFlowName: '简易入库', materialExemptionType: 'creditBondSimple',
            fastFailure: '同发行人半年内没有符合条件的入库记录'
        },
        {
            filename: 'stock_security_batch_adjust.html', apiPrefix: '/api/v1/stockSecurityBatchAdjust',
            fastFlowName: '产品库快速入库流程', materialExemptionType: 'productSource',
            fastFailure: '证券当前不在指定来源库，不能使用产品库快速入库流程'
        }
    ];
    for (const config of pages) {
        test(`${config.filename} ${name}`, () => {
            const markup = fs.readFileSync(path.join(__dirname, '../pages', config.filename), 'utf8');
            return verify(harness(markup), config, markup);
        });
    }
}

test('初始化时仅请求信用债类型的债券投资池筛选树', async () => {
    const page = harness();
    const requests = [];
    page.apiPost = async (url, body) => {
        requests.push({ url, body: JSON.parse(JSON.stringify(body)) });
        return url === '/api/v1/common/queryPoolTreeList' ? [] : { records: [], total: 0 };
    };
    await page.initPage();
    assert.deepEqual(requests, [
        {
            url: '/api/v1/common/queryPoolTreeList',
            body: { includePoolTypes: ['credit_bond'], includeVarietyCodes: ['bond'] }
        },
        {
            url: '/api/v1/batchSecurityPoolAdjust/queryPoolPage',
            body: { currentUserId: '1', poolIds: null, pageIndex: 1, pageSize: 10 }
        }
    ]);
});

for (const direction of ['in', 'out']) {
    test(`${direction} 查询按发行人及其他条件请求后端，翻页保留发行人`, async () => {
        const page = harness();
        assert.match(html, /v-model\.trim="securitySearchForm\.issuer"[^>]*placeholder="主体全称"[^>]*clearable[^>]*@keyup\.enter\.native="handleSecuritySearch"/);
        page.currentPool = { id: 2 };
        page.direction = direction;
        Object.assign(page.securitySearchForm, {
            issuer: '测试发行人', securityCode: '100', securityShortName: '债', marketCodes: ['NIB'], bondYesFlags: ['abs']
        });
        const requests = [];
        page.apiPost = async (url, body) => {
            requests.push({ url, body: JSON.parse(JSON.stringify(body)) });
            return { records: [], total: 0 };
        };
        page.securityPagination.pageIndex = 5;
        // 等待查询处理器发出的实际异步请求完成
        const load = page.loadSecurityList;
        let pending;
        page.loadSecurityList = () => (pending = load());
        page.handleSecuritySearch();
        await pending;
        assert.equal(requests[0].url, '/api/v1/batchSecurityPoolAdjust/querySecurityPage');
        assert.deepEqual(requests[0].body, {
            currentUserId: '1', poolId: 2, direction, issuer: '测试发行人', securityCode: '100',
            securityShortName: '债', securityFullName: null, issuerCode: null,
            marketCodes: ['NIB'], bondYesFlags: ['abs'], pageIndex: 1, pageSize: 10
        });
        page.handleSecurityPageChange(2);
        await pending;
        assert.equal(requests[1].body.issuer, '测试发行人');
        assert.equal(requests[1].body.pageIndex, 2);
        page.handleSecurityReset();
        await pending;
        assert.equal(page.securitySearchForm.issuer, '');
        assert.equal(requests[2].body.issuer, null);
        assert.equal(requests[2].body.pageIndex, 1);
    });
}

test('进入调入或调出工作台时清空上次发行人条件', () => {
    const page = harness();
    assert.equal(page.securitySearchForm.issuer, '');
    const requests = [];
    page.loadSecurityList = () => requests.push(page.securitySearchForm.issuer);
    for (const direction of ['in', 'out']) {
        page.securitySearchForm.issuer = '上次发行人';
        page.openAdjust({ id: 2 }, direction);
        assert.equal(page.securitySearchForm.issuer, '');
        assert.equal(page.direction, direction);
    }
    assert.deepEqual(requests, ['', '']);
});

testBothBatchPages('校验结果全选只勾选可调整项，确认时只提交勾选项', async (page, { apiPrefix }) => {
    page.direction = 'out';
    page.currentPool = { id: 2 };
    const makeRow = (securityCode, canAdjust, index) => page.buildReviewRow({
        securityCode, canAdjust, targetPoolId: 2, adjustMode: '调出', itemTag: 'manual',
        flowOptions: canAdjust ? [{ flowType: 'normalOutbound', recommended: true, flowId: 9 }] : []
    }, index);
    const first = makeRow('A', true, 0);
    const second = makeRow('B', true, 1);
    const blocked = makeRow('C', false, 2);
    page.adjustReviewList = [first, second, blocked];

    assert.equal(page.allReviewRowsSelected, true);
    assert.equal(blocked.selected, false);
    page.setAllReviewRowsSelected(false);
    assert.equal(page.allSelectedRowsHaveFlow, false);
    assert.equal(page.selectedAdjustReviewList.length, 0);
    page.setAllReviewRowsSelected(true);
    page.setReviewRowSelected(blocked, true);
    assert.equal(blocked.selected, false);
    page.setReviewRowSelected(second, false);
    assert.equal(page.allReviewRowsSelected, false);
    assert.equal(page.selectedManualAdjustReviewList.length, 1);

    let request;
    page.submitAdjustMultipart = async (url, payload) => {
        request = { url, items: JSON.parse(JSON.stringify(payload.items)) };
    };
    page.$message = { success() {}, error(message) { assert.fail(message); } };
    page.backToPoolList = () => {};
    page.initPage = async () => {};
    await page.confirmFlowSelection();

    assert.equal(request.url, `${apiPrefix}/addAdjustLogWithFiles`);
    assert.deepEqual(request.items.map(item => [item.securityCode, item.flowId]), [['A', 9]]);
});

testBothBatchPages('校验结果把不可调整项稳定排到末尾，并保留后端失败原因', async (page) => {
    page.direction = 'out';
    page.currentPool = { id: 2 };
    page.selectedSecurityMap = { A: { securityCode: 'A' } };
    page.$message = { warning(message) { assert.fail(message); }, error(message) { assert.fail(message); } };
    const outbound = { adjustMode: '调出', itemTag: 'manual', canAdjust: true,
        flowOptions: [{ flowType: 'normalOutbound', recommended: true }] };
    page.apiPost = async () => ({ items: [
        { securityCode: 'A', canAdjust: false, failReasons: ['证券在冻结期内'] },
        { ...outbound, securityCode: 'B' },
        { securityCode: 'C', canAdjust: false, failReasons: ['证券不在池内'] },
        { ...outbound, securityCode: 'D' }
    ] });

    await page.goToStep2();

    assert.equal(page.adjustStep, 2);
    assert.equal(page.adjustReviewList.map(row => row.securityCode).join(','), 'B,D,A,C');
    assert.equal(page.adjustReviewList[2].failReasons[0], '证券在冻结期内');
    assert.equal(page.adjustReviewList[3].failReasons[0], '证券不在池内');
});

testBothBatchPages('批量调入可调整项只保留默认快速入库流程，失败项保留默认流程和原因', async (page, config, markup) => {
    page.currentPool = { id: 2 };
    page.selectedSecurityMap = { A: { securityCode: 'A' } };
    page.$message = { success() {}, warning(message) { assert.fail(message); }, error(message) { assert.fail(message); } };
    const simple = { flowType: 'simpleInbound', flowName: config.fastFlowName };
    const normal = { flowType: 'normalInbound', flowName: '默认调入' };
    const main = { canAdjust: true, adjustMode: '调入', targetPoolId: 2, itemTag: 'manual' };
    page.apiPost = async url => {
        assert.equal(url, `${config.apiPrefix}/checkAdjust`);
        return { items: [
            { ...main, securityCode: 'A', adjustGroupKey: 'A', flowOptions: [
                { ...simple, selectable: false, unmatchReasons: [config.fastFailure] },
                { ...normal, recommended: true }
            ] },
            { ...main, securityCode: 'A-关联', adjustGroupKey: 'A', itemTag: 'related' },
            { ...main, securityCode: 'B', adjustGroupKey: 'B', materialExemptionType: config.materialExemptionType, flowOptions: [
                normal, simple, { ...simple, flowId: 8, flowKey: 'bond:simple-inbound', recommended: true }
            ] },
            { ...main, securityCode: 'B-关联', adjustGroupKey: 'B', itemTag: 'related' },
            { ...main, securityCode: 'C', adjustGroupKey: 'C', flowOptions: [simple, { ...normal, recommended: true }] },
            { ...main, securityCode: 'D', adjustGroupKey: 'D', canAdjust: false, failReasons: ['目标池已满'] }
        ] };
    };

    await page.goToStep2();

    assert.equal(page.adjustReviewList.map(row => row.securityCode).join(','), 'B,B-关联,A,A-关联,C,D');
    assert.equal(page.selectedAdjustReviewList.map(row => row.securityCode).join(','), 'B,B-关联');
    const [eligible, , blocked, related, defaultIsNormal, backendBlocked] = page.adjustReviewList;
    assert.equal(eligible.flowType, 'simpleInbound');
    assert.equal(eligible.flowOptions.length, 1);
    assert.equal(page.selectedRowFlowOption(eligible), eligible.flowOptions[0]);
    assert.equal(eligible.flowId, 8);
    assert.equal(eligible.flowKey, 'bond:simple-inbound');
    assert.equal(page.allSelectedRowsHaveFlow, true);
    assert.equal(blocked.inboundFlowBlocked, true);
    assert.equal(blocked.flowName, '默认调入');
    assert.equal(blocked.failReasons[0], '批量调入仅支持快速入库。其他入库流程请到「证券池调整」办理');
    assert.equal(blocked.failReasons[1], config.fastFailure);
    assert.equal(related.failReasons[0], '同组手工调入项未默认选中快速入库流程，本项不可调整');
    assert.equal(defaultIsNormal.valid, false);
    assert.equal(backendBlocked.inboundFlowBlocked, false);
    assert.equal(backendBlocked.failReasons.join(','), '目标池已满');
    assert.match(markup, /<span v-else-if="row.inboundFlowBlocked && row.flowName">{{ row.flowName }}<\/span>/);

    let request;
    page.submitAdjustMultipart = async (url, payload) => {
        request = { url, items: JSON.parse(JSON.stringify(payload.items)) };
    };
    page.backToPoolList = () => {};
    page.initPage = async () => {};
    await page.confirmFlowSelection();

    assert.equal(request.url, `${config.apiPrefix}/addAdjustLogWithFiles`);
    assert.deepEqual(request.items.map(item => item.securityCode), ['B', 'B-关联']);
    assert.equal(request.items[0].flowId, 8);
    assert.equal(request.items[0].flowType, 'simpleInbound');
    assert.equal(request.items[1].materialExemptionType, config.materialExemptionType);
});

testBothBatchPages('支持逐行取消，提交前提示补齐同组配套项', async (page) => {
    const manual = page.buildReviewRow({ securityCode: 'A', canAdjust: true, targetPoolId: 2, poolName: '信用债二级库',
        adjustMode: '调入', itemTag: 'manual', adjustGroupKey: 'A',
        flowOptions: [{ flowType: 'simpleInbound', recommended: true, flowId: 8 }]
    }, 0);
    const related = page.buildReviewRow({ securityCode: 'A-关联', canAdjust: true, targetPoolId: 2, poolName: '信用债二级库',
        adjustMode: '调入', itemTag: 'related', adjustGroupKey: 'A'
    }, 1);
    page.adjustReviewList = [manual, related];
    const warnings = [];
    page.$message = { warning(message) { warnings.push(message); } };
    page.submitAdjustMultipart = async () => assert.fail('同组缺项时不能提交');

    page.setReviewRowSelected(related, false);
    assert.equal(manual.selected, true);
    await page.submitAdjust();
    assert.equal(page.flowDialogVisible, false);
    assert.match(warnings.pop(), /请补勾同组调库项：A-关联（信用债二级库，关联调整）/);

    page.setReviewRowSelected(related, true);
    await page.submitAdjust();
    assert.equal(page.flowDialogVisible, true);
    page.setReviewRowSelected(manual, false);
    await page.confirmFlowSelection();
    assert.match(warnings.pop(), /请补勾同组调库项：A（信用债二级库，手动批量调整）/);
});
