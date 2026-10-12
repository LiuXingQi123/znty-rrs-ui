// node --test tests/adjust_release_rules.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createPage(name) {
    let config;
    function Vue(options) { config = options; }
    Vue.mixin = () => {};
    Vue.component = () => {};
    Vue.filter = () => {};
    const window = {
        location: { search: '', pathname: '/pages/' + name + '.html' },
        RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试' }) },
        RrsWorkbench: { closeActiveTab: () => false },
        addEventListener() {}, removeEventListener() {}
    };
    const context = vm.createContext({ Vue, window, document: {}, URLSearchParams, FormData, console,
        setTimeout, clearTimeout, moment: () => ({ format: () => '2026-10-10' }) });
    const html = fs.readFileSync(path.join(__dirname, '..', 'pages', name + '.html'), 'utf8');
    for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (script[1].trim()) vm.runInContext(script[1], context, { filename: name });
    }
    const page = { $refs: {}, $nextTick: callback => callback(),
        $set: (object, key, value) => { object[key] = value; } };
    Object.entries(config.methods).forEach(([name, method]) => { page[name] = method.bind(page); });
    Object.assign(page, config.data.call(page));
    Object.entries(config.computed || {}).forEach(([name, getter]) => {
        if (typeof getter === 'function') Object.defineProperty(page, name, { get: getter.bind(page) });
    });
    return page;
}

function createSecurityPage() {
    const page = createPage('security_pool_adjust');
    const requests = [];
    page.apiPost = async (url, body) => {
        requests.push({ url, body, releaseRules: page.releaseRules });
        if (url.endsWith('/querySecurityDetail')) return { isinCode: body.isinCode, securityType: 'mtn' };
        if (url.endsWith('/querySecurityPoolStatus')) return {};
        return [];
    };
    page.queryRelatedRatingCompanyMap = async () => ({});
    page.applyDefaultPoolCollapse = () => {};
    page.loadLogAttachments = async () => {};
    page.loadFlowSteps = () => {};
    page.applyLastCreditReportToPools = async () => {};
    page.refreshListTableLayout = () => {};
    return { page, requests };
}

test('证券调库重复进入及直接加载均在查询前恢复默认规则', async () => {
    const { page, requests } = createSecurityPage();
    assert.equal(page.releaseRules, 'no');
    for (const isinCode of ['CN0000000001', 'CN0000000002']) {
        page.releaseRules = 'yes';
        requests.length = 0;
        await page.handleAdjust({ isinCode });
        assert.equal(page.releaseRules, 'no');
        assert.ok(requests.length > 0);
        assert.equal(requests[0].releaseRules, 'no');
        const inbound = requests.find(request => request.body.adjustDirection === 'in');
        assert.ok(inbound, '必须实际查询可调入池');
        assert.equal(inbound.body.releaseRules, false);
        assert.equal(page.bondDetail.isinCode, isinCode);
        page.backToList();
    }
    page.releaseRules = 'yes';
    requests.length = 0;
    await page.loadDetailData('CN0000000003');
    assert.equal(requests[0].releaseRules, 'no');
    assert.equal(requests.find(request => request.body.adjustDirection === 'in').body.releaseRules, false);
});

test('当前申请允许放开规则，上一步保留选择，返回列表清理选择', async () => {
    const { page, requests } = createSecurityPage();
    await page.handleAdjust({ isinCode: 'CN0000000001' });
    requests.length = 0;
    page.releaseRules = 'yes';
    await page.onReleaseRulesChange();
    assert.equal(requests.find(request => request.body.adjustDirection === 'in').body.releaseRules, true);
    assert.equal(page.releaseRules, 'yes');
    page.adjustStep = 2;
    page.goToStep1();
    assert.equal(page.releaseRules, 'yes');
    page.backToList();
    assert.equal(page.releaseRules, 'no');
});

for (const name of ['batch_security_pool_adjust', 'batch_crmw_pool_adjust', 'stock_security_batch_adjust']) {
    test(name + ' 重复进入批量调库时恢复默认规则', () => {
        const page = createPage(name);
        const selectionsAtQuery = [];
        page.loadSecurityList = () => { selectionsAtQuery.push(page.releaseRules); };
        page.refreshTableLayout = () => {};
        page.applyDefaultSourcePoolSelection = () => {};
        assert.equal(page.releaseRules, 'no');
        for (const direction of ['in', 'out']) {
            page.releaseRules = 'yes';
            page.openAdjust({ id: 1 }, direction);
            assert.equal(page.releaseRules, 'no');
            assert.equal(selectionsAtQuery.at(-1), 'no');
            page.releaseRules = 'yes';
            page.backToPoolList();
            assert.equal(page.releaseRules, 'no');
        }
    });
}
