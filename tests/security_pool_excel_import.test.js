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

test('导入默认选主体，池树只筛选，清空按表格勾选提交', async () => {
    const page = harness();
    assert.equal(page.form.importType, 'company');
    assert.match(html, /<el-radio label="company">主体<\/el-radio>/);
    assert.match(html, /<el-radio label="out">调出<\/el-radio>/);
    assert.doesNotMatch(html, /form\.clearTarget/);
    page.clearPoolRows = [{ id: 16 }, { id: 17 }, { id: 23 }];
    page.clearPoolTreeNodes = { 16: { parentId: 3 }, 17: { parentId: 4 }, 23: { parentId: 3 } };
    page.clearPoolFilterIds = [3];
    assert.deepEqual(Array.from(page.filteredClearPools, row => row.id), [16, 23]);
    page.clearPoolSelection = [{ id: 23 }];
    let request;
    page.apiPost = async (url, body) => {
        request = { url, body };
        return [100];
    };
    let confirm;
    page.$confirm = (message, title, options) => {
        assert.match(message, /已勾选的 1 个投资池/);
        assert.equal(title, '确认清空目标池');
        assert.equal(options.type, 'warning');
        return new Promise(resolve => { confirm = resolve; });
    };
    const pending = page.submitClearPools();
    assert.equal(request, undefined);
    confirm();
    await pending;
    assert.equal(request.url, '/api/v1/securityPoolExcelImport/clearPools');
    assert.deepEqual(Array.from(request.body.poolIds), [23]);
    assert.equal(page.impId, '');
});

test('取消或关闭清空确认时不提交并保留勾选', async () => {
    const page = harness();
    page.clearPoolDialogVisible = true;
    const selected = [{ id: 23 }, { id: 24 }];
    page.clearPoolSelection = selected;
    let calls = 0;
    page.apiPost = async () => { calls++; };
    for (const action of ['cancel', 'close']) {
        page.$confirm = () => Promise.reject(action);
        await page.submitClearPools();
    }
    assert.equal(calls, 0);
    assert.equal(page.clearPoolDialogVisible, true);
    assert.equal(page.clearPoolSelection, selected);
    assert.equal(page.clearPoolSubmitting, false);
});

test('清空弹窗用池树全称，查询和重置刷新分页，翻页保留勾选', async () => {
    const page = harness();
    const fullName = '转债产品库/兴业国企改革可转债库';
    const sequence = html.match(/type="selection" reserve-selection[^>]*><\/el-table-column>\s*<el-table-column label="序号"[^>]*>\s*<template[^>]*>\{\{([^}]+)\}\}/);
    assert.ok(sequence);
    const rowNumber = $index => vm.runInNewContext(sequence[1], { clearPoolPagination: page.clearPoolPagination, $index });
    page.$refs = {
        clearPoolTree: { setCheckedKeys() {}, filter() {} },
        clearPoolTable: { clearSelection() {} }
    };
    const rows = Array.from({ length: 12 }, (_, index) => ({ id: index + 2, poolName: '子池' + (index + 1) }));
    page.apiPost = async url => {
        if (url.endsWith('/queryClearPoolList')) return rows;
        if (url.endsWith('/queryPoolTreeList')) return [
            { id: 1, poolName: '转债产品库', poolFullName: '转债产品库' },
            { id: 2, parentId: 1, poolName: '兴业国企改革可转债库', poolFullName: fullName }
        ];
        assert.fail(url);
    };

    await page.openClearPoolDialog();
    assert.equal(page.pagedClearPools.length, 10);
    assert.equal(page.pagedClearPools[0].poolFullName, fullName);
    assert.equal(rowNumber(0), 1);
    page.clearPoolSelection = [page.pagedClearPools[0]];
    page.clearPoolPagination.pageIndex = 2;
    assert.deepEqual(Array.from(page.pagedClearPools, row => row.id), [12, 13]);
    assert.equal(rowNumber(0), 11);
    page.clearPoolSelection.push(page.pagedClearPools[0]);

    page.updateClearPoolFilter(null, { checkedKeys: [1] });
    assert.equal(page.filteredClearPools.length, 12);
    page.searchClearPools();
    assert.equal(page.clearPoolPagination.pageIndex, 1);
    assert.deepEqual(Array.from(page.pagedClearPools, row => row.id), [2]);

    page.resetClearPoolSearch();
    assert.equal(page.filteredClearPools.length, 12);
    page.handleClearPoolSizeChange(20);
    assert.equal(page.pagedClearPools.length, 12);
    assert.deepEqual(Array.from(page.clearPoolSelection, row => row.id), [2, 12]);
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
