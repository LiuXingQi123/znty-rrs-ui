// 无需安装依赖：node --test tests/bond_print_export.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 执行页面与公共打印代码，替代浏览器打印对话框并保留 afterprint 生命周期。
function harness(fileName) {
    let options;
    const listeners = new Map();
    const document = {
        title: '原页面标题',
        documentElement: { classList: new Set() },
        body: { classList: new Set() }
    };
    for (const element of [document.documentElement, document.body]) {
        element.classList.remove = element.classList.delete.bind(element.classList);
    }
    const window = {
        location: { search: '', hash: '' },
        RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) },
        addEventListener: (name, callback) => listeners.set(name, callback),
        removeEventListener: name => listeners.delete(name),
        setTimeout: callback => callback(),
        print() {}
    };
    window.parent = window;
    const context = vm.createContext({
        Vue: function(config) { options = config; }, window, document, URLSearchParams, moment() {}
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/print_export.js'), 'utf8'), context);
    const html = fs.readFileSync(path.join(__dirname, '../pages', fileName), 'utf8');
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = {
        ...options.data(),
        $nextTick: callback => callback(),
        $set: (object, key, value) => { object[key] = value; }
    };
    Object.entries(options.methods).forEach(([name, method]) => { page[name] = method.bind(page); });
    Object.entries(options.computed || {}).forEach(([name, getter]) => {
        Object.defineProperty(page, name, { get: getter.bind(page) });
    });
    return { page, html, window, document, finishPrint: () => listeners.get('afterprint')() };
}

test('基金审核 PDF 包含审核审批块、当前步骤和完整处理意见', () => {
    const { html } = harness('fund_pool_adjust_approve.html');
    const section = html.match(/<div\b[^>]*class="[^"]*section-audit-approval[^>]*>/);
    assert.ok(section);
    assert.match(section[0], /\bprint-section\b/);
    const content = html.slice(section.index, html.indexOf('<div class="action-footer">', section.index));
    assert.match(content, /v-if="currentPendingStep"/);
    assert.match(content, /当前步骤：\{\{ currentPendingStep.nodeLabel \|\| '' \}\}/);
    assert.match(content, /class="audit-comment-print">\{\{ auditComment \}\}/);
    assert.match(content, /暂无需要当前用户处理的流程步骤/);
});

test('基金审核 PDF 展开审核审批块并恢复状态，保留待办和意见', () => {
    const { page, window, finishPrint } = harness('fund_pool_adjust_approve.html');
    const comment = '第一行意见\n' + '补充审批意见'.repeat(70);
    page.auditComment = comment;
    for (const expanded of [false, true]) {
        for (const steps of [[], [{ id: 1, nodeLabel: '复核', stepStatus: 'pending', handlerId: '1' }]]) {
            page.sectionExpanded.auditApproval = expanded;
            page.flowStepList = steps;
            const pendingStep = page.currentPendingStep;
            const before = JSON.stringify(page.sectionExpanded);
            let printed = false;
            window.print = () => {
                printed = true;
                assert.equal(page.sectionExpanded.auditApproval, true);
                assert.equal(page.currentPendingStep, pendingStep);
                assert.equal(page.auditComment, comment);
            };
            page.handleExportPdf();
            assert.ok(printed);
            finishPrint();
            assert.equal(JSON.stringify(page.sectionExpanded), before);
            assert.equal(page.auditComment, comment);
        }
    }
});

for (const prefix of ['security', 'crmw', 'forbidden', 'fund']) {
    for (const type of ['approve', 'detail']) {
        const fileName = `${prefix}_pool_adjust_${type}.html`;
        test(fileName + ' 导出包含流程状态，并保留原页面显示条件', () => {
            const { page, html, window, finishPrint } = harness(fileName);
            const section = html.match(/<div\b[^>]*class="[^"]*section-flow-status[^>]*>/);
            assert.ok(section, '页面存在流程状态区');
            assert.match(section[0], /\bprint-section\b/, '流程状态区进入公共打印范围');
            if (prefix === 'fund') {
                const flowSection = html.slice(section.index, html.indexOf('</el-table>', section.index));
                assert.match(flowSection, /流程名称：\{\{ activeLog.flowName \}\}/);
                assert.match(flowSection, /暂无流程步骤/);
                for (const label of ['步骤名称', '步骤结果', '开始时间', '处理人', '处理结果', '处理时间', '处理意见']) {
                    assert.ok(flowSection.includes(`label="${label}"`), `保留${label}列`);
                }
                return;
            }
            assert.match(section[0], /v-show="showFlowStatusSection"/, '导出仍服从业务显示条件');
            for (const mode of (type === 'approve' ? ['process', 'next'] : ['view', 'adjust'])) {
                page.entryMode = mode;
                const visible = mode === (type === 'approve' ? 'process' : 'view');
                assert.equal(page.showFlowStatusSection, visible);
                window.print = () => assert.equal(page.showFlowStatusSection, visible);
                page.handleExportPdf();
                assert.equal(page.showFlowStatusSection, visible);
                finishPrint();
                assert.equal(page.showFlowStatusSection, visible);
            }
        });

        test(fileName + ' 导出展开流程步骤，结束或取消后还原折叠状态', () => {
            const { page, window, document, finishPrint } = harness(fileName);
            page.entryMode = type === 'approve' ? 'process' : 'view';
            for (const expanded of [false, true]) {
                for (const steps of [[], [{ id: 1, nodeLabel: '复核', stepStatus: 'pending' }]]) {
                    page.sectionExpanded.flowStatus = expanded;
                    page.flowStepList = steps;
                    const before = JSON.stringify(page.sectionExpanded);
                    let printed = false;
                    window.print = () => {
                        printed = true;
                        assert.equal(page.sectionExpanded.flowStatus, true);
                        assert.equal(page.flowStepList, steps, '保留当前步骤数据或空状态');
                        assert.ok(document.body.classList.has('is-print-export'));
                    };
                    page.handleExportPdf();
                    assert.ok(printed);
                    finishPrint();
                    assert.equal(JSON.stringify(page.sectionExpanded), before);
                    assert.equal(document.title, '原页面标题');
                    assert.equal(document.body.classList.has('is-print-export'), false);
                }
            }
        });
    }
}
