// 无需安装依赖：node --test tests/security_pool_excel_import.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../pages/security_pool_excel_import.html'), 'utf8');

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
    return page;
}

function manual() {
    return {
        sourceItemId: 10, sourceSecurityCode: '108008901.IB', securityCode: '108008901.IB',
        targetPoolId: 5, itemTag: 'manual', adjustGroupKey: 'G1', adjustMode: '调入', canAdjust: true,
        failReasons: ['证券当前在调入限制池中：债券禁止库', '证券当前在禁止池中'],
        flowId: 107, flowKey: 'bond:batch', flowType: 'batchInbound',
        flowOptions: [{ flowId: 107, flowKey: 'bond:batch', flowType: 'batchInbound', selectable: true, recommended: true }]
    };
}

test('有业务调整提示的行仍进入提交集合，同组关联项一并提交', async () => {
    const page = harness();
    const row = manual();
    const related = { ...row, securityCode: 'RELATED.SH', itemTag: 'related', flowOptions: [] };
    page.applyTask({ impId: 'EXCEL_TIPS', saveRslt: '0', chkRslt: '1', checkDone: true,
        checkItems: [row, related], checkPassCount: 2, checkFailCount: 0 });
    assert.equal(page.validCheckCount, 2);
    assert.equal(page.canSubmit, true);
    assert.equal(page.allValidRowsHaveFlow, true);
    let captured;
    page.apiPost = async (url, body) => { captured = { url, body }; return {}; };
    await page.confirmFlowSelection();
    assert.equal(captured.url, '/api/v1/securityPoolExcelImport/submitImport');
    assert.equal(captured.body.checkItems.length, 2);
    assert.deepEqual(Array.from(captured.body.checkItems[0].failReasons), row.failReasons);
    assert.equal(captured.body.checkItems[0].flowType, 'batchInbound');
    assert.equal(captured.body.checkItems[0].flowId, 107);
    assert.equal(captured.body.checkItems[1].itemTag, 'related');
});

test('无法识别的数据仍不混入可提交项，有效且带提示的行保留', () => {
    const page = harness();
    page.applyTask({ impId: 'EXCEL_MIXED', saveRslt: '0', chkRslt: '2', checkDone: true,
        checkItems: [manual(), { securityCode: 'UNKNOWN', canAdjust: false, failReasons: ['证券不存在'] }] });
    assert.equal(page.validCheckCount, 1);
    assert.equal(page.validCheckItems[0].securityCode, '108008901.IB');
    assert.equal(page.validCheckItems[0].failReasons.length, 2);
});

test('提交响应中的清空项按页面选项键回显无需审批', () => {
    const page = harness();
    const row = {
        ...manual(),
        sourceItemId: null, itemTag: 'clear', adjustMode: '调出',
        flowId: null, flowKey: null, flowType: 'normalOutbound', directFlow: true,
        selectedFlowKey: '0_normalOutbound_1',
        flowOptions: [
            { flowId: 107, flowKey: 'bond:batch-out', flowType: 'batchOutbound', selectable: true, recommended: true },
            { flowType: 'normalOutbound', selectable: true },
        ],
    };
    page.applyTask({ impId: 'EXCEL_CLEAR', saveRslt: '1', chkRslt: '1', checkDone: true, checkItems: [row] });

    assert.equal(page.checkItems[0].selectedFlowKey, '0_normalOutbound_1');
    assert.equal(page.checkItems[0].flowName, '无需审批');
    assert.equal(page.checkItems[0].directFlow, true);
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
    assert.equal(page.validCheckCount, 0);
    assert.equal(page.canSubmit, false);
    assert.match(page.checkItems[0].failReasons[0], /C10008.*C10010/);
});
