// 运行方式：node --test tests/scheduled_task.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadPage() {
    const html = fs.readFileSync(path.join(__dirname, '../pages/scheduled_task.html'), 'utf8');
    let options;
    const context = vm.createContext({
        Vue: function(config) { options = config; },
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) } },
    });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    return {
        ...options.data(),
        ...options.methods,
        $nextTick: callback => callback(),
        $refs: {},
    };
}

const fullDefaults = { poolIds: [], exportEmptyPool: true, exportPoolWithoutHsName: false, outputDir: null };
const incrementDefaults = { ...fullDefaults, initialStartTime: null };

test('配置弹窗在扩展参数为空时显示全部可编辑的默认值', () => {
    const page = loadPage();
    page.openConfigDialog({
        taskCode: 'hs_pool_full_excel_export',
        paramJson: null,
        paramDefaults: fullDefaults,
    });
    assert.equal(page.configVisible, true);
    assert.deepEqual(JSON.parse(page.configForm.paramJson), fullDefaults);
    page.openConfigDialog({ taskCode: 'hs_pool_increment_excel_export', paramDefaults: incrementDefaults });
    assert.deepEqual(JSON.parse(page.configForm.paramJson), incrementDefaults);
});

test('配置弹窗补齐缺失字段，保留已有参数并保存编辑后的值', async () => {
    const page = loadPage();
    const row = {
        taskCode: 'hs_pool_increment_excel_export',
        paramJson: '{"initialStartTime":"2026-01-01 00:00:00","poolIds":[15],"exportEmptyPool":false}',
        paramDefaults: incrementDefaults,
    };
    page.openConfigDialog(row);
    const params = JSON.parse(page.configForm.paramJson);
    assert.deepEqual(params, {
        ...incrementDefaults, initialStartTime: '2026-01-01 00:00:00', poolIds: [15], exportEmptyPool: false,
    });
    assert.equal(JSON.parse(row.paramJson).exportPoolWithoutHsName, undefined);

    params.exportPoolWithoutHsName = true;
    page.configForm.paramJson = JSON.stringify(params);
    let pendingSave;
    let savedConfig;
    page.$refs.configFormRef = { validate: callback => { pendingSave = callback(true); } };
    page.$message = { success() {} };
    page.apiPost = async (url, body) => {
        assert.equal(url, '/api/v1/scheduledTask/editTask');
        savedConfig = body;
    };
    page.loadTaskList = async () => {};
    page.submitConfig();
    await pendingSave;
    assert.deepEqual(JSON.parse(savedConfig.paramJson), params);
});

test('已保存的开关值和无法解析的原文保持可见', () => {
    const page = loadPage();
    const paramDefaults = { exportPoolWithoutHsName: false };
    for (const paramJson of ['{ "exportPoolWithoutHsName": true }', '{', 'null', '[1]']) {
        page.openConfigDialog({ paramJson, paramDefaults });
        assert.equal(page.configForm.paramJson, paramJson);
    }
    page.openConfigDialog({ paramJson: '' });
    assert.equal(page.configForm.paramJson, '');
});
