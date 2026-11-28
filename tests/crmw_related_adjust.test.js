// 无需安装依赖：node --test tests/crmw_related_adjust.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 执行页面真实校验映射与提交方法，替代后端和不相关的界面刷新。
function harness(name) {
    let options;
    const window = { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) } };
    const context = vm.createContext({ window, Vue: function(config) { options = config; },
        URLSearchParams, moment: () => ({ format: () => '' }) });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    const html = fs.readFileSync(path.join(__dirname, '../pages', name + '.html'), 'utf8');
    for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (script[1].trim()) vm.runInContext(script[1], context);
    }
    const page = { ...options.data(), $refs: {}, $nextTick: fn => fn(),
        $message: { error: message => assert.fail(message), warning: message => assert.fail(message), success() {} } };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.entries(options.computed).forEach(([key, getter]) => {
        if (typeof getter === 'function') Object.defineProperty(page, key, { get: getter.bind(page), configurable: true });
    });
    page.bondDetail = { windCode: 'A.IB', shortName: '主标的', securityType: 'mtn', absFlag: 0 };
    page.crmwDetail = { windCode: 'C.IB', shortName: '凭证C', securityType: 'crmw' };
    page.selectedCrmw = page.crmwDetail;
    page.selectedInPools = [{ id: 18, poolName: 'CRMW库', poolType: 'crmw' }];
    page.selectedOutPools = [];
    for (const method of ['syncSelectedPoolsFromTables', 'saveIssuerFinancialChanges',
        'refreshAdjustReviewTableLayout', 'backToList']) page[method] = () => {};
    const results = ['A.IB', 'A.SH', 'A.SZ'].map((code, index) => ({
        securityCode: code, securityShortName: '标的' + code, securityType: 'mtn',
        crmwScode: 'C.IB', targetPoolId: 18, poolName: 'CRMW库', poolType: 'crmw',
        adjustMode: '调入', itemTag: index ? 'related' : 'manual',
        adjustGroupKey: 'GROUP', canAdjust: index !== 2, failReasons: index === 2 ? ['容量不足'] : [],
        flowOptions: index ? [] : [{ flowId: 1, flowKey: 'bond:in', flowName: '调入流程', selectable: true, recommended: true }]
    }));
    page.apiPost = async () => ({ items: results, flowOptions: [] });
    let submitted;
    page.submitAdjustMultipart = async (url, payload) => { submitted = payload; };
    return { page, html, getSubmitted: () => submitted };
}

for (const name of ['crmw_pool_adjust', 'crmw_pool_adjust_detail', 'crmw_pool_adjust_approve']) {
    test(name + ' 校验展示实际标的，提交保留可调关联码及原凭证', async () => {
        const { page, html, getSubmitted } = harness(name);
        await page.goToStep2();
        assert.deepEqual(Array.from(page.adjustReviewList, row => row.securityCode), ['A.IB', 'A.SH', 'A.SZ']);
        assert.equal(page.adjustReviewList[1].securityShortName, '标的A.SH');
        assert.equal(page.adjustReviewList[0].groupColorIndex, page.adjustReviewList[1].groupColorIndex);
        await page.submitAdjustLog();
        const payload = getSubmitted();
        assert.equal(payload.crmwScode, 'C.IB');
        assert.deepEqual(Array.from(payload.items, row => row.securityCode), ['A.IB', 'A.SH']);
        assert.equal(payload.items[1].securityType, 'mtn');
        assert.equal(payload.items[1].itemTag, 'related');
        assert.equal(payload.items[1].adjustGroupKey, payload.items[0].adjustGroupKey);
        assert.match(html, /row\.itemTag === 'related'/);
        if (page.getAdjustTypeLabel) assert.equal(page.getAdjustTypeLabel('related'), '关联调整');
    });
}

test('CRMW 批量调入和调出把不可调整项稳定放到末尾', async () => {
    const { page } = harness('batch_crmw_pool_adjust');
    page.currentPool = { id: 18, poolType: 'crmw' };
    page.selectedSecurityMap = { 'C.IB|A.IB': { crmwScode: 'C.IB', securityCode: 'A.IB' } };
    page.refreshTableLayout = () => {};
    const group = { adjustGroupKey: 'GROUP', crmwScode: 'C.IB', targetPoolId: 18 };
    for (const direction of ['in', 'out']) {
        page.direction = direction;
        const adjustMode = direction === 'in' ? '调入' : '调出';
        const flowType = direction === 'in' ? 'batchInbound' : 'batchOutbound';
        page.apiPost = async () => ({ items: [
            { ...group, securityCode: 'A.SZ', itemTag: 'related', adjustMode, canAdjust: false, failReasons: ['标的已摘牌'] },
            { ...group, securityCode: 'A.IB', itemTag: 'manual', adjustMode, canAdjust: true,
                flowOptions: [{ flowId: 1, flowType, selectable: true, recommended: true }] },
            { ...group, securityCode: 'B.IB', itemTag: 'manual', adjustGroupKey: 'OTHER', adjustMode,
                canAdjust: false, failReasons: ['存在在途流程'] },
            { ...group, securityCode: 'A.SH', itemTag: 'related', adjustMode, canAdjust: true }
        ] });

        await page.goToStep2();

        const [main, related, inactive, blocked] = page.adjustReviewList;
        assert.deepEqual(Array.from(page.adjustReviewList, row => row.securityCode), ['A.IB', 'A.SH', 'A.SZ', 'B.IB']);
        assert.equal(main.flowType, flowType);
        assert.equal(main.groupColorIndex, related.groupColorIndex);
        assert.equal(main.groupColorIndex, inactive.groupColorIndex);
        assert.equal(inactive.failReasons[0], '标的已摘牌');
        assert.equal(blocked.failReasons[0], '存在在途流程');
        assert.deepEqual(Array.from(page.selectedAdjustReviewList, row => row.securityCode), ['A.IB', 'A.SH']);
        page.setReviewRowSelected(related, false);
        page.setReviewRowSelected(inactive, true);
        assert.equal(page.allReviewRowsSelected, false);
        assert.equal(inactive.selected, false);
        page.setReviewRowSelected(related, true);
        assert.equal(page.allReviewRowsSelected, true);
    }
});
