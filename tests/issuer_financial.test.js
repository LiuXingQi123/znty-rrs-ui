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
function harness(name) {
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
    function applyOptions(config) {
        (config.mixins || []).forEach(applyOptions);
        if (config.data) Object.assign(page, config.data.call(page));
        Object.entries(config.methods || {}).forEach(([key, method]) => { page[key] = method.bind(page); });
    }
    applyOptions(options);
    return page;
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
