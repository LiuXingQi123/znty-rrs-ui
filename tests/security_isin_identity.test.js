// node --test tests/security_isin_identity.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const pages = ['security_pool_adjust', 'security_pool_query', 'security_pool_adjust_approve', 'security_pool_adjust_detail', 'security_pool_adjust_history', 'batch_security_pool_adjust', 'crmw_pool_adjust', 'crmw_pool_query', 'crmw_pool_adjust_approve', 'crmw_pool_adjust_detail', 'crmw_pool_adjust_history', 'batch_crmw_pool_adjust', 'stock_security_batch_adjust', 'security_pool_excel_import', 'crmw_pool_excel_import', 'forbidden_pool_adjust', 'forbidden_pool_query', 'forbidden_pool_history', 'forbidden_pool_adjust_approve', 'forbidden_pool_adjust_detail', 'temp_security_code', 'my_matters'];

function harness(name) {
    let config;
    function Vue(options) { config = options; }
    Vue.mixin = () => {};
    Vue.component = () => {};
    Vue.filter = () => {};
    const tabs = [];
    const window = { location: { search: '', pathname: '/pages/' + name + '.html' },
        RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试' }), appendUserParams() {} },
        RrsWorkbench: { openDetailTab(tab) { tabs.push(tab); return true; }, resolveAdjustLogId: row => row.adjustLogId,
            buildTabIndex: (prefix, keys) => prefix + keys.join('|'), formatDetailTitle: name => name },
        addEventListener() {}, removeEventListener() {} };
    const context = vm.createContext({ Vue, window, document: {}, URLSearchParams, FormData, console,
        setTimeout, clearTimeout, moment: () => ({ format: () => '2026-10-09' }) });
    const html = fs.readFileSync(path.join(root, 'pages', name + '.html'), 'utf8');
    for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (script[1].trim()) vm.runInContext(script[1], context, { filename: name });
    }
    const page = { $message: { success() {}, error() {}, warning() {} }, $refs: {}, $nextTick: f => f(),
        $set: (object, key, value) => { object[key] = value; } };
    Object.entries(config.methods).forEach(([name, fn]) => { page[name] = fn.bind(page); });
    return { page, tabs, html, config };
}

test('各页面使用本页Vue方法及插槽，五码全量展示、固定顺序、空值不占位', () => {
    for (const name of pages) {
        const { page, html } = harness(name);
        assert.doesNotMatch(html, /security_codes\.js|<rrs-security-codes/);
        const row = { isinCode: 'CN0000000001', windCodeSh: '1.SH', windCodeSz: '1.SZ', windCodeNib: '1.IB', windCodeBj: '1.BJ', windCodeNbc: '长码'.repeat(100) };
        assert.equal(page.securityCodeItems(row).map(code => code.label).join(','), '沪,深,银行间,北,其他', name);
        assert.equal(page.securityCodeItems(row)[4].value, row.windCodeNbc, name);
        assert.equal(page.securityCodeItems({ isinCode: row.isinCode }).length, 0, name);
        assert.equal(page.securityCodeItems({ ...row, securityType: 'crmw' }).length, 1, name);
        assert.equal(page.securityCodeItems({ isinCode: 'TEMP:T001', securityMarket: 'CIBM' })[0].value, 'T001', name);
        assert.equal(page.isTemporarySecurity({ isinCode: 'TEMP:T001' }), true, name);
    }
});

test('批量跨页选择按ISIN去重，临时与正式来源不会混淆', () => {
    const { page } = harness('batch_security_pool_adjust');
    page.selectedSecurityMap = {}; page.selectionSyncing = false;
    const first = { isinCode: 'CN1', windCodeSh: '1.SH' };
    page.securityTableData = [first]; page.handleSecuritySelectionChange([first]);
    const same = { isinCode: 'CN1', windCodeNib: '1.IB' };
    const temp = { isinCode: 'TEMP:CN1', windCodeNib: 'T1' };
    page.securityTableData = [same, temp]; page.handleSecuritySelectionChange([same, temp]);
    assert.deepEqual(Object.keys(page.selectedSecurityMap).sort(), ['CN1', 'TEMP:CN1']);
});

test('CRMW选中键使用凭证与标的两个ISIN', () => {
    const { page } = harness('batch_crmw_pool_adjust');
    assert.equal(page.candidateRowKey({ isinCode: 'BOND1', crmwIsinCode: 'CRMW1' }), 'CRMW1|BOND1');
    assert.notEqual(page.candidateRowKey({ isinCode: 'BOND1', crmwIsinCode: 'CRMW2' }), 'CRMW1|BOND1');
});

test('详情路由和收藏提交只传ISIN，状态行id不代替证券身份', async () => {
    const { page, tabs } = harness('security_pool_query');
    page.pagePaths = { securityPoolAdjustDetail: 'security_pool_adjust_detail.html' };
    const row = { id: 999, isinCode: 'TEMP:T001', securityShortName: '临时券', targetPoolId: 100, adjustLogId: 77 };
    page.openSecurityAdjustDetail(row);
    const query = new URLSearchParams(tabs[0].query);
    assert.equal(query.get('isinCode'), row.isinCode);
    assert.equal(query.get('adjustLogId'), '77');
    assert.equal(query.has('securityCode'), false);
    const requests = []; page.searchForm = { currentUserId: '1' };
    page.apiPost = async (url, body) => { requests.push({ url, body }); };
    await page.toggleFavorite(row);
    assert.equal(requests[0].body.isinCode, row.isinCode);
    assert.equal(requests[0].body.securityCode, undefined);
});


test('CRMW详情分别展示银行间代码和ISIN', () => {
    for (const name of ['crmw_pool_adjust', 'crmw_pool_adjust_approve', 'crmw_pool_adjust_detail']) {
        const html = fs.readFileSync(path.join(__dirname, '..', 'pages', name + '.html'), 'utf8');
        assert.match(html, /label="CRMW银行间代码"[\s\S]*?crmwDetail\.windCodeNib/);
        assert.match(html, /label="CRMW ISIN"[\s\S]*?crmwDetail\.isinCode/);
    }
});


test('CRMW审批和历史详情携带日志ID读取凭证快照', () => {
    for (const name of ['crmw_pool_adjust_approve', 'crmw_pool_adjust_detail']) {
        const html = fs.readFileSync(path.join(root, 'pages', name + '.html'), 'utf8');
        assert.match(html, /queryCrmwDetail', \{ isinCode: this\.selectedCrmwCode, adjustLogId: this\.selectedAdjustLogId \}/);
    }
});


test('所有证券代码展示只含代码本身，保留五码顺序和临时代码', () => {
    for (const name of pages) {
        const { page, html } = harness(name);
        const row = { windCodeSh: '1.SH', windCodeSz: '1.SZ', windCodeNib: '1.IB', windCodeBj: '1.BJ', windCodeNbc: 'LONG.CODE' };
        assert.equal(page.securityCodesText(row), '1.SH  1.SZ  1.IB  1.BJ  LONG.CODE', name);
        assert.equal(page.securityCodesText({ ...row, securityType: 'crmw' }), '1.IB', name);
        assert.equal(page.securityCodesText({ isinCode: 'TEMP:T001', securityMarket: 'CIBM' }), 'T001', name);
        assert.doesNotMatch(html, /\{\{\s*code\.label\s*\}\}/, name);
    }
});

test('CRMW调库记录展示凭证代码快照，不把ISIN显示为证券代码', () => {
    for (const name of ['crmw_pool_adjust_approve', 'crmw_pool_adjust_detail']) {
        const { html } = harness(name);
        const table = html.match(/<el-table\b[^>]*:data="adjustLogList"[\s\S]*?<\/el-table>/)[0];
        assert.match(table, /row\.crmwScode/);
        assert.doesNotMatch(table, /\{\{\s*row\.crmwIsinCode\s*\}\}/);
    }
});


// 创建带页面初始状态及计算属性的实例，执行真实校验结果组装流程。
function reviewHarness(name) {
    const { page, config } = harness(name);
    Object.assign(page, config.data.call(page));
    for (const [key, getter] of Object.entries(config.computed || {})) {
        if (typeof getter === 'function') Object.defineProperty(page, key, { configurable: true, get: getter.bind(page) });
    }
    page.bondDetail = { isinCode: 'CNMAIN', shortName: '主券', securityType: 'credit_bond' };
    page.absBondDetail = { isinCode: 'CNMAIN', shortName: '主券', securityType: 'abs', selectedGuarantorCode: 'C10001' };
    page.companyDetail = { companyCode: 'C10001', companyShortName: '主体', securityType: 'company' };
    page.crmwDetail = { isinCode: 'CNCRMW', windCodeNib: '032400101.IB', securityType: 'crmw' };
    page.selectedInPools = [{ id: 1, poolName: '目标池', poolType: 'credit_bond' }];
    page.selectedOutPools = [];
    page.absSelectedInPools = page.selectedInPools;
    page.absSelectedOutPools = [];
    page.relatedRatingCompanyOptions = [];
    page.financialBusy = false;
    page.saveIssuerFinancialChanges = async () => {};
    page.syncSelectedPoolsFromTables = () => {};
    page.absSyncSelectedPoolsFromTables = () => {};
    for (const method of ['getAttachmentFiles', 'getMaterialFiles', 'getCreditReportSelections', 'getOtherMaterialSelections',
        'absGetAttachmentFiles', 'absGetMaterialFiles', 'absGetCreditReportSelections', 'absGetOtherMaterialSelections']) page[method] = () => [];
    page.$message.error = message => { throw new Error(name + ': ' + message); };
    return page;
}

// 主券、关联券及临时券分别携带自己的市场代码，防止展示时混用当前主券。
function reviewItems() {
    return [
        { isinCode: 'CNMAIN', windCodeSh: '184901.SH', windCodeSz: '149901.SZ', windCodeNib: '102480001.IB',
            windCodeBj: '830001.BJ', windCodeNbc: 'XS2400000001', securitySource: 'official', itemTag: 'manual' },
        { isinCode: 'CNRELATED', windCodeNib: '102480002.IB', crmwIsinCode: 'CNCRMW', crmwScode: '032400101.IB',
            securitySource: 'official', itemTag: 'mutex' },
        { isinCode: 'TEMP:TMP001.IB', windCodeNib: 'TMP001.IB', securitySource: 'temporary', itemTag: 'related' }
    ].map((row, index) => ({ ...row, targetPoolId: index + 1, poolName: '目标池', securityType: 'credit_bond',
        securityShortName: '测试券', adjustMode: '调入', canAdjust: true, flowOptions: [] }));
}

// 核对从响应到校验表再到展示文本的完整链路。
function assertReviewCodes(page, rows, name) {
    assert.equal(rows.length, 3, name);
    assert.equal(page.securityCodesText(rows[0]), '184901.SH  149901.SZ  102480001.IB  830001.BJ  XS2400000001', name);
    assert.equal(page.securityCodesText(rows[1]), '102480002.IB', name);
    assert.equal(page.securityCodesText(rows[2]), 'TMP001.IB', name);
    assert.equal(rows[1].isinCode, 'CNRELATED', name);
    assert.equal(rows[1].crmwScode, '032400101.IB', name);
    assert.equal(rows[2].securitySource, 'temporary', name);
    assert.equal(page.isTemporarySecurity(rows[2]), true, name);
}

test('单笔申请、审核和详情校验表保留每条响应的五码及身份', async () => {
    const names = ['security_pool_adjust', 'security_pool_adjust_approve', 'security_pool_adjust_detail',
        'crmw_pool_adjust', 'crmw_pool_adjust_approve', 'crmw_pool_adjust_detail',
        'forbidden_pool_adjust', 'forbidden_pool_adjust_approve', 'forbidden_pool_adjust_detail'];
    for (const name of names) {
        const page = reviewHarness(name);
        page.apiPost = async () => ({ items: reviewItems(), flowOptions: [] });
        await page.goToStep2();
        assertReviewCodes(page, page.adjustReviewList, name);
    }
});

test('ABS禁投校验表保留市场代码及临时来源', async () => {
    const page = reviewHarness('forbidden_pool_adjust');
    page.apiPost = async () => ({ items: reviewItems(), flowOptions: [] });
    await page.absGoToStep2();
    assertReviewCodes(page, page.absAdjustReviewList, 'ABS');
});

test('批量证券、存量和CRMW校验行保留响应代码，不混用主券信息', () => {
    for (const name of ['batch_security_pool_adjust', 'stock_security_batch_adjust', 'batch_crmw_pool_adjust']) {
        const page = reviewHarness(name);
        assertReviewCodes(page, reviewItems().map((item, index) => page.buildReviewRow(item, index)), name);
    }
});
