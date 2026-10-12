// 无需安装依赖：node --test tests/security_market.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pages = ['security_pool_adjust', 'security_pool_adjust_approve', 'security_pool_adjust_detail',
    'crmw_pool_adjust', 'crmw_pool_adjust_approve', 'crmw_pool_adjust_detail', 'forbidden_pool_adjust'];

for (const name of pages) {
    test(name + ' 按当前市场和只读关联列表完整显示同市场代码', () => {
        let options;
        const context = vm.createContext({ Vue: function(config) { options = config; }, window: {}, moment() {} });
        const html = fs.readFileSync(path.join(__dirname, '../pages/' + name + '.html'), 'utf8');
        for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
            if (match[1].trim()) vm.runInContext(match[1], context);
        }
        const method = options.methods.relatedMarketCodeText;
        assert.equal(typeof method, 'function');
        const detail = { windCode: 'A.IB', marketCode: 'CIBM', relatedMarketCodes: [
            { windCode: 'B.SH', marketCode: 'SSE' }, { windCode: 'C.SH', marketCode: 'SSE' },
            { windCode: 'B.SH', marketCode: 'SSE' }, { windCode: 'D.SZ', marketCode: 'SZSE' }
        ] };
        assert.equal(method(detail, 'CIBM'), 'A.IB');
        assert.equal(method(detail, 'SSE'), 'B.SH、C.SH');
        assert.equal(method(detail, 'SZSE'), 'D.SZ');
        assert.equal(method(detail, 'BSE'), '');
        assert.equal(method(null, 'SSE'), '');
        assert.equal(method({ windCode: 'TMP', marketCode: 'SSE' }, 'SSE'), 'TMP');
        assert.equal(method({ windCode: 'CORP.IB', marketCode: 'OTHER', relatedMarketCodes: [
            { windCode: 'X.HK', marketCode: 'HKEX' }, { windCode: 'Y.SH', marketCode: 'SSE' }
        ] }, 'OTHER'), 'CORP.IB、X.HK');
        assert.match(html, /:value="relatedMarketCodeText\(\w+, 'OTHER'\)"/);
        assert.doesNotMatch(html, /v-model(?:\.trim)?="\w+\.windCode(?:Sh|Sz|Nib|Bj|Nbc)"/);
        assert.doesNotMatch(html, /windCode(?:Sh|Sz|Nib|Bj|Nbc)\s*:/);
    });
}
