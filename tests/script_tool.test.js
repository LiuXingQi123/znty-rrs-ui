// 无需安装依赖：node --test tests/script_tool.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 加载页面实际逻辑，以模拟接口验证分类、配对和执行行为。
function harness() {
    let options;
    const html = fs.readFileSync(path.join(__dirname, '../docs/script_tool.html'), 'utf8');
    const context = vm.createContext({
        Vue: function(config) { options = config; },
        RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) },
    });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = { ...options.data(), $set: (object, key, value) => { object[key] = value; } };
    Object.entries(options.methods).forEach(([name, method]) => { page[name] = method.bind(page); });
    Object.entries(options.computed).forEach(([name, getter]) => {
        Object.defineProperty(page, name, { get: () => getter.call(page) });
    });
    page.$message = { success() {}, error() {}, warning() {} };
    const codes = ['RESET_ALL', 'INIT_SCHEMA', 'INIT_DEMO', 'INIT_EXTERNAL_IMPORT_SCHEMA', 'INIT_EXTERNAL_IMPORT_DEMO',
        'INIT_FUND_SCHEMA', 'INIT_FUND_DEMO', 'INIT_STOCK_SCHEMA', 'INIT_STOCK_DEMO', 'CLEAR_STOCK_ADJUST_FLOW',
        'INIT_AIS_SCHEMA', 'INIT_AIS_DEMO', 'CLEAR_ADJUST_FLOW', 'INIT_BOND_SCHEMA', 'INIT_BOND_DEMO',
        'INIT_ALL_SCHEMA', 'INIT_ALL_DEMO'];
    // 故意打乱接口顺序，页面仍须按对应模块配对。
    page.tasks = codes.reverse().map(taskCode => ({ taskCode, confirmText: taskCode }));
    return page;
}

for (const [tab, groups] of Object.entries({
    bond: ['bond', 'common', 'external', 'ais', 'maintenance'],
    fund: ['fund'], stock: ['stock', 'stock-maintenance'],
    all: ['all', 'bond', 'common', 'external', 'fund', 'stock', 'ais', 'maintenance', 'stock-maintenance'],
})) {
    test(tab + ' 分类只展示对应模块，建表和 Demo 按行配对', () => {
        const page = harness();
        page.activeTab = tab;
        assert.deepEqual(Array.from(page.visibleTaskGroups, group => group.code), groups);
        for (const group of page.visibleTaskGroups.filter(group => !group.maintenance)) {
            assert.equal(group.tasks.length, 2);
            const [schema, demo] = group.tasks;
            assert.match(schema.taskCode, /_SCHEMA$/);
            assert.equal(demo.taskCode, schema.taskCode.replace(/_SCHEMA$/, '_DEMO'));
        }
    });
}

test('全部分类保留所有现有任务，切换分类不丢失执行结果', () => {
    const page = harness();
    page.activeTab = 'all';
    const shown = page.visibleTaskGroups.flatMap(group => Array.from(group.tasks, task => task.taskCode));
    assert.equal(new Set(shown).size, page.tasks.length);
    page.resultMap.INIT_FUND_DEMO = { status: 'success' };
    page.activeTab = 'fund';
    page.activeTab = 'stock';
    assert.equal(page.resultMap.INIT_FUND_DEMO.status, 'success');
});

test('工具禁用或取消确认时，不调用执行接口', async () => {
    const page = harness();
    let calls = 0;
    page.apiPost = async () => { calls++; };
    page.scriptToolEnabled = false;
    await page.confirmAndExecute(page.tasks[0]);
    assert.equal(calls, 0);
    page.scriptToolEnabled = true;
    page.$prompt = async () => { throw new Error('cancel'); };
    await page.confirmAndExecute(page.tasks[0]);
    assert.equal(calls, 0);
    page.$prompt = async () => ({ value: 'WRONG' });
    await page.confirmAndExecute(page.tasks[0]);
    assert.equal(calls, 0);
});

test('执行对应任务时携带确认文本和操作人，失败后释放按钮状态', async () => {
    const page = harness();
    const task = page.tasks.find(task => task.taskCode === 'INIT_ALL_DEMO');
    page.$prompt = async () => ({ value: task.confirmText });
    page.apiPost = async (url, body) => {
        assert.equal(url, '/api/v1/scriptTool/executeScriptTask');
        assert.equal(body.taskCode, task.taskCode);
        assert.equal(body.confirmText, task.confirmText);
        assert.equal(body.currentUserId, '1');
        assert.equal(page.runningTaskCode, task.taskCode);
        return { status: 'success' };
    };
    await page.confirmAndExecute(task);
    assert.equal(page.resultMap[task.taskCode].status, 'success');
    assert.equal(page.runningTaskCode, '');
    page.apiPost = async () => { throw new Error('network'); };
    await assert.rejects(page.executeTask(task), /network/);
    assert.equal(page.runningTaskCode, '');
});
