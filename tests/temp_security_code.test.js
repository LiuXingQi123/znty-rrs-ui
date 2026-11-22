const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../pages/temp_security_code.html'), 'utf8');
const issuerListUrl = '/api/v1/tempSecurityCode/queryIssuerOptionList';
const issuer = { companyCode: 'C10001', companyFullName: '示例发行主体', registerNumber: '913100000000000001' };

// 执行页面脚本，记录真实方法发送的请求
function harness() {
    let options;
    vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
        Vue: function Vue(config) {
            options = config;
        },
        moment: () => ({ format: () => '2026-11-18' })
    });
    const requests = [];
    const page = {
        ...options.data(),
        ...options.methods,
        $refs: { addFormRef: { clearValidate() {}, async validate() {} } },
        $nextTick: callback => callback(),
        $message: { success() {} },
        loadList() {},
        async apiPost(url, body) {
            requests.push({ url, body: JSON.parse(JSON.stringify(body)) });
            if (url === issuerListUrl) {
                return [issuer];
            }
            return { securityTypes: [{ securityType: 'government_bond' }] };
        }
    };
    return { page, requests };
}

test('弹窗在单选后显示序号，结果以表格滚动展示', () => {
    const dialog = html.split('<el-dialog title="选择发行主体"')[1].split('</el-dialog>')[0];
    const columns = [...dialog.matchAll(/<el-table-column[^>]*\blabel="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(columns, ['选择', '序号', '主体代码', '主体全称', '社会统一信用代码']);
    assert.match(dialog, /<el-table-column type="index" label="序号"/);
    assert.match(dialog, /<el-table\b[^>]+\bheight="min\(400px, 42vh\)"/);
    assert.doesNotMatch(dialog, /<el-pagination\b/);
});

test('打开、筛选和重置只向主体列表接口发送查询条件', async () => {
    const { page, requests } = harness();
    await page.loadOptions();
    page.openAddDialog();
    assert.equal(requests.length, 1);
    await page.openIssuerDialog();
    assert.equal(page.issuerDialogVisible, true);
    assert.deepEqual(page.issuerRows, [issuer]);
    assert.deepEqual(requests.at(-1), {
        url: issuerListUrl,
        body: { companyCode: '', companyFullName: '', registerNumber: '' }
    });

    const filters = { companyCode: 'C10', companyFullName: '示例', registerNumber: '9131' };
    page.issuerFilters = { ...filters };
    await page.searchIssuers();
    assert.deepEqual(requests.at(-1).body, filters);

    await page.resetIssuerSearch();
    assert.deepEqual(requests.at(-1).body, {
        companyCode: '', companyFullName: '', registerNumber: ''
    });
});

test('暂选和取消保留表单原值，确认回填后提交主体代码', async () => {
    const { page, requests } = harness();
    page.openAddDialog();
    await page.openIssuerDialog();

    page.selectPendingIssuer(issuer);
    assert.equal(page.addForm.tempCompanyCode, '');
    assert.equal(page.issuerRowClassName({ row: issuer }), 'issuer-selected');
    page.confirmIssuer();
    assert.equal(page.issuerDialogVisible, false);
    assert.equal(page.addDialogVisible, true);
    assert.equal(page.companyLabel(page.selectedIssuer), '示例发行主体（C10001）');

    await page.openIssuerDialog();
    assert.equal(page.pendingIssuer, issuer);
    page.selectPendingIssuer({ ...issuer, companyCode: 'C10002' });
    assert.equal(page.issuerRowClassName({ row: issuer }), '');
    page.issuerDialogVisible = false;
    assert.equal(page.addForm.tempCompanyCode, 'C10001');

    await page.submitAdd();
    const submitted = requests.at(-1);
    assert.equal(submitted.url, '/api/v1/tempSecurityCode/addTempSecurityCode');
    assert.equal(submitted.body.tempCompanyCode, 'C10001');
    assert.equal('registerNumber' in submitted.body, false);

    page.openAddDialog();
    await page.openIssuerDialog();
    assert.equal(page.pendingIssuer, null);
    page.selectPendingIssuer(issuer);
    page.confirmIssuer();
    page.clearIssuer();
    assert.equal(page.selectedIssuer, null);
    assert.equal(page.addForm.tempCompanyCode, '');
});

test('连续查询时较早的响应不会覆盖当前结果', async () => {
    const { page } = harness();
    let resolveEarlier;
    page.apiPost = (url, body) => body.companyCode === ''
        ? new Promise(resolve => { resolveEarlier = resolve; })
        : Promise.resolve([issuer]);

    const earlier = page.openIssuerDialog();
    page.issuerFilters.companyCode = issuer.companyCode;
    await page.searchIssuers();
    resolveEarlier([]);
    await earlier;

    assert.deepEqual(page.issuerRows, [issuer]);
    assert.equal(page.issuerLoading, false);
});

test('临时代码删除采用永久删除确认，清空当前页后返回上一页', async () => {
    const { page, requests } = harness();
    assert.deepEqual(Array.from(page.statusFilterOptions, item => item.value), ['temporary', 'updated', 'cancelled']);
    const row = { id: 123, status: 'temporary' };
    page.tableData = [row];
    page.pagination.pageIndex = 2;
    let confirmations = 0;
    let reloads = 0;
    page.$confirm = async message => {
        assert.match(message, /永久删除.*临时主档/);
        confirmations++;
    };
    page.loadList = () => reloads++;

    await page.handleDelete(row);

    assert.deepEqual(requests, [{ url: '/api/v1/tempSecurityCode/deleteTempSecurityCode', body: { id: 123 } }]);
    assert.equal(confirmations, 1);
    assert.equal(page.pagination.pageIndex, 1);
    assert.equal(reloads, 1);
});
