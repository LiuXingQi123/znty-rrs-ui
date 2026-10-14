// 无需安装依赖：node --test tests/security_market.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pages = ['security_pool_adjust', 'security_pool_adjust_approve', 'security_pool_adjust_detail',
    'crmw_pool_adjust', 'crmw_pool_adjust_approve', 'crmw_pool_adjust_detail', 'forbidden_pool_adjust'];

const root = path.resolve(__dirname, '..');
const dictionarySource = fs.readFileSync(path.join(root, 'docs/dict.js'), 'utf8');
const exchangeDictionary = vm.runInNewContext('(' + dictionarySource.match(/const DICT_EXCHANGE = (\{[\s\S]*?\});/)[1] + ')');
const marketPages = fs.readdirSync(path.join(root, 'pages')).filter(name => name.endsWith('.html')
    && /\b(?:marketOptions|securityMarketOptions)\s*:/.test(fs.readFileSync(path.join(root, 'pages', name), 'utf8')));

for (const name of marketPages) {
    test(name + ' 通用市场选项与参考字典一致，港交所显示中文', () => {
        let options;
        const context = vm.createContext({
            Vue: function(config) { options = config; },
            window: { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) } },
            moment: () => ({ format: () => '2026-10-13' })
        });
        const html = fs.readFileSync(path.join(root, 'pages', name), 'utf8');
        for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
            if (match[1].trim()) vm.runInContext(match[1], context);
        }
        const page = {};
        Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
        Object.assign(page, options.data.call(page));
        for (const key of ['marketOptions', 'securityMarketOptions']) {
            if (!page[key]) continue;
            assert.equal(page[key].length, 11, key);
            assert.deepEqual(Array.from(page[key], item => item.value), Object.keys(exchangeDictionary), key);
            for (const item of page[key]) assert.equal(item.label, exchangeDictionary[item.value], item.value);
        }
        for (const key of ['marketLabel', 'securityMarketLabel', 'marketName']) {
            if (page[key]) assert.equal(page[key]('HKEX'), '香港交易所', key);
        }
        if (page.marketLabel && page.parseCodeList) {
            assert.equal(page.marketLabel('["SSE","HKEX"]'), '上海证券交易所、香港交易所');
        }
    });
}

for (const name of pages) {
    test(name + ' 按当前市场和只读关联列表完整显示同市场代码', () => {
        let options;
        const context = vm.createContext({ Vue: function(config) { options = config; }, window: {}, moment() {} });
        const html = fs.readFileSync(path.join(__dirname, '../pages/' + name + '.html'), 'utf8');
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
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
