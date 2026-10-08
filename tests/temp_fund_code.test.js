// 无需安装依赖：node --test tests/temp_fund_code.test.js tests/fund_pool_excel_import.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pages/temp_fund_code.html'), 'utf8');

// 执行页面实际脚本，以替身记录请求、确认框和消息。
function harness(userId = '42') {
    let options;
    // 捕获 Vue 配置，直接测试页面真实方法而不挂载 DOM。
    function Vue(config) {
        options = config;
    }
    const context = vm.createContext({
        Vue,
        window: {
            RrsAuth: {
                // 固定登录上下文，验证操作人来自当前用户。
                getCurrentUser() {
                    return { userId, userName: '测试用户' };
                }
            }
        },
        // 日期格式化替身只返回格式字符串，不依赖真实时间。
        moment() {
            return {
                // 记录页面采用的日期格式。
                format(format) {
                    return format;
                }
            };
        }
    });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) {
            vm.runInContext(match[1], context);
        }
    }
    const messages = [];
    const requests = [];
    const confirmations = [];
    const page = {
        ...options.data(),
        $refs: {
            addFormRef: {
                // 默认模拟新增表单校验通过，失败场景由各测试单独覆盖。
                async validate() {
                    return true;
                },
                // 表单重置时允许调用清除校验，无需真实组件状态。
                clearValidate() {
                }
            },
            updateFormRef: {
                // 默认模拟转正式表单校验通过。
                async validate() {
                    return true;
                },
                // 转正式弹窗初始化时允许清除历史校验结果。
                clearValidate() {
                }
            },
            tempFundTableRef: {
                // 提供布局入口，避免方法测试依赖浏览器尺寸。
                doLayout() {
                }
            }
        },
        // 同步执行渲染回调，使表单重置和布局调用可在测试中完成。
        $nextTick(callback) {
            callback();
        },
        $message: {
            // 记录成功反馈供断言。
            success(text) {
                messages.push({ type: 'success', text });
            },
            // 记录错误反馈供断言。
            error(text) {
                messages.push({ type: 'error', text });
            }
        },
        // 默认接受确认并记录弹窗内容，取消场景单独覆盖。
        async $confirm(text, title, settings) {
            confirmations.push({ text, title, settings });
        },
        // 记录真实请求参数，默认返回空分页或空选项。
        async apiPost(url, body) {
            requests.push({ url, body: plain(body) });
            return url.endsWith('Page') ? { records: [], total: 0 } : [];
        }
    };
    for (const [name, method] of Object.entries(options.methods)) {
        page[name] = method.bind(page);
    }
    return { page, messages, requests, confirmations };
}

// 将虚拟机中的对象转成当前上下文对象，以比较真实请求字段。
function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

// 示例临时记录只包含基金四项信息。
function temporaryRow() {
    return {
        id: 7,
        status: 'temporary',
        tempFundCode: 'TMP01.OF',
        tempFundShortName: '临时基金',
        tempMarketCode: 'OTC',
        tempSecurityType: 'open_fund'
    };
}

test('基金四字段、只读正式快照和工作台文档入口完整', () => {
    const { page } = harness();
    const addDialog = html.split('title="新增基金临时代码"')[1].split('</el-dialog>')[0];
    assert.deepEqual([...addDialog.matchAll(/prop="([^"]+)"/g)].map(match => match[1]), [
        'tempFundShortName', 'tempFundCode', 'tempMarketCode', 'tempSecurityType'
    ]);
    assert.match(html, /:value="updateForm.tempFundCode" disabled/);
    assert.match(html, /:value="marketName\(updateForm.marketCode\)" disabled/);
    assert.match(html, /:remote-method="searchFormalFundOptions"/);
    assert.doesNotMatch(html, /tempCompany|tempMitigation|tempIssueDate|tempMaturityDate|el-date-picker/);
    assert.deepEqual(plain(page.marketOptions).map(item => item.value), [
        'SSE', 'SZSE', 'CIBM', 'BSE', 'COMPANY', 'OTC', 'HKEX', 'QDII', 'JWCW', 'UNKNOWN', 'OTHER'
    ]);
    const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(index, /page: 'pages\/temp_fund_code\.html\?v=1'/);
    assert.match(index, /page: 'docs\/temp-fund-code-tables.html'/);
    assert.match(fs.readFileSync(path.join(root, 'docs/module-tables-index.html'), 'utf8'), /href="temp-fund-code-tables.html"/);
});

test('债券与基金页面分别引用独立 CSS，页面作用域互不交叉', () => {
    const securityHtml = fs.readFileSync(path.join(root, 'pages/temp_security_code.html'), 'utf8');
    const fundCss = fs.readFileSync(path.join(root, 'css/temp_fund_code.css'), 'utf8');
    const securityCss = fs.readFileSync(path.join(root, 'css/temp_security_code.css'), 'utf8');
    const catalog = fs.readFileSync(path.join(root, 'docs/page_catalog.md'), 'utf8');
    assert.match(html, /href="\.\.\/css\/temp_fund_code\.css"/);
    assert.doesNotMatch(html, /href="\.\.\/css\/temp_security_code\.css"/);
    assert.match(securityHtml, /href="\.\.\/css\/temp_security_code\.css"/);
    assert.doesNotMatch(securityHtml, /href="\.\.\/css\/temp_fund_code\.css"/);
    assert.match(fundCss, /#temp_fund_code \.row-action-btn\b/);
    assert.match(fundCss, /body\.temp-fund-code-page\b/);
    assert.doesNotMatch(fundCss, /#temp_security_code\b|body\.temp-security-code-page\b/);
    assert.match(securityCss, /#temp_security_code \.row-action-btn\b/);
    assert.match(securityCss, /body\.temp-security-code-page\b/);
    assert.doesNotMatch(securityCss, /#temp_fund_code\b|body\.temp-fund-code-page\b/);
    assert.match(catalog, /`temp_fund_code.html`.*`css\/temp_fund_code.css`/);
    assert.match(catalog, /`temp_security_code.html`.*`css\/temp_security_code.css`/);
});

test('查询传递模糊条件、多选状态来源和分页，失败释放加载状态', async () => {
    const { page, requests, messages } = harness();
    Object.assign(page.queryParam, {
        tempFundCode: 'TMP',
        tempFundShortName: '基金',
        statusList: ['temporary', 'deleted'],
        oprtSourceList: ['manual', 'other']
    });
    page.pagination.pageIndex = 3;
    page.pagination.pageSize = 50;
    await page.loadList();
    assert.equal(requests[0].url, '/api/v1/tempFundCode/queryTempFundCodePage');
    assert.deepEqual(requests[0].body, {
        tempFundCode: 'TMP', tempFundShortName: '基金', statusList: ['temporary', 'deleted'],
        oprtSourceList: ['manual', 'other'], pageIndex: 3, pageSize: 50
    });
    page.apiPost = async () => {
        throw new Error('查询失败');
    };
    await page.loadList();
    assert.equal(page.loading, false);
    assert.deepEqual(messages.at(-1), { type: 'error', text: '查询失败' });
});

test('重置恢复人工来源，搜索和每页条数变化回到第一页', () => {
    const { page } = harness();
    let loads = 0;
    page.loadList = () => {
        loads++;
    };
    page.queryParam.statusList = ['updated'];
    page.queryParam.oprtSourceList = [];
    page.pagination.pageIndex = 5;
    page.handleReset();
    assert.deepEqual(plain(page.queryParam), { tempFundCode: '', tempFundShortName: '', statusList: [], oprtSourceList: ['manual'] });
    assert.equal(page.pagination.pageIndex, 1);
    page.pagination.pageIndex = 4;
    page.handleSearch();
    assert.equal(page.pagination.pageIndex, 1);
    page.handleSizeChange(100);
    assert.equal(page.pagination.pageSize, 100);
    page.handlePageChange(2);
    assert.equal(page.pagination.pageIndex, 2);
    assert.equal(loads, 4);
});

test('产品类型来自基金接口，新增默认值仅包含四字段', async () => {
    const { page, messages } = harness();
    let request;
    page.apiPost = async (url, body) => {
        request = { url, body: plain(body) };
        return { securityTypes: [{ securityType: 'open_fund', securityTypeName: '开放式基金' }] };
    };
    await page.loadOptions();
    assert.equal(request.url, '/api/v1/tempFundCode/queryTempFundCodeOptions');
    assert.deepEqual(request.body, {});
    page.openAddDialog();
    assert.deepEqual(plain(page.addForm), {
        tempFundCode: '', tempFundShortName: '', tempMarketCode: 'SSE', tempSecurityType: 'open_fund'
    });
    assert.equal(page.securityTypeName('open_fund'), '开放式基金');
    assert.equal(page.securityTypeName('open_fund', '后端不同简称'), '开放式基金');
    assert.equal(page.securityTypeName('unknown_type'), 'unknown_type');
    assert.equal(page.securityTypeName('unknown_type', '后端类型名'), '后端类型名');
    assert.equal(page.marketName('HKEX'), '香港交易所');
    assert.equal(page.marketName('unknown_market'), 'unknown_market');
    page.apiPost = async () => {
        throw new Error('字典失败');
    };
    await page.loadOptions();
    assert.equal(messages.at(-1).text, '字典失败');
});

test('新增仅提交四字段和当前用户，成功关闭弹窗并刷新', async () => {
    const { page, requests, messages } = harness('99');
    page.openAddDialog();
    Object.assign(page.addForm, {
        tempFundCode: 'TMP01.OF', tempFundShortName: '临时基金', tempMarketCode: 'OTC',
        tempSecurityType: 'open_fund', fundName: '不能越权传递', status: 'updated'
    });
    await page.submitAdd();
    assert.equal(requests[0].url, '/api/v1/tempFundCode/addTempFundCode');
    assert.deepEqual(requests[0].body, {
        tempFundCode: 'TMP01.OF', tempFundShortName: '临时基金', tempMarketCode: 'OTC',
        tempSecurityType: 'open_fund', operatorId: '99'
    });
    assert.equal(requests[1].url, '/api/v1/tempFundCode/queryTempFundCodePage');
    assert.equal(page.addDialogVisible, false);
    assert.equal(page.submitLoading, false);
    assert.equal(messages[0].text, '新增成功');
});

test('表单校验失败不请求接口，重复新增提交被拦截', async () => {
    const { page, requests } = harness();
    page.openAddDialog();
    page.$refs.addFormRef.validate = async () => {
        throw { tempFundCode: [{ message: '请输入临时基金代码' }] };
    };
    await page.submitAdd();
    assert.equal(requests.length, 0);
    assert.equal(page.addDialogVisible, true);
    assert.equal(page.submitLoading, false);
    let finishValidation;
    page.$refs.addFormRef.validate = () => new Promise(resolve => {
        finishValidation = resolve;
    });
    const first = page.submitAdd();
    await page.submitAdd();
    finishValidation();
    await first;
    assert.equal(requests.filter(request => request.url.endsWith('addTempFundCode')).length, 1);
});

test('新增接口失败保留表单和弹窗，允许修正后重试', async () => {
    const { page, messages } = harness();
    page.openAddDialog();
    page.addForm.tempFundCode = 'TMP01.OF';
    page.apiPost = async () => {
        throw new Error('代码已存在');
    };
    await page.submitAdd();
    assert.equal(page.addDialogVisible, true);
    assert.equal(page.addForm.tempFundCode, 'TMP01.OF');
    assert.equal(page.submitLoading, false);
    assert.equal(messages.at(-1).text, '代码已存在');
});

test('转正式保留临时快照且正式信息初始为空，冻结状态不打开弹窗', () => {
    const { page } = harness();
    page.openUpdateDialog({ ...temporaryRow(), fundCode: 'OLD.OF', fundName: '已有正式快照' });
    assert.equal(page.updateForm.tempFundCode, 'TMP01.OF');
    assert.equal(page.updateForm.tempFundShortName, '临时基金');
    assert.equal(page.updateForm.fundCode, '');
    assert.equal(page.updateForm.fundName, '');
    assert.equal(page.updateForm.marketCode, '');
    assert.equal(page.updateDialogVisible, true);
    page.updateDialogVisible = false;
    page.openUpdateDialog({ ...temporaryRow(), status: 'updated' });
    assert.equal(page.updateDialogVisible, false);
});

test('正式基金搜索使用 fundKeyword，较早响应不能覆盖最新选项', async () => {
    const { page } = harness();
    const pending = [];
    page.apiPost = (url, body) => new Promise(resolve => {
        pending.push({ url, body: plain(body), resolve });
    });
    const first = page.searchFormalFundOptions('旧名称');
    const second = page.searchFormalFundOptions('新名称');
    assert.equal(pending[1].url, '/api/v1/tempFundCode/queryFormalFundOptionList');
    assert.deepEqual(pending[1].body, { fundKeyword: '新名称' });
    pending[1].resolve([{ fundCode: 'NEW.OF', fundShortName: '新基金' }]);
    await second;
    pending[0].resolve([{ fundCode: 'OLD.OF', fundShortName: '旧基金' }]);
    await first;
    assert.equal(page.formalFundOptions[0].fundCode, 'NEW.OF');
    assert.equal(page.formalFundLoading, false);
});

test('正式搜索失败清除候选并释放加载状态，打开新映射使旧搜索失效', async () => {
    const { page, messages } = harness();
    page.formalFundOptions = [{ fundCode: 'OLD.OF' }];
    page.apiPost = async () => {
        throw new Error('搜索失败');
    };
    await page.searchFormalFundOptions('x');
    assert.equal(page.formalFundOptions.length, 0);
    assert.equal(page.formalFundLoading, false);
    assert.equal(messages.at(-1).text, '搜索失败');
    let finishSearch;
    page.apiPost = () => new Promise(resolve => {
        finishSearch = resolve;
    });
    const search = page.searchFormalFundOptions('previous');
    page.openUpdateDialog(temporaryRow());
    finishSearch([{ fundCode: 'OLD.OF' }]);
    await search;
    assert.equal(page.formalFundOptions.length, 0);
    assert.equal(page.formalFundLoading, false);
    const closingSearch = page.searchFormalFundOptions('closing');
    page.updateDialogVisible = false;
    page.handleUpdateDialogClose();
    finishSearch([{ fundCode: 'CLOSED.OF' }]);
    await closingSearch;
    assert.equal(page.formalFundOptions.length, 0);
    assert.equal(page.formalFundLoading, false);
});

test('正式选择带出完整基金快照，清空同步清除只读字段', () => {
    const { page } = harness();
    page.openUpdateDialog(temporaryRow());
    const option = {
        fundCode: '000001.OF', fundName: '正式基金全称', fundShortName: '正式简称',
        marketCode: 'OTC', securityType: 'open_fund', securityTypeName: '开放式基金'
    };
    page.formalFundOptions = [option];
    assert.equal(page.formalFundLabel(option), '正式简称（000001.OF）');
    assert.equal(page.formalFundLabel({ fundName: '只有全称', fundCode: 'X' }), '只有全称（X）');
    page.handleFormalFundChange(option.fundCode);
    for (const key of Object.keys(option)) {
        assert.equal(page.updateForm[key], option[key]);
    }
    assert.equal(page.updateForm.tempFundCode, 'TMP01.OF');
    page.handleFormalFundChange('');
    for (const key of Object.keys(option)) {
        assert.equal(page.updateForm[key], '');
    }
});

test('转正式只提交 id、正式代码、当前用户，不回传临时与快照字段', async () => {
    const { page, requests, messages } = harness('99');
    page.openUpdateDialog(temporaryRow());
    page.updateForm.fundCode = '000001.OF';
    page.updateForm.marketCode = '不能越权提交';
    await page.submitUpdate();
    assert.equal(requests[0].url, '/api/v1/tempFundCode/editTempFundCodeToUpdated');
    assert.deepEqual(requests[0].body, { id: 7, fundCode: '000001.OF', operatorId: '99' });
    assert.equal(page.updateDialogVisible, false);
    assert.equal(page.submitLoading, false);
    assert.equal(messages[0].text, '更新成功');
    page.openUpdateDialog(temporaryRow());
    page.apiPost = async () => {
        throw new Error('在途冲突');
    };
    await page.submitUpdate();
    assert.equal(page.updateDialogVisible, true);
    assert.equal(page.submitLoading, false);
    assert.equal(messages.at(-1).text, '在途冲突');
});

test('仅 temporary 状态允许动作，冻结状态不弹确认也不请求', async () => {
    const { page, confirmations, requests } = harness();
    assert.equal(page.canOperate(temporaryRow()), true);
    assert.equal(page.canDelete(temporaryRow()), true);
    for (const status of ['updated', 'cancelled', 'deleted', 'unknown']) {
        const row = { ...temporaryRow(), status };
        assert.equal(page.canOperate(row), false);
        assert.equal(page.canDelete(row), false);
        await page.handleCancelIssue(row);
        await page.handleDelete(row);
    }
    assert.equal(confirmations.length, 0);
    assert.equal(requests.length, 0);
    assert.equal(page.oprtSourceTagType('manual'), '');
});

test('取消确认说明停用和阻塞影响，确认取消不请求业务接口', async () => {
    const { page, requests, confirmations } = harness('99');
    await page.handleCancelIssue(temporaryRow());
    assert.match(confirmations[0].text, /停用临时基金主档.*不会自动移除.*可能阻塞/);
    assert.equal(requests[0].url, '/api/v1/tempFundCode/editTempFundCodeToCancelled');
    assert.deepEqual(requests[0].body, { id: 7, operatorId: '99' });
    const count = requests.length;
    page.$confirm = async () => {
        throw 'cancel';
    };
    await page.handleCancelIssue(temporaryRow());
    assert.equal(requests.length, count);
    assert.equal(page.actionBusy, false);
});

test('删除确认说明仅删映射且保留主档，拒绝确认不请求', async () => {
    const { page, requests, confirmations } = harness();
    await page.handleDelete(temporaryRow());
    assert.match(confirmations[0].text, /仅删除临时代码映射.*基金占位主档将保留/);
    assert.equal(requests[0].url, '/api/v1/tempFundCode/deleteTempFundCode');
    assert.deepEqual(requests[0].body, { id: 7, operatorId: '42' });
    const count = requests.length;
    page.$confirm = async () => {
        throw 'cancel';
    };
    await page.handleDelete(temporaryRow());
    assert.equal(requests.length, count);
    assert.equal(page.actionBusy, false);
});

test('取消与删除接口失败显示服务端原因而不反馈成功', async () => {
    const { page, messages } = harness();
    page.apiPost = async () => {
        throw new Error('状态已改变');
    };
    await page.handleCancelIssue(temporaryRow());
    await page.handleDelete(temporaryRow());
    assert.equal(messages.length, 2);
    assert.equal(messages.every(item => item.type === 'error' && item.text === '状态已改变'), true);
    assert.equal(page.actionBusy, false);
});

test('取消与删除共用操作锁，确认或请求未完成时不允许重复动作', async () => {
    const { page, requests } = harness();
    let finishConfirmation;
    let finishRequest;
    let confirmationCount = 0;
    page.$confirm = () => new Promise(resolve => {
        confirmationCount++;
        finishConfirmation = resolve;
    });
    page.apiPost = (url, body) => {
        requests.push({ url, body: plain(body) });
        return new Promise(resolve => {
            finishRequest = resolve;
        });
    };
    page.loadList = async () => {
    };
    const first = page.handleCancelIssue(temporaryRow());
    assert.equal(page.actionBusy, true);
    await page.handleCancelIssue(temporaryRow());
    await page.handleDelete(temporaryRow());
    assert.equal(confirmationCount, 1);
    assert.equal(requests.length, 0);
    finishConfirmation();
    await Promise.resolve();
    await page.handleDelete(temporaryRow());
    assert.equal(requests.length, 1);
    assert.equal(page.actionBusy, true);
    finishRequest();
    await first;
    assert.equal(page.actionBusy, false);
});
