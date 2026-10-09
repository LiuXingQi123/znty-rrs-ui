// 无需安装依赖：node --test tests/stock_pool.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

// 执行页面实际 Vue 方法，模拟 API 和工作台边界。
function harness(name) {
    let options;
    function Vue(config) { options = config; }
    const tabs = [], messages = [], requests = [];
    const window = {
        location: { search: '?stockCode=600001.SH&adjustLogId=7&adjustBatchNo=STOCK7&targetPoolId=50' },
        RrsAuth: { getCurrentUser: () => ({ userId: '2', userName: '研究员' }), appendUserParams() {} },
        RrsWorkbench: {
            resolveAdjustLogId: (row, history) => row.adjustLogId || (history ? row.id : null),
            buildTabIndex: (prefix, parts) => prefix + ':' + parts.join(':'),
            formatDetailTitle: (name, code) => name + ' ' + code,
            openDetailTab: tab => { tabs.push(tab); return true; }, closeActiveTab: () => true,
        },
        RrsPrintExport: { unbind() {} }, addEventListener() {}, removeEventListener() {},
        setTimeout, clearTimeout,
    };
    const html = fs.readFileSync(path.join(root, `pages/${name}.html`), 'utf8');
    const context = vm.createContext({ Vue, window, URLSearchParams, FormData, Blob, URL, Uint8Array,
        moment: () => ({ format: () => '2026-10-08' }), document: { addEventListener() {} } });
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context, { filename: name });
    }
    const page = { ...options.data(), $refs: {}, $nextTick: callback => callback(),
        $set: (row, key, value) => { row[key] = value; },
        $message: { success: value => messages.push(value), warning: value => messages.push(value), error: value => messages.push(value) },
        $confirm: async () => true,
        apiPost: async (url, body) => { requests.push({ url, body }); return {}; },
        downloadBase64File() {},
    };
    Object.entries(options.methods || {}).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.entries(options.computed || {}).forEach(([key, getter]) => { Object.defineProperty(page, key, { get: () => getter.call(page) }); });
    return { page, tabs, html, requests, messages, options, window };
}

test('股票基础数值和评级正确显示空值、零、百分比及市场', () => {
    for (const name of ['stock_pool_adjust', 'stock_pool_adjust_approve', 'stock_pool_adjust_detail']) {
        const { page, html } = harness(name);
        assert.equal(page.emptyNumber(0), 0); assert.equal(page.emptyNumber(null), '');
        assert.equal(page.formatPercent(0), '0%'); assert.equal(page.formatPercent(1.25), '1.25%');
        assert.equal(page.formatPercent(null), ''); assert.equal(page.marketLabel('HKEX'), '香港交易所');
        assert.equal(page.ratingLabel('buy'), '买入'); assert.equal(page.ratingLabel(null), '');
        for (const label of ['股票简称', '股票代码', '所属行业', '市场', '昨收', '最高', '最低', '平均', '换手率', '交易总量(手)', '交易市值(万)', '总股本(百万)', '总市值(百万)', '流通A股(百万)', 'A股市值(百万)']) {
            assert.ok(html.includes(`label="${label}"`), name + ' ' + label);
        }
        assert.doesNotMatch(html, /stockScore|stockInvestmentType|needRiskLeaderApproval|latestNav|stockAdministrator/);
    }
});

test('股票查询列表和导出使用相同全部筛选条件，导出不传分页', async () => {
    const { page, requests } = harness('stock_pool_query');
    page.searchForm = { poolIds: [50, 51], stockCode: '600001', entryTimeRange: ['2026-10-01', '2026-10-08'], adjusterName: '研究员', myManagedStocks: true, myStocks: true, currentUserId: '2' };
    page.apiPost = async (url, body) => { requests.push({ url, body }); return url.includes('/export') ? { contentBase64: '', fileName: '股票.xlsx', contentType: 'application/octet-stream' } : { records: [], total: 0 }; };
    await page.loadList(); await page.handleExport();
    const [list, exported] = requests;
    assert.equal(list.url, '/api/v1/stockPoolQuery/queryStockPoolPage');
    assert.equal(exported.url, '/api/v1/stockPoolQuery/exportStockPoolExcel');
    assert.deepEqual(JSON.parse(JSON.stringify(exported.body)), { poolIds: [50, 51], stockCode: '600001', entryTimeStart: '2026-10-01', entryTimeEnd: '2026-10-08', adjusterName: '研究员', myManagedStocks: true, myStocks: true, currentUserId: '2' });
    assert.equal(exported.body.pageIndex, undefined); assert.equal(list.body.pageIndex, 1);
});

test('历史行业和全部筛选条件发送到分页与导出，行业选项来自接口', async () => {
    const { page, requests } = harness('stock_pool_adjust_history');
    page.searchForm = { poolIds: [50], stockCode: '000001', industryCode: 'A02', adjustTimeRange: ['2026-10-01', '2026-10-08'], adjusterName: '张', adjustMode: '调入', auditStatus: '11' };
    page.apiPost = async (url, body) => { requests.push({ url, body }); if (url.endsWith('/queryIndustryList')) return [{ industryCode: 'A02', industryName: '林业' }]; return { records: [], total: 0, contentBase64: '', fileName: '历史.xlsx' }; };
    await page.loadIndustries(); await page.loadList(); await page.handleExport();
    assert.equal(page.industryOptions[0].industryName, '林业');
    assert.equal(requests[1].body.industryCode, 'A02'); assert.equal(requests[2].body.industryCode, 'A02');
    assert.equal(requests[1].body.auditStatus, '11'); assert.equal(requests[2].body.pageIndex, undefined);
    assert.equal(requests[2].body.adjustTimeEnd, '2026-10-08');
});

test('股票分页列表只接受最后一次请求响应', async () => {
    for (const name of ['stock_pool_query', 'stock_pool_adjust_history']) {
        const { page } = harness(name); const pending = [];
        page.apiPost = () => new Promise(resolve => pending.push(resolve));
        const first = page.loadList(); const second = page.loadList();
        pending[1]({ records: [{ stockCode: 'NEW' }], total: 1 }); await second;
        pending[0]({ records: [{ stockCode: 'OLD' }], total: 9 }); await first;
        assert.equal(page.tableData[0].stockCode, 'NEW'); assert.equal(page.pagination.total, 1); assert.equal(page.loading, false);
    }
});

test('查询用来源日志而不是池状态主键，历史携带日志批次和池，页签业务键一致', () => {
    const query = harness('stock_pool_query'), history = harness('stock_pool_adjust_history');
    const row = { id: 999, adjustLogId: 7, stockCode: '600001.SH', stockName: '股票一', adjustBatchNo: 'STOCK7', targetPoolId: 50 };
    query.page.openStockAdjustDetail(row); history.page.openStockAdjustDetail(row);
    for (const item of [query.tabs[0], history.tabs[0]]) {
        const params = new URLSearchParams(item.query);
        assert.equal(item.page, 'stock_pool_adjust_detail.html'); assert.equal(params.get('adjustLogId'), '7');
        assert.equal(params.get('stockCode'), '600001.SH'); assert.equal(params.get('adjustBatchNo'), 'STOCK7'); assert.equal(params.get('targetPoolId'), '50');
        assert.match(item.index, /^stock-detail:/);
    }
    assert.equal(query.tabs[0].index, history.tabs[0].index);
    query.page.openStockAdjustDetail({ id: 999, stockCode: 'NOLOG' });
    assert.equal(new URLSearchParams(query.tabs[1].query).get('adjustLogId'), null);
});

test('自选添加防重复、同步同代码多池，移除确认且传当前用户', async () => {
    const { page, requests } = harness('stock_pool_query');
    const rows = [{ stockCode: 'A' }, { stockCode: 'A' }, { stockCode: 'B' }]; page.tableData = rows;
    page.apiPost = async (url, body) => { requests.push({ url, body }); return { id: 123 }; };
    await page.toggleFavorite(rows[0]);
    assert.equal(rows[0].myStockPoolId, 123); assert.equal(rows[1].myStockPoolId, 123); assert.equal(rows[2].myStockPoolId, undefined);
    let confirmed = false; page.$confirm = async () => { confirmed = true; };
    await page.toggleFavorite(rows[1]);
    assert.equal(confirmed, true); assert.equal(rows[0].myStockPoolId, null);
    assert.equal(requests[0].body.currentUserId, '2'); assert.equal(requests[1].url, '/api/v1/stockPoolQuery/deleteStockFromMyPool');
    page.$confirm = async () => { throw 'cancel'; }; rows[0].myStockPoolId = 123;
    await page.toggleFavorite(rows[0]); assert.equal(requests.length, 2); assert.equal(rows[0].myStockPoolId, 123);
});

test('股票校验默认一般流程，支持快速选择并保留本人、报告与材料', async () => {
    const { page, requests } = harness('stock_pool_adjust');
    page.stockDetail = { stockCode: '600001.SH' }; page.selectedInPools = [{ id: 50, poolName: '股票池' }];
    page.apiPost = async (url, body) => { requests.push({ url, body }); return { items: [{ targetPoolId: 50, poolName: '股票池', adjustMode: '调入', itemTag: 'manual', canAdjust: true,
        flowOptions: [{ flowType: 'fastInbound', flowId: 2, flowKey: 'fast', selectable: true }, { flowType: 'normalInbound', flowId: 1, flowKey: 'normal', selectable: true, recommended: true }] }] }; };
    await page.goToStep2(); const row = page.adjustReviewList[0];
    assert.equal(requests[0].body.currentUserId, '2'); assert.equal(row.flowType, 'normalInbound'); assert.equal(page.adjustStep, 2);
    row.selectedFlowKey = row.flowOptions[0].optionKey; page.handleRowFlowChange(row);
    assert.equal(row.flowType, 'fastInbound'); assert.equal(row.flowKey, 'fast'); assert.equal(page.flowTypeLabel(row.flowType), '快速调入');
    page.handleSubmit(); assert.equal(page.flowDialogVisible, true);
});

test('股票提交保留整组和附件索引，不要求基金特有字段', () => {
    const { page } = harness('stock_pool_adjust'); const file = new Blob(['报告']);
    page.stockDetail = { stockCode: 'A' }; page.submitForm = { adjustReason: '原因', adjustAdvice: '' };
    page.adjustReviewList = [{ canAdjust: true, targetPoolId: 50, poolName: '池', itemTag: 'manual', adjustMode: '调入', flowType: 'fastInbound', flowId: 1, flowKey: 'fast', adjustGroupKey: 'group',
        attachmentFiles: [{ raw: file, name: '报告.pdf' }], materialFiles: [], creditReports: [{ attachments: [{ id: 9 }, { id: 9 }] }], otherMaterials: [] }];
    const result = page.buildSubmitPayloadAndFiles();
    assert.equal(result.payload.stockCode, 'A'); assert.equal(result.payload.adjusterId, '2'); assert.equal(result.payload.stockScore, undefined);
    assert.equal(result.payload.items[0].flowType, 'fastInbound'); assert.equal(result.files[0], file);
    assert.deepEqual(Array.from(result.payload.items[0].reportFileIndexes), [0]); assert.deepEqual(Array.from(result.payload.items[0].reportSourceAttachmentIds), [9]);
});

test('股票详情显式按stock读取附件，保留池上下文与实时基础信息', async () => {
    for (const name of ['stock_pool_adjust_detail', 'stock_pool_adjust_approve']) {
        const { page, requests } = harness(name);
        page.adjustLogId = 7; page.adjustBatchNo = 'STOCK7'; page.targetPoolId = 50;
        page.apiPost = async (url, body) => { requests.push({ url, body });
            if (url.endsWith('/queryStockDetail')) return { stockCode: 'A', previousClosePrice: 0 };
            if (url.endsWith('/queryAdjustLogList')) return [{ id: 7, stockCode: 'A', industryName: '历史行业' }];
            return [];
        };
        await page.loadDetail('A');
        assert.equal(page.stock.previousClosePrice, 0); assert.equal(page.adjustLogs[0].industryName, '历史行业');
        assert.equal(requests.find(item => item.url.endsWith('/queryAdjustLogList')).body.targetPoolId, 50);
        assert.equal(requests.find(item => item.url.endsWith('/queryAttachmentList')).body.businessDomain, 'stock');
    }
});

test('修改节点附件按日志分组，删除与源附件去重，审批通过multipart提交', async () => {
    const { page, requests } = harness('stock_pool_adjust_approve');
    page.stock = { stockCode: 'A' }; page.activeLog = { id: 7, auditStatus: '11', adjustReason: '新原因', adjustAdvice: '建议' };
    page.adjustLogId = 7; page.adjustBatchNo = 'STOCK7'; page.adjustLogs = [{ id: 7 }, { id: 8 }];
    page.flowStepList = [{ id: 10, stepStatus: 'pending', handlerId: '2', approvalStrategy: 'initiator' }];
    page.attachments = [{ id: 100, mainId: 7, attachmentCategory: 'stock_report_hand' }];
    page.removeExistingAttachment(page.adjustLogs[0], page.attachments[0]);
    page.handleAttachmentChange('', 7, { raw: new Blob(['新报告']), name: '新报告.pdf' });
    page.creditReportSelections['-8'] = [{ attachments: [{ id: 200 }, { id: 200 }] }];
    page.loadDetail = async () => {};
    page.apiPost = async (url, body) => { requests.push({ url, body }); return { message: '成功' }; };
    await page.submitAudit('approve');
    assert.equal(requests[0].url, '/api/v1/stockPoolAdjust/submitAdjustAuditWithFiles');
    const payload = JSON.parse(await requests[0].body.get('request').text());
    assert.equal(payload.adjustReason, '新原因'); assert.equal(payload.handlerId, '2');
    assert.deepEqual(payload.attachmentChanges[0].deleteAttachmentIds, [100]); assert.deepEqual(payload.attachmentChanges[0].reportFileIndexes, [0]);
    assert.deepEqual(payload.attachmentChanges[1].reportSourceAttachmentIds, [200]); assert.equal(requests[0].body.getAll('files').length, 1);
});

test('非修改节点不允许删除附件，驳回和终止需要意见', async () => {
    const { page, requests } = harness('stock_pool_adjust_approve');
    page.activeLog = { id: 7, auditStatus: '00' }; page.flowStepList = [{ id: 10, stepStatus: 'pending', handlerId: '2' }];
    page.attachments = [{ id: 100, mainId: 7 }]; page.removeExistingAttachment({ id: 7 }, page.attachments[0]);
    assert.equal(page.attachments.length, 1); await page.submitAudit('reject'); assert.equal(requests.length, 0);
});
