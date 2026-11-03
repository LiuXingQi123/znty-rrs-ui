// 无需安装依赖：node --test tests/issuer_financial.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pages = [
    'security_pool_adjust', 'security_pool_adjust_approve', 'security_pool_adjust_detail',
    'crmw_pool_adjust', 'crmw_pool_adjust_approve', 'crmw_pool_adjust_detail',
    'forbidden_pool_adjust'
];

// 加载实际页面及财务 mixin，仅替代 Vue 挂载和响应式赋值。
function harness(name, withSelectionComputed = false) {
    let options;
    const context = vm.createContext({
        Vue: function(config) { options = config; }, URLSearchParams,
        window: { location: { search: '' }, RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) } },
        moment: () => ({ format: () => '' })
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    const html = fs.readFileSync(path.join(__dirname, '../pages', name + '.html'), 'utf8');
    for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (script[1].trim()) vm.runInContext(script[1], context, { filename: name });
    }
    const page = {
        $set: (object, key, value) => { object[key] = value; },
        $delete: (object, key) => { delete object[key]; }
    };
    const computed = {};
    function applyOptions(config) {
        (config.mixins || []).forEach(applyOptions);
        if (config.data) Object.assign(page, config.data.call(page));
        Object.entries(config.methods || {}).forEach(([key, method]) => { page[key] = method.bind(page); });
        Object.assign(computed, config.computed || {});
    }
    applyOptions(options);
    if (withSelectionComputed) {
        for (const key of ['financialUnavailable', 'financialIssuerKey', 'financialColumns',
            'issuerFinancialSecurityCode', 'guarantorOptions', 'absGuarantorOptions', 'relatedRatingCompanyOptions']) {
            if (computed[key]) Object.defineProperty(page, key, { get: computed[key].bind(page) });
        }
    }
    return page;
}

function selectionPage(name) {
    const page = harness(name, true);
    page.$message = { warning() {}, error() {}, success() {} };
    const forbidden = name === 'forbidden_pool_adjust';
    const main = name === 'security_pool_adjust';
    const detailKey = forbidden ? 'absBondDetail' : 'bondDetail';
    const selfKey = forbidden ? 'absSelectedSelfRightsHolder' : 'selectedSelfRightsHolder';
    page[detailKey] = { windCode: 'ABS1', securityType: 'abs', absFlag: 1 };
    page.applyAdjustInPoolList = () => [];
    function selectSelf(code) {
        page[selfKey] = code ? { companyCode: code, companyName: '主体' + code } : null;
        if (main) page[detailKey].selectedSelfSelectedRightsHolderCode = code || '';
    }
    const load = () => main ? page.refreshAdjustInPools() : page.loadIssuerFinancialData();
    return { page, detailKey, selfKey, selectSelf, load, main, forbidden };
}

for (const name of ['security_pool_adjust', 'forbidden_pool_adjust', 'crmw_pool_adjust']) {
    test(name + ' 未选主体时清空缓存并禁止财报查询、编辑及保存', async () => {
        const { page, load } = selectionPage(name);
        const requests = [];
        page.apiPost = async (url, payload) => { requests.push({ url, payload }); return []; };
        page.initializeFinancialEditData([{ reportDate: 20251231, totAssets: 99 }]);
        page.financialDirtyFields = { 20251231: { totAssets: true } };
        await load();
        assert.equal(page.financialUnavailable, true);
        assert.equal(page.financialColumns.length, 4);
        assert.equal(page.financialColumns.every(column => column.reportDate === ''), true);
        assert.equal(Object.keys(page.financialEditData).length, 0);
        assert.equal(Object.keys(page.financialDirtyFields).length, 0);
        await page.handleFinancialReportDateChange(0, '20251231');
        await page.saveIssuerFinancialChanges(true);
        assert.equal(requests.some(item => /Financial/.test(item.url)), false);
    });

    test(name + ' 主体清空后旧财报响应不能重新填入页面', async () => {
        const { page, selectSelf, load } = selectionPage(name);
        let complete;
        let count = 0;
        page.apiPost = async url => {
            if (!url.includes('queryIssuerFinancialList')) return [];
            count++;
            return new Promise(resolve => { complete = resolve; });
        };
        selectSelf('A');
        const pending = load();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(typeof complete, 'function');
        selectSelf(null);
        await load();
        complete([{ reportDate: 20251231, totAssets: 99 }]);
        await pending;
        assert.equal(count, 1);
        assert.equal(page.issuerFinancialList.length, 0);
        assert.equal(Object.keys(page.financialEditData).length, 0);
    });

    test(name + ' 清除自选后财报使用仍保留的普通权益人', async () => {
        const { page, detailKey, selectSelf, load, main, forbidden } = selectionPage(name);
        const ordinary = { code: 'A', name: '主体A', rating: '2' };
        if (main) page.relatedRatingCompanyMap = { A: ordinary };
        else if (forbidden) page.absGuarantorGradeMap = { A: ordinary };
        else page.guarantorGradeMap = { A: ordinary };
        page[detailKey][main ? 'selectedRightsHolderCode' : 'selectedGuarantorCode'] = 'A';
        selectSelf('B');
        selectSelf(null);
        let selected;
        page.apiPost = async (url, payload) => {
            if (!url.includes('queryIssuerFinancialList')) return [];
            selected = payload.selectedRatingCompany;
            return [{ reportDate: 20251231, totAssets: 12 }];
        };
        await load();
        assert.equal(page.financialUnavailable, false);
        assert.equal(selected.companyCode, 'A');
        assert.equal(selected.companyName, '主体A');
        assert.equal(page.issuerFinancialList[0].totAssets, 12);
    });
}

for (const name of pages) {
    test(name + ' 使用新字段展示财务倍数，可编辑页面按新字段保存及清空', () => {
        const page = harness(name);
        const rows = page.industrialFinancialIndicatorRows || page.industrialIssuerFinancialIndicatorRows;
        const debtRow = rows.find(row => row.label === '总债务/EBITDA');
        const coverageRow = rows.find(row => row.label === 'EBITDA利息保护倍数');
        assert.equal(debtRow.field, 'debtToEbitda');
        assert.equal(coverageRow.field, 'expToEbitda');
        const record = { reportDate: 20251231, debtToEbitda: 6.25, expToEbitda: 3.5 };
        if (page.initializeFinancialEditData) {
            page.initializeFinancialEditData([record]);
            assert.equal(page.financialDisplayValue(debtRow, record), 6.25);
            assert.equal(page.financialDisplayValue(coverageRow, record), 3.5);
            page.updateFinancialValue(debtRow, record, 0, '8');
            page.updateFinancialValue(coverageRow, record, 0, '4');
            const saved = page.buildIssuerFinancialChanges()[0];
            assert.equal(saved.debtToEbitda, '8');
            assert.equal(saved.expToEbitda, '4');
            assert.equal(Object.keys(saved).length, 15, '报告日期及完整14项指标');
            page.updateFinancialValue(debtRow, record, 0, '');
            page.updateFinancialValue(coverageRow, record, 0, '');
            const cleared = page.buildIssuerFinancialChanges()[0];
            assert.equal(cleared.debtToEbitda, null);
            assert.equal(cleared.expToEbitda, null);
        } else {
            assert.equal(page.issuerFinancialValue(record, debtRow.field), 6.25);
            assert.equal(page.issuerFinancialValue(record, coverageRow.field), 3.5);
            assert.equal(page.issuerFinancialValue({}, debtRow.field), '');
            assert.equal(page.issuerFinancialValue({}, coverageRow.field), '');
        }
    });
}
