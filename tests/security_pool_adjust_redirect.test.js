// 无需安装依赖：node --test tests/security_pool_adjust_redirect.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 执行审批页实际方法，后端响应由各测试控制。
function harness() {
    let options;
    const window = {
        location: { search: '?securityCode=PAGE.SH', hash: '' },
        RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) }
    };
    const context = vm.createContext({
        Vue: function(config) { options = config; }, window, URLSearchParams, moment() {}
    });
    const html = fs.readFileSync(path.join(__dirname, '../pages/security_pool_adjust_approve.html'), 'utf8');
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = { ...options.data() };
    Object.entries(options.methods).forEach(([name, method]) => { page[name] = method.bind(page); });
    Object.entries(options.computed).forEach(([name, getter]) => {
        Object.defineProperty(page, name, { get: getter.bind(page) });
    });
    return { page, options, html };
}

test('候选池使用当前申请的证券代码和申请 ID，不使用页面主档代码或评分', async () => {
    const { page } = harness();
    page.bondDetail = { windCode: 'MASTER.SH', innerGuarantorRating: '1,2+' };
    page.activeAdjustLog = { id: 101, securityCode: 'APPLICATION.SH' };
    const requests = [];
    page.apiPost = async (url, body) => { requests.push({ url, body }); return [{ id: 2 }]; };
    await page.loadRedirectPoolOptions();
    assert.equal(requests.length, 1, '只调用原候选池接口，不额外查询投资池列表');
    assert.equal(requests[0].url, '/api/v1/securityPoolAdjust/queryRedirectPoolOptions');
    assert.deepEqual(JSON.parse(JSON.stringify(requests[0].body)), {
        securityCode: 'APPLICATION.SH', adjustLogId: 101
    });
    assert.equal(page.redirectPoolOptions[0].id, 2);
});

test('缺少当前申请时清空候选池，不发送仅有证券代码的查询', async () => {
    const { page } = harness();
    let requests = 0;
    page.apiPost = async () => { requests++; return []; };
    for (const log of [null, { securityCode: 'ABS.SH' }, { id: 101 }]) {
        page.activeAdjustLog = log;
        page.redirectPoolOptions = [{ id: 2 }];
        await page.loadRedirectPoolOptions();
        assert.equal(page.redirectPoolOptions.length, 0);
    }
    assert.equal(requests, 0);
});

test('切换申请后忽略旧申请迟到的成功响应', async () => {
    const { page } = harness();
    let finishOld;
    page.activeAdjustLog = { id: 101, securityCode: 'ABS.SH' };
    page.apiPost = async (url, body) => body.adjustLogId === 101
        ? new Promise(resolve => { finishOld = resolve; }) : [{ id: 3 }];
    const oldRequest = page.loadRedirectPoolOptions();
    page.activeAdjustLog = { id: 102, securityCode: 'ABS.SH' };
    await page.loadRedirectPoolOptions();
    finishOld([{ id: 2 }]);
    await oldRequest;
    assert.equal(page.redirectPoolOptions[0].id, 3);
});

test('旧申请失败也不能清空新申请候选池', async () => {
    const { page } = harness();
    let failOld;
    page.activeAdjustLog = { id: 101, securityCode: 'ABS.SH' };
    page.apiPost = async (url, body) => body.adjustLogId === 101
        ? new Promise((resolve, reject) => { failOld = reject; }) : [{ id: 3 }];
    const oldRequest = page.loadRedirectPoolOptions();
    page.activeAdjustLog = { id: 102, securityCode: 'ABS.SH' };
    await page.loadRedirectPoolOptions();
    failOld(new Error('缺少主体快照'));
    await oldRequest;
    assert.equal(page.redirectPoolOptions[0].id, 3);
});

test('当前申请查询失败时清空旧候选池', async () => {
    const { page } = harness();
    page.activeAdjustLog = { id: 101, securityCode: 'ABS.SH' };
    page.redirectPoolOptions = [{ id: 2 }];
    page.apiPost = async () => { throw new Error('所选权益人无最新内评分'); };
    await page.loadRedirectPoolOptions();
    assert.equal(page.redirectPoolOptions.length, 0);
});

test('直接展示后端返回的完整路径，保留同名候选及原池 ID，只查询一次', async () => {
    const { page, html } = harness();
    page.activeAdjustLog = { id: 101, securityCode: 'ABS.SH' };
    const candidates = [
        { id: 2, poolName: '一级库', poolFullName: '信用债大库(new)/一级库' },
        { id: 59, poolName: '一级库', poolFullName: '兴业中高等级信用债/一级库' },
        { id: 100, poolName: '一级库', poolFullName: '信用债大库(old)/一级库' }
    ];
    const requests = [];
    page.apiPost = async url => { requests.push(url); return candidates; };
    await page.loadRedirectPoolOptions();
    assert.deepEqual(requests, ['/api/v1/securityPoolAdjust/queryRedirectPoolOptions']);
    assert.equal(page.redirectPoolOptions, candidates, '直接使用后端返回结果，无需前端加工路径');
    assert.deepEqual(Array.from(page.redirectPoolOptions, pool => pool.id), [2, 59, 100]);
    assert.deepEqual(Array.from(page.redirectPoolOptions, pool => pool.poolFullName), [
        '信用债大库(new)/一级库', '兴业中高等级信用债/一级库', '信用债大库(old)/一级库'
    ]);
    assert.match(html, /:key="p\.id" :label="p\.poolFullName" :value="p\.id"/);
});

test('仅审批入口有待办时加载候选池，历史已办及下一步确认不触发改判查询', () => {
    const { page, options } = harness();
    page.activeAdjustLog = { id: 101, securityCode: 'ABS.SH', poolType: 'credit_bond', adjustMode: '调入' };
    page.entryMode = 'process';
    let requests = 0;
    page.loadRedirectPoolOptions = () => { requests++; };
    page.redirectPoolId = 2;
    options.watch.activeAdjustLog.call(page);
    assert.equal(requests, 0);
    assert.equal(page.redirectPoolId, null);
    page.flowStepList = [{ id: 1, stepStatus: 'pending', handlerId: '1' }];
    options.watch.activeAdjustLog.call(page);
    assert.equal(requests, 1);
    page.entryMode = 'next';
    options.watch.activeAdjustLog.call(page);
    assert.equal(requests, 1);
});
