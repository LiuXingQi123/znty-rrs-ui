// 无需安装依赖：node --test tests/batch_security_pool_adjust.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../pages/batch_security_pool_adjust.html'), 'utf8');

// 执行页面实际方法，隔离浏览器和接口请求
function harness() {
    let options;
    function Vue(config) { options = config; }
    const context = vm.createContext({
        Vue,
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '管理员' }) } },
        moment: () => ({ format: () => '2026-10-26' })
    });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = { $refs: {}, $nextTick: callback => callback() };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.assign(page, options.data.call(page));
    return page;
}

for (const direction of ['in', 'out']) {
    test(`${direction} 查询按发行人及其他条件请求后端，翻页保留发行人`, async () => {
        const page = harness();
        assert.match(html, /v-model\.trim="securitySearchForm\.issuer"[^>]*placeholder="发行人"[^>]*clearable[^>]*@keyup\.enter\.native="handleSecuritySearch"/);
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
            securityShortName: '债', marketCodes: ['NIB'], bondYesFlags: ['abs'], pageIndex: 1, pageSize: 10
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
