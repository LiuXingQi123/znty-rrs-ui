// 无需安装依赖：node --test tests/bond_features.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pages = [
    ['security_pool_adjust', 'searchForm', 'loadList', 'handleReset'],
    ['crmw_pool_adjust', 'searchForm', 'loadList', 'handleReset'],
    ['forbidden_pool_adjust', 'absSearchForm', 'absLoadList', 'absHandleReset'],
    ['security_pool_query', 'searchForm', 'loadList', 'handleReset'],
    ['security_pool_adjust_history', 'searchForm', 'loadList', 'handleReset'],
    ['batch_security_pool_adjust', 'securitySearchForm', 'loadSecurityList', 'handleSecurityReset'],
    ['stock_security_batch_adjust', 'securitySearchForm', 'loadSecurityList', 'handleSecurityReset'],
    ['batch_crmw_pool_adjust', 'securitySearchForm', 'loadSecurityList', 'handleSecurityReset']
];

// 直接执行各页面脚本与查询方法，替代浏览器布局和后端响应。
function harness(name) {
    const html = fs.readFileSync(path.join(__dirname, '../pages', name + '.html'), 'utf8');
    let options;
    const context = vm.createContext({
        Vue: function(config) { options = config; },
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) }, location: { search: '' } },
        URLSearchParams, moment: () => ({ format: () => '' })
    });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context, { filename: name });
    }
    const page = { ...options.data(), $refs: {}, $nextTick: () => {}, $message: { warning() {} } };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    page.currentPool = { id: 2 };
    page.direction = 'out';
    const requests = [];
    page.apiPost = async (url, body) => {
        requests.push({ url, body });
        return { records: [], total: 0 };
    };
    return { html, context, page, requests };
}

for (const [name, form, load, reset] of pages) {
    test(name + ' 标准信用债选项传递、与已有特征组合及重置', async () => {
        const { page, requests } = harness(name);
        const option = page.bondYesFlagOptions.find(item => item.value === 'stdCredit');
        assert.equal(option.label, '是否标准信用债');
        page[form].bondYesFlags = ['stdCredit', 'guarant'];
        await page[load]();
        assert.ok(requests.length > 0);
        assert.deepEqual(Array.from(requests[0].body.bondYesFlags), ['stdCredit', 'guarant']);
        requests.length = 0;
        page[reset]();
        assert.equal(page[form].bondYesFlags.length, 0);
        assert.ok(requests.length > 0);
        assert.ok(requests[0].body.bondYesFlags == null || requests[0].body.bondYesFlags.length === 0);
    });

    test(name + ' 标准信用债列与含权标识使用相同布尔转换及展示规则', () => {
        const { html, context, page } = harness(name);
        const column = html.match(/<el-table-column label="是否标准信用债"[\s\S]*?<\/el-table-column>/);
        assert.ok(column);
        const label = column[0].match(/\{\{\s*(.*?)\s*\}\}/)[1];
        const type = column[0].match(/:type="([^"]+)"/)[1];
        const inrightColumn = html.match(/<el-table-column label="是否含权"[\s\S]*?<\/el-table-column>/)[0];
        const inrightLabel = inrightColumn.match(/\{\{\s*(.*?)\s*\}\}/)[1];
        const inrightType = inrightColumn.match(/:type="([^"]+)"/)[1];
        context.yesNoLabel = page.yesNoLabel;
        context.yesNoTagType = page.yesNoTagType;
        context.isYesFlag = page.isYesFlag;
        for (const [value, expected, color] of [[1, '是', 'success'], ['1', '是', 'success'], [true, '是', 'success'],
            [0, '否', 'info'], ['0', '否', 'info'], [false, '否', 'info'], [null, '否', 'info'], [undefined, '否', 'info']]) {
            context.row = { stdCreditFlag: value, inrightFlag: value, yxFlag: 1, guarantFlag: 1, stdClauseFlag: 0 };
            assert.equal(vm.runInContext(label, context), expected);
            assert.equal(vm.runInContext(type, context), color);
            assert.equal(vm.runInContext(label, context), vm.runInContext(inrightLabel, context));
            assert.equal(vm.runInContext(type, context), vm.runInContext(inrightType, context));
        }
    });
}

test('CRMW 批量调入和调出均向对应候选接口发送标准信用债筛选', async () => {
    const { page, requests } = harness('batch_crmw_pool_adjust');
    page.securitySearchForm.bondYesFlags = ['stdCredit'];
    for (const [direction, endpoint] of [['in', 'queryInboundCandidatePage'], ['out', 'queryOutboundCandidatePage']]) {
        page.direction = direction;
        await page.loadSecurityList();
        const request = requests.at(-1);
        assert.ok(request.url.endsWith('/' + endpoint));
        assert.deepEqual(Array.from(request.body.bondYesFlags), ['stdCredit']);
    }
});
