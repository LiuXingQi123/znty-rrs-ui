// 无需安装依赖：node --test tests/security_pool_adjust.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 执行页面实际方法，仅替代表格布局、附件加载和后端响应。
function harness(search = '', rows = []) {
    let options;
    const window = {
        location: { search, hash: '' },
        RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) },
        RrsWorkbench: { closeActiveTab: () => false }
    };
    const context = vm.createContext({ Vue: function(config) { options = config; }, window, URLSearchParams, moment() {} });
    vm.runInContext('Vue.set = (object, key, value) => { object[key] = value; };', context);
    const html = fs.readFileSync(path.join(__dirname, '../pages/security_pool_adjust.html'), 'utf8');
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = {
        ...options.data(), $refs: {}, $nextTick: fn => fn(),
        $set: (object, key, value) => { object[key] = value; },
        $delete: (object, key) => { delete object[key]; }
    };
    Object.entries(options.methods).forEach(([name, method]) => { page[name] = method.bind(page); });
    Object.entries(options.computed).forEach(([name, getter]) => {
        Object.defineProperty(page, name, { get: getter.bind(page) });
    });
    page.$message = { warning() {}, error() {} };
    for (const name of ['refreshListTableLayout', 'applyDefaultInPoolExpansion', 'applyDefaultPoolCollapse',
        'loadLogAttachments', 'loadFlowSteps', 'applyLastCreditReportToPools']) page[name] = () => {};
    const requests = [];
    page.apiPost = async (url, body) => {
        requests.push({ url, body, releaseRules: page.releaseRules });
        if (url.endsWith('/querySecurityPage')) return { records: rows, total: rows.length };
        if (url.endsWith('/querySecurityDetail')) return { windCode: body.securityCode, securityType: 'bond' };
        if (url.endsWith('/querySecurityPoolStatus')) return { securityCurrentPools: [], issuerCurrentPools: [] };
        if (url.endsWith('/queryAdjustPoolList') && body.adjustDirection === 'in') {
            return [{ id: body.releaseRules ? 2 : 1, poolName: '可调入池' }];
        }
        return [];
    };
    return { page, requests };
}

test('ABS 已占用 A 时默认恢复 A，并直接显示候选五字段', async () => {
    const { page } = harness();
    const requests = [];
    page.apiPost = async (url, body) => {
        requests.push({ url, body });
        if (url.endsWith('/querySecurityDetail')) return {
            windCode: 'ABS1', securityType: 'abs', absFlag: 1,
            absIdentity: { issuerCode: 'A', issuer: '甲' }
        };
        if (url.endsWith('/queryRelatedRatingCompanyList')) return [
            { companyCode: 'B', companyName: '乙', innerRating: '1', relationTypeCode: 115004000 },
            { companyCode: 'A', companyName: '甲', innerRating: '2', relationTypeCode: 115201000,
                ratingBondissuer: 'AA+', ratingBondissuerAgency: 'R1' }
        ];
        if (url.endsWith('/querySecurityPoolStatus')) return { securityCurrentPools: [], issuerCurrentPools: [] };
        return [];
    };
    await page.loadDetailData('ABS1');
    assert.equal(page.bondDetail.selectedRightsHolderCode, 'A');
    assert.equal(page.bondDetail.issuerCode, 'A');
    assert.equal(page.bondDetail.innerIssuerRating, '2');
    assert.equal(page.bondDetail.ratingBondissuer, 'AA+');
    assert.equal(page.bondDetail.ratingBondissuerAgency, 'R1');
    assert.equal(requests.filter(request => request.url.endsWith('/queryRelatedRatingCompanyList')).length, 1);
    assert.equal(requests.find(request => request.url.endsWith('/queryAdjustPoolList') && request.body.adjustDirection === 'in').body.rightsHolderCode, 'A');
});

test('ABS 主体冲突进入步骤二展示不可调整原因，不弹出接口异常', async () => {
    const { page } = harness();
    page.bondDetail = { windCode: 'ABS1', securityType: 'abs', selectedRightsHolderCode: 'B' };
    page.selectedInPools = [{ id: 101, poolName: '测试池', poolType: 'other' }];
    page.syncSelectedPoolsFromTables = () => {};
    page.saveIssuerFinancialChanges = async () => {};
    page.$message.error = message => assert.fail(message);
    const reason = 'ABS[ABS1]已被在库或在途主体[A]占用，不能以主体[B]进入其他库';
    page.apiPost = async url => {
        assert.equal(url, '/api/v1/securityPoolAdjust/checkAdjust');
        return { items: [{ securityCode: 'ABS1', targetPoolId: 101, poolName: '测试池',
            adjustMode: '调入', itemTag: 'manual', canAdjust: false, failReasons: [reason], flowOptions: [] }], flowOptions: [] };
    };
    await page.goToStep2();
    assert.equal(page.adjustStep, 2);
    assert.equal(page.adjustReviewList[0].valid, false);
    assert.equal(page.adjustReviewList[0].failReasons[0], reason);
    assert.equal(page.adjustReviewList[0].selectedFlowKey, '');
});

test('ABS 在途自选 C 从身份数据恢复，主档仍可为空', async () => {
    const { page } = harness();
    let inbound;
    page.apiPost = async (url, body) => {
        if (url.endsWith('/querySecurityDetail')) return {
            windCode: 'ABS1', securityType: 'abs', issuerCode: null,
            absIdentity: { issuerCode: 'C', issuer: '丙', innerIssuerRating: '1', ratingBondissuer: 'AAA', ratingBondissuerAgency: 'R2' }
        };
        if (url.endsWith('/queryRelatedRatingCompanyList')) return [{ companyCode: 'A', companyName: '甲', innerRating: '2' }];
        if (url.endsWith('/queryAdjustPoolList') && body.adjustDirection === 'in') inbound = body;
        if (url.endsWith('/querySecurityPoolStatus')) return { securityCurrentPools: [], issuerCurrentPools: [] };
        return [];
    };
    await page.loadDetailData('ABS1');
    assert.equal(page.selectedSelfRightsHolder.companyCode, 'C');
    assert.equal(page.bondDetail.issuerCode, 'C');
    assert.equal(page.bondDetail.ratingBondissuerAgency, 'R2');
    assert.equal(inbound.selfSelectedRightsHolderCode, 'C');
});

// 同券重进和换券都必须创建使用默认规则的新申请。
for (const nextCode of ['BOND1', 'BOND2']) {
    test('返回列表后进入 ' + nextCode + ' 恢复否，首次选池查询使用 false', async () => {
        const { page, requests } = harness();
        assert.equal(page.releaseRules, 'no');
        await page.handleAdjust({ windCode: 'BOND1' });
        page.releaseRules = 'yes';
        page.backToList();
        const start = requests.length;
        const loading = page.handleAdjust({ windCode: nextCode });
        assert.equal(page.releaseRules, 'no', '任何详情请求完成前已恢复默认值');
        await loading;
        assert.equal(page.bondDetail.windCode, nextCode);
        const initial = requests.slice(start).find(request => request.url.endsWith('/queryAdjustPoolList') && request.body.adjustDirection === 'in');
        assert.ok(initial);
        assert.equal(initial.body.releaseRules, false);
        assert.ok(requests.slice(start).every(request => request.releaseRules === 'no'));
        assert.equal(page.adjustInTree[0].id, 1, '首次展示使用默认规则查询到的池');
    });
}

// URL 匹配到列表记录及未匹配时的直达分支都经过详情初始化。
for (const rows of [[{ windCode: 'BOND3' }], []]) {
    test('URL 直达证券（列表' + (rows.length ? '匹配' : '未匹配') + '）使用默认规则查询', async () => {
        const { page, requests } = harness('?securityCode=BOND3', rows);
        page.releaseRules = 'yes';
        await page.applyUrlSecurityOrList();
        assert.equal(page.currentPage, 'detail');
        assert.equal(page.bondDetail.windCode, 'BOND3');
        assert.equal(page.releaseRules, 'no');
        const initial = requests.find(request => request.url.endsWith('/queryAdjustPoolList') && request.body.adjustDirection === 'in');
        assert.ok(initial);
        assert.equal(initial.body.releaseRules, false);
    });
}

// 返回上一步属于同一次申请，保留规则选择且不触发详情查询。
for (const releaseRules of ['yes', 'no']) {
    test('同一次申请返回上一步保留 ' + releaseRules, async () => {
        const { page, requests } = harness();
        await page.handleAdjust({ windCode: 'BOND1' });
        page.releaseRules = releaseRules;
        page.adjustStep = 2;
        const count = requests.length;
        page.goToStep1();
        assert.equal(page.adjustStep, 1);
        assert.equal(page.releaseRules, releaseRules);
        assert.equal(requests.length, count);
        await page.refreshAdjustInPools();
        const refreshed = requests.at(-1);
        assert.ok(refreshed.url.endsWith('/queryAdjustPoolList'));
        assert.equal(refreshed.body.releaseRules, releaseRules === 'yes');
    });
}
