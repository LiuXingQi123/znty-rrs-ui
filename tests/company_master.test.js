// 无需安装依赖：node --test tests/company_master.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(name) {
    const html = fs.readFileSync(path.join(__dirname, '../pages', name + '.html'), 'utf8');
    let options;
    const context = vm.createContext({
        Vue: function(config) { options = config; },
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) }, location: { search: '' } },
        URLSearchParams, moment: () => ({ format: () => '' })
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context, { filename: name });
    }
    const page = { ...options.data(), $refs: {}, $nextTick: () => {}, $message: { error() {}, warning() {} } };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.entries(options.computed || {}).forEach(([key, getter]) => {
        Object.defineProperty(page, key, { get: getter.bind(page) });
    });
    return { html, page };
}

for (const name of ['forbidden_pool_adjust', 'forbidden_pool_adjust_approve', 'forbidden_pool_adjust_detail']) {
    test(name + ' 发送全称和信用代码筛选，重置后不保留旧行业条件', async () => {
        const { page } = harness(name);
        const requests = [];
        page.apiPost = async (url, body) => {
            requests.push({ url, body });
            return { records: [{ companyCode: 'C001', companyFullName: '主体有限公司', registerNumber: null }], total: 1 };
        };
        page.searchForm.companyFullName = '主体有限公司';
        page.searchForm.registerNumber = 'CREDIT001';
        await page.loadList();
        assert.equal(requests[0].body.companyFullName, '主体有限公司');
        assert.equal(requests[0].body.registerNumber, 'CREDIT001');
        assert.equal(requests[0].body.industryName, undefined);
        assert.equal(page.tableData[0].registerNumber, null);
        page.handleReset();
        assert.equal(page.searchForm.registerNumber, '');
        assert.equal(page.searchForm.companyFullName, '');
    });
}

for (const name of ['forbidden_pool_adjust_approve', 'forbidden_pool_adjust_detail']) {
    test(name + ' 校验请求使用全称，保留既有接口字段和调库项', async () => {
        const { page } = harness(name);
        page.companyDetail = { companyCode: 'C001', companyFullName: '主体有限公司', companyShortName: '主体简称' };
        page.selectedInPools = [{ id: 15, poolName: '禁止库', poolType: 'forbidden' }];
        page.selectedOutPools = [];
        let request;
        page.apiPost = async (url, body) => { request = { url, body }; return { items: [] }; };
        await page.goToStep2();
        assert.ok(request.url.endsWith('/checkAdjust'));
        assert.equal(request.body.companyShortName, '主体有限公司');
        assert.equal(request.body.items.length, 1);
        assert.equal(request.body.items[0].targetPoolId, 15);
        assert.equal(request.body.items[0].adjustMode, '调入');
    });
}
