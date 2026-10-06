// 无需安装依赖：node --test tests/my_matters.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function harness() {
    let options;
    function Vue(config) { options = config; }
    const window = { location: { pathname: '/pages/my_matters.html', search: '?loginUserId=2&loginUserName=测试' }, localStorage: { getItem() { return null; }, setItem() {} }, addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout };
    const requests = [];
    const context = vm.createContext({ Vue, window, URLSearchParams, FormData, moment: () => ({ format: () => '2026-10-05' }), axios: { defaults: {}, post: async (url, body) => { requests.push({ url, body }); return { data: { success: true, data: [] } }; } } });
    vm.runInContext(fs.readFileSync(path.join(root, 'js/api.js'), 'utf8'), context);
    const html = fs.readFileSync(path.join(root, 'pages/my_matters.html'), 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = { ...options.data(), $message: { error() {}, success() {} }, $refs: {}, $nextTick: f => f() };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.entries(options.computed).forEach(([key, getter]) => { Object.defineProperty(page, key, { get: () => getter.call(page) }); });
    page.businessDomain = 'bond';
    const pending = [];
    page.apiPost = (url, body) => new Promise((resolve, reject) => pending.push({ url, body, resolve, reject }));
    const mount = () => {
        const loadBusinessDomains = page.loadBusinessDomains;
        let initialization;
        page.loadBusinessDomains = () => { initialization = loadBusinessDomains(); return initialization; };
        options.mounted.call(page);
        page.loadBusinessDomains = loadBusinessDomains;
        return initialization;
    };
    return { page, pending, window, requests, prototype: Vue.prototype, mount };
}

test('所有修改页面和公共 API 脚本语法有效', () => {
    for (const name of ['my_matters', ...['security', 'forbidden', 'crmw', 'fund'].flatMap(domain => [`${domain}_pool_adjust`, `${domain}_pool_adjust_approve`, `${domain}_pool_adjust_detail`])]) {
        const html = fs.readFileSync(path.join(root, `pages/${name}.html`), 'utf8');
        for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1], { filename: name });
    }
    new vm.Script(fs.readFileSync(path.join(root, 'js/api.js'), 'utf8'));
});

test('切换业务清空筛选、分页、列表和角标', async () => {
    const { page, pending } = harness();
    page.searchForm.securityCode = 'B1'; page.pagination.pageIndex = 9; page.tableData = [{ id: 1 }]; page.pendingCount = 99;
    page.businessDomain = 'fund';
    const loading = page.handleBusinessChange();
    assert.equal(page.activeTab, 'pending'); assert.equal(page.searchForm.securityCode, ''); assert.equal(page.pagination.pageIndex, 1);
    assert.equal(page.tableData.length, 0); assert.equal(page.pendingCount, 0); assert.equal(page.objectCodeLabel, '基金代码');
    assert.ok(pending.every(request => request.body.businessDomain === 'fund'));
    assert.ok(pending.every(request => !request.url.includes('gradeRuleAlert')));
    pending.forEach(request => request.resolve(request.url.includes('Option') ? [] : { records: [], total: 0 }));
    await loading;
});

test('旧债券响应不能覆盖基金列表或结束基金加载', async () => {
    const { page, pending } = harness();
    const bond = page.loadList();
    page.businessDomain = 'fund'; page.resetBusinessView();
    const fund = page.loadList();
    pending[0].resolve({ records: [{ objectCode: 'B1' }], total: 12 }); await bond;
    assert.equal(page.tableData.length, 0); assert.equal(page.loading, true);
    pending[1].resolve({ records: [{ objectCode: 'F1' }], total: 1 }); await fund;
    assert.equal(page.tableData[0].objectCode, 'F1'); assert.equal(page.pendingCount, 1); assert.equal(page.loading, false);
});

test('债券→基金→债券以及旧错误均不能更新新视图', async () => {
    const { page, pending } = harness();
    const old = page.loadList();
    page.businessDomain = 'fund'; page.resetBusinessView(); page.businessDomain = 'bond'; page.resetBusinessView();
    const latest = page.loadList();
    pending[1].resolve({ records: [{ objectCode: 'LATEST' }], total: 2 }); await latest;
    pending[0].reject(new Error('旧请求失败')); await old;
    assert.equal(page.tableData[0].objectCode, 'LATEST'); assert.equal(page.pagination.total, 2);
});

test('同一视图只有最后一次列表请求可更新', async () => {
    const { page, pending } = harness();
    const first = page.loadList(); const second = page.loadList();
    pending[1].resolve({ records: [{ id: 2 }], total: 2 }); await second;
    pending[0].resolve({ records: [{ id: 1 }], total: 1 }); await first;
    assert.equal(page.tableData[0].id, 2);
});

test('当前列表请求失败清空列表、分页总量和当前角标', async () => {
    const { page, pending } = harness();
    page.pendingCount = 9; page.tableData = [{ id: 1 }]; page.pagination.total = 9;
    const request = page.loadList(); pending[0].reject(new Error('查询失败')); await request;
    assert.equal(page.tableData.length, 0); assert.equal(page.pagination.total, 0); assert.equal(page.pendingCount, 0); assert.equal(page.loading, false);
});

test('旧流程下拉和角标响应被丢弃', async () => {
    const { page, pending } = harness();
    const calls = [page.loadFlowOptions(), page.queryMatterTabTotal('completed'), page.queryInitiatedTabTotal(), page.queryAlertTabTotal()];
    page.businessDomain = 'fund'; page.resetBusinessView();
    pending.forEach(request => request.resolve(request.url.includes('Option') ? [{ flowId: 1 }] : { total: 99 }));
    await Promise.all(calls);
    assert.equal(page.flowOptions.length, 0); assert.equal(page.completedCount, 0); assert.equal(page.initiatedCount, 0); assert.equal(page.alertOpenCount, 0);
});

test('入口初始化未完成或无业务时，返回工作台不查询入口或事项', async () => {
    const { page, pending, window, mount } = harness();
    page.tableData = [{ id: 1 }];
    const initialization = mount();
    assert.equal(page.businessLoading, true); assert.equal(page.businessReady, false);
    await window.RrsPageOnShow();
    await page.loadBusinessDomains();
    assert.equal(pending.length, 1);
    pending[0].resolve([]); await initialization;
    assert.equal(page.businessDomain, ''); assert.equal(page.businessDomains.length, 0); assert.equal(page.tableData.length, 0);
    assert.equal(page.businessReady, true); assert.equal(page.businessLoading, false);
    await window.RrsPageOnShow();
    await page.loadBusinessDomains();
    assert.equal(pending.length, 1);
});

test('入口初始化失败显示空状态，不发事项查询或重复查入口', async () => {
    const { page, pending, window, mount } = harness();
    const initialization = mount();
    pending[0].reject(new Error('入口查询失败')); await initialization;
    assert.equal(page.businessDomain, ''); assert.equal(page.businessDomains.length, 0);
    assert.equal(page.businessReady, true); assert.equal(page.businessLoading, false);
    await window.RrsPageOnShow();
    await page.loadBusinessDomains();
    assert.equal(pending.length, 1);
});

test('初始化一次入口，返回、切换、查询和翻页只刷新业务数据', async () => {
    const { page, window, mount } = harness();
    page.businessDomain = '';
    const requests = [];
    page.apiPost = async (url, body) => {
        requests.push({ url, body });
        if (url.endsWith('/queryBusinessDomainList')) return [{ businessDomain: 'bond' }, { businessDomain: 'fund' }];
        if (url.endsWith('/queryFlowOptionList')) return [];
        return { records: [], total: 0 };
    };
    await mount();
    assert.equal(page.businessDomain, 'bond'); assert.equal(page.businessReady, true); assert.equal(page.businessLoading, false);
    await page.loadBusinessDomains();
    page.searchForm.securityCode = 'B1'; page.pagination.pageIndex = 3;
    const revision = page.viewRevision;
    const returnedAt = requests.length;
    await window.RrsPageOnShow();
    assert.equal(page.viewRevision, revision + 1); assert.equal(page.searchForm.securityCode, 'B1'); assert.equal(page.pagination.pageIndex, 3);
    const returned = requests.slice(returnedAt);
    assert.ok(returned.some(item => item.url.endsWith('/queryFlowOptionList')));
    assert.ok(returned.some(item => item.body.pageSize === 1));
    assert.ok(returned.every(item => item.url.includes('/gradeRuleAlert/') || item.body.businessDomain === 'bond'));
    page.businessDomain = 'fund'; await page.handleBusinessChange();
    page.handleSearch(); page.activeTab = 'completed'; page.handleTabClick(); page.handleReset(); page.handlePageChange(2); page.handleSizeChange(10);
    await Promise.resolve();
    assert.equal(requests.filter(item => item.url.endsWith('/queryBusinessDomainList')).length, 1);
});

test('刷新 iframe 创建新实例，重新查询一次最新入口', async () => {
    for (const domain of ['fund', 'bond']) {
        const { page, mount } = harness();
        page.businessDomain = '';
        const requests = [];
        page.apiPost = async (url, body) => {
            requests.push({ url, body });
            if (url.endsWith('/queryBusinessDomainList')) return [{ businessDomain: domain }];
            if (url.endsWith('/queryFlowOptionList')) return [];
            return { records: [], total: 0 };
        };
        await mount();
        assert.equal(page.businessDomain, domain);
        assert.equal(requests.filter(item => item.url.endsWith('/queryBusinessDomainList')).length, 1);
    }
});

test('返回工作台增加视图版本，旧列表响应不能覆盖刷新后的数据', async () => {
    const { page, pending, window, mount } = harness();
    page.businessReady = true; page.businessDomains = [{ businessDomain: 'bond' }];
    await mount();
    const old = page.loadList();
    const revision = page.viewRevision;
    const refreshed = window.RrsPageOnShow();
    assert.equal(page.viewRevision, revision + 1);
    assert.ok(pending.every(item => !item.url.endsWith('/queryBusinessDomainList')));
    pending.slice(1).forEach(item => item.resolve(item.url.endsWith('/queryFlowOptionList') ? [] : { records: [{ objectCode: 'LATEST' }], total: 2 }));
    await refreshed;
    pending[0].resolve({ records: [{ objectCode: 'OLD' }], total: 99 }); await old;
    assert.equal(page.tableData[0].objectCode, 'LATEST'); assert.equal(page.pagination.total, 2); assert.equal(page.pendingCount, 2);
});

test('场景路由使用独立页面，页签键包含业务代码，相同 ID 不混用', () => {
    const { page, window } = harness();
    const tabs = [];
    window.RrsWorkbench = { buildTabIndex: (prefix, parts) => prefix + ':' + parts.join(':'), formatDetailTitle: () => '详情', openDetailTab: tab => { tabs.push(tab); return true; } };
    for (const [domain, scene, target] of [['bond', 'securityAdjust', 'security'], ['bond', 'forbiddenCompanyAdjust', 'forbidden'], ['bond', 'crmwAdjust', 'crmw'], ['fund', 'fundAdjust', 'fund']]) {
        page.businessDomain = domain;
        page.openMatterPage({ businessDomain: domain, businessScene: scene, objectCode: 'CODE', objectName: '名称', adjustLogId: 1 });
        assert.equal(tabs.at(-1).page, `${target}_pool_adjust_approve.html`); assert.ok(tabs.at(-1).index.includes(domain));
        page.activeTab = 'completed';
        page.openMatterPage({ businessDomain: domain, businessScene: scene, objectCode: 'CODE', adjustLogId: 1 });
        assert.equal(tabs.at(-1).page, `${target}_pool_adjust_detail.html`); page.activeTab = 'pending';
    }
    const count = tabs.length;
    page.openMatterPage({ businessDomain: 'bond', businessScene: 'fundAdjust', adjustLogId: 1 });
    assert.equal(tabs.length, count);
});

test('公共 API 原样发送参数，不补用户身份、业务或 URL 定位信息', async () => {
    const { page, prototype, window, requests } = harness();
    window.location.pathname = '/pages/fund_pool_adjust_detail.html'; window.location.search += '&adjustLogId=7&adjustBatchNo=FUND7';
    const attachments = { businessDomain: 'bond', adjustLogIds: [7] };
    await prototype.apiPost.call(page, '/api/v1/attachments/queryAttachmentList', attachments);
    assert.equal(requests[0].body, attachments);
    assert.equal(requests[0].body.currentUserId, undefined); assert.equal(requests[0].body.businessDomain, 'bond');
    await prototype.apiPost.call(page, '/api/v1/fundPoolAdjust/queryFundDetail', { fundCode: 'F1' });
    assert.equal(requests[1].body.adjustLogId, undefined); assert.equal(requests[1].body.adjustBatchNo, undefined);
    const user = { currentUserId: '9' };
    await prototype.apiPost.call(page, '/api/v1/myMatters/queryBusinessDomainList', user);
    assert.equal(requests[2].body, user);
    await prototype.apiPost.call(page, '/api/v1/gradeRuleAlert/queryAlertPage', {});
    assert.equal(requests[3].body.currentUserId, undefined);
    await prototype.apiPost.call(page, '/api/v1/attachments/downloadAttachment', { id: 7 });
    assert.equal(requests[4].body.businessDomain, undefined);
    const upload = new FormData();
    upload.append('adjusterId', '9');
    await prototype.apiPost.call(page, '/api/v1/securityPoolAdjust/addAdjustLog', upload);
    assert.equal(requests[5].body, upload);
});

test('事项和提醒页面显式提供当前用户，无需公共 API 补参', async () => {
    const { page } = harness();
    const requests = [];
    page.apiPost = async (url, body) => {
        requests.push({ url, body });
        if (url.endsWith('/queryBusinessDomainList')) return [{ businessDomain: 'bond' }];
        if (url.endsWith('/queryFlowOptionList')) return [];
        return { records: [], total: 0 };
    };
    await page.loadBusinessDomains();
    await page.loadAlertList();
    assert.ok(requests.some(item => item.url.endsWith('/queryBusinessDomainList')));
    assert.ok(requests.some(item => item.url.endsWith('/queryFlowOptionList')));
    assert.ok(requests.some(item => item.url.endsWith('/queryMyMattersPage')));
    assert.ok(requests.some(item => item.url.endsWith('/queryMyInitiatedMattersPage')));
    assert.ok(requests.some(item => item.url.endsWith('/queryAlertPage')));
    assert.ok(requests.every(item => item.body.currentUserId === '2'));
});

test('所有附件列表页面显式传业务，债券和基金相同日志 ID 不串业务', async () => {
    for (const prefix of ['security', 'forbidden', 'crmw', 'fund']) {
        for (const mode of prefix === 'fund' ? ['_approve', '_detail'] : ['', '_approve', '_detail']) {
            let options;
            function Vue(config) { options = config; }
            const context = vm.createContext({ Vue, window: {}, URLSearchParams, document: { addEventListener() {} } });
            const name = `${prefix}_pool_adjust${mode}`;
            const html = fs.readFileSync(path.join(root, `pages/${name}.html`), 'utf8');
            for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
                if (match[1].trim()) vm.runInContext(match[1], context);
            }
            const requests = [];
            const page = {
                adjustLogId: 7, adjustBatchNo: 'batch7',
                $set(row, key, value) { row[key] = value; },
                async apiPost(url, body) {
                    requests.push({ url, body });
                    if (url.endsWith('/queryAdjustLogList')) return [{ id: 7, adjustBatchNo: 'batch7' }];
                    return [];
                }
            };
            if (prefix === 'fund') {
                await options.methods.loadDetail.call(page, 'F1');
                assert.equal(page.pageError, undefined, name);
            } else {
                await options.methods.loadLogAttachments.call(page, [{ id: 7 }, { id: 7 }, { id: 8 }, null]);
            }
            const request = requests.find(item => item.url.endsWith('/queryAttachmentList'));
            assert.ok(request, name);
            assert.equal(request.body.businessDomain, prefix === 'fund' ? 'fund' : 'bond', name);
            assert.deepEqual(Array.from(request.body.adjustLogIds), prefix === 'fund' ? [7] : [7, 8], name);
        }
    }
});

test('审核页优先展示本人待办，仅原演示管理员可展示其他人待办', () => {
    for (const prefix of ['security', 'forbidden', 'crmw', 'fund']) {
        let options;
        function Vue(config) { options = config; }
        const context = vm.createContext({ Vue, window: {}, URLSearchParams, document: { addEventListener() {} } });
        const html = fs.readFileSync(path.join(root, `pages/${prefix}_pool_adjust_approve.html`), 'utf8');
        for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
            if (match[1].trim()) vm.runInContext(match[1], context);
        }
        const first = { stepStatus: 'pending', handlerId: '9' };
        const own = { stepStatus: 'pending', handlerId: '2' };
        const page = { flowStepList: [first, own], loginUser: { userId: '2' }, currentLoginUserId: '2' };
        page.isCurrentHandler = options.methods.isCurrentHandler.bind(page);
        page.isAdminUser = options.methods.isAdminUser.bind(page);
        assert.equal(options.computed.currentPendingStep.call(page), own);
        page.flowStepList = [first];
        assert.equal(options.computed.currentPendingStep.call(page), null);
        for (const userId of ['1', '10000', '10001', '10100']) {
            page.currentLoginUserId = userId;
            page.loginUser.userId = userId;
            assert.equal(page.isAdminUser(), true);
            assert.equal(options.computed.currentPendingStep.call(page), first);
            const adminOwn = { stepStatus: 'pending', handlerId: userId };
            page.flowStepList = [first, adminOwn];
            assert.equal(options.computed.currentPendingStep.call(page), adminOwn);
            page.flowStepList = [first];
        }
        for (const userId of ['2', '9999', '10101', '10000.5', 'abc', '', null]) {
            page.currentLoginUserId = userId;
            page.loginUser.userId = userId;
            assert.equal(page.isAdminUser(), false);
            assert.equal(options.computed.currentPendingStep.call(page), null);
        }
        page.currentLoginUserId = '1';
        page.flowStepList = [{ stepStatus: 'approved', handlerId: '2' }];
        assert.equal(options.computed.currentPendingStep.call(page), null);
        page.flowStepList = null;
        assert.equal(options.computed.currentPendingStep.call(page), null);
    }
});

test('详情和审核页不再读取或维护重复业务授权', () => {
    for (const prefix of ['security', 'forbidden', 'crmw', 'fund']) {
        for (const mode of ['approve', 'detail']) {
            const html = fs.readFileSync(path.join(root, `pages/${prefix}_pool_adjust_${mode}.html`), 'utf8');
            assert.doesNotMatch(html, /canManageBusiness|RrsBusiness|queryBusinessDomainList/);
        }
    }
});
