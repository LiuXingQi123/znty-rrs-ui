// 无需安装依赖：node --test tests/security_master_diff.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 日期用固定输入输出桩隔离 Moment；浏览器检查使用页面原有 Moment 实现。
function moment(value) {
    const date = String(value || '').replaceAll('-', '').slice(0, 8);
    return {
        isValid: () => ['20290318', '20290331'].includes(date),
        format: format => value == null ? '2026-10-14 12:00:00'
            : format === 'YYYYMMDD' ? date : date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8)
    };
}

function harness(abs = false) {
    const window = {};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), { window, moment });
    const feature = window.RrsSecurityMasterDiff;
    const mixin = abs ? feature.createMixin('absBondDetail', 'absDetail',
        { innerGuarantorRating: 'selectedGuarantorRating' }) : feature.mixin;
    const requests = [];
    const page = { ...mixin.data(), [abs ? 'absBondDetail' : 'bondDetail']: { windCode: 'A.IB' },
        currentPage: abs ? 'absDetail' : 'detail',
        async apiPost(url, body) {
            requests.push({ url, body });
            return { windCode: body.securityCode, maturityDate: '20290318', ratingBondissuer: 'AAA', dateCallExists: 1 };
        } };
    Object.entries(mixin.methods).forEach(([name, method]) => { page[name] = method.bind(page); });
    return { page, feature, mixin, requests };
}

test('日期和数字按业务值比较，空值与零不同，未知字段不标记', () => {
    const { feature } = harness();
    const comparison = { status: 'ready', master: { maturityDate: '20290318', couponRate: 1, dateCallExists: null } };
    assert.equal(feature.differs(comparison, 'maturityDate', '2029-03-18'), false);
    assert.equal(feature.differs(comparison, 'maturityDate', '20290331'), true);
    assert.equal(feature.differs(comparison, 'couponRate', '1.00'), false);
    assert.equal(feature.normalize('couponRate', '001.000'), '1');
    assert.equal(feature.normalize('couponRate', '-0.000'), '0');
    assert.notEqual(feature.normalize('couponRate', '0.123456789012345678'),
        feature.normalize('couponRate', '0.123456789012345679'));
    assert.equal(feature.differs(comparison, 'dateCallExists', 0), true);
    assert.equal(feature.differs(comparison, 'dateCallExists', ''), false);
    assert.equal(feature.differs(comparison, 'absOriginatorName', '所选权益人'), false);
    assert.notEqual(feature.normalize('maturityDate', '无效日期'), feature.normalize('maturityDate', null));
});

test('对比仅使用独立数据，不覆盖表单或传入申请定位信息，编辑后差异即时更新', async () => {
    const { page, feature, requests } = harness();
    page.bondDetail = { windCode: 'A.IB', ratingBondissuer: 'AA', maturityDate: '20290331' };
    page.selectedAdjustLogId = 99;
    const original = JSON.stringify(page.bondDetail);
    await page.loadSecurityMasterComparison('A.IB');
    assert.equal(JSON.stringify(page.bondDetail), original);
    assert.equal(page.securityMasterComparison.status, 'ready');
    assert.deepEqual(requests.map(r => JSON.parse(JSON.stringify(r.body))), [{ securityCode: 'A.IB' }]);
    assert.equal(feature.differs(page.securityMasterComparison, 'ratingBondissuer', page.bondDetail.ratingBondissuer), true);
    page.bondDetail.ratingBondissuer = 'AAA';
    assert.equal(feature.differs(page.securityMasterComparison, 'ratingBondissuer', page.bondDetail.ratingBondissuer), false);
});

test('统一开关关闭后无请求、无差异，返回列表和销毁均取消对比', async () => {
    const { page, feature, mixin, requests } = harness();
    await page.loadSecurityMasterComparison('A.IB');
    feature.enabled = false;
    await page.loadSecurityMasterComparison('A.IB');
    assert.equal(requests.length, 1);
    assert.equal(page.securityMasterComparison.status, 'disabled');
    assert.equal(feature.differs(page.securityMasterComparison, 'maturityDate', '20290331'), false);
    feature.enabled = true;
    await page.loadSecurityMasterComparison('A.IB');
    mixin.watch.currentPage.call(page, 'list');
    assert.equal(page.securityMasterComparison.status, 'disabled');
    mixin.beforeDestroy.call(page);
    assert.equal(page.securityMasterComparison.status, 'disabled');
});

test('请求失败和主档代码异常显示不可用，保持表单并不伪装无差异', async () => {
    const { page, feature } = harness();
    for (const response of [null, { windCode: 'OTHER.IB' }, new Error('请求失败')]) {
        page.apiPost = async () => { if (response instanceof Error) throw response; return response; };
        await page.loadSecurityMasterComparison('A.IB');
        assert.equal(page.securityMasterComparison.status, 'unavailable');
        assert.equal(page.bondDetail.windCode, 'A.IB');
        assert.equal(feature.differs(page.securityMasterComparison, 'maturityDate', '20290331'), false);
    }
});

test('快速换券、同券重新读取和返回列表后旧响应均不回写', async () => {
    const { page, mixin } = harness();
    const pending = [];
    page.apiPost = async (url, body) => new Promise(resolve => pending.push({ body, resolve }));
    const old = page.loadSecurityMasterComparison('A.IB');
    page.bondDetail = { windCode: 'B.IB' };
    const latest = page.loadSecurityMasterComparison('B.IB');
    pending[1].resolve({ windCode: 'B.IB', ratingBondissuer: 'AAA' });
    await latest;
    pending[0].resolve({ windCode: 'A.IB' });
    await old;
    assert.equal(page.securityMasterComparison.master.windCode, 'B.IB');
    const again = page.loadSecurityMasterComparison('B.IB');
    const newest = page.loadSecurityMasterComparison('B.IB');
    pending[3].resolve({ windCode: 'B.IB', ratingBondissuer: 'AA' });
    await newest;
    pending[2].resolve({ windCode: 'B.IB', ratingBondissuer: 'AAA' });
    await again;
    assert.equal(page.securityMasterComparison.master.ratingBondissuer, 'AA');
    const leaving = page.loadSecurityMasterComparison('B.IB');
    mixin.watch.currentPage.call(page, 'list');
    pending[4].resolve({ windCode: 'B.IB' });
    await leaving;
    assert.equal(page.securityMasterComparison.status, 'disabled');
});

test('差异标签 Tooltip 安全展示页面值、主档值和读取时间，原标签关闭时保持文字', () => {
    const { feature } = harness();
    const render = feature.mixin.components['security-master-diff-label'].render;
    const h = (tag, data, children) => ({ tag, data, children });
    const props = { label: '主体评级', field: 'ratingBondissuer', value: '<b>AA</b>',
        comparison: { status: 'ready', master: { ratingBondissuer: 'AAA' }, loadedAt: '读取时间' } };
    const node = render.call(props, h);
    assert.equal(node.tag, 'el-tooltip');
    assert.match(JSON.stringify(node), /主档值：AAA/);
    assert.match(JSON.stringify(node), /页面值：<b>AA<\/b>/);
    assert.doesNotMatch(JSON.stringify(node), /innerHTML/);
    props.comparison.status = 'disabled';
    assert.equal(render.call(props, h).data, '主体评级');
});

test('担保人和有效权益人内评比较控件实际显示值，保持原选择数据', () => {
    const { page } = harness();
    page.relatedRatingCompanyOptions = [{ code: 'C1', name: '担保人一', rating: '1' }];
    page.bondDetail.selectedGuarantorCode = 'C1';
    page.bondDetail.selectedGuarantorRating = '1';
    page.isAbsBond = () => false;
    assert.equal(page.securityMasterFieldValue('guarantor'), '担保人一');
    assert.equal(page.securityMasterFieldValue('innerGuarantorRating'), '1');
    page.isAbsBond = () => true;
    page.effectiveRightsHolderRating = '2+';
    assert.equal(page.securityMasterFieldValue('innerGuarantorRating'), '2+');
    assert.equal(page.bondDetail.selectedGuarantorRating, '1');
});

test('禁投池仅在 ABS 视图请求主档，与主体数据隔离，权益人评分读取原控件值', async () => {
    const { page, mixin, requests } = harness(true);
    page.companyDetail = { companyCode: 'COMP1', innerIssuerRating: '3' };
    page.absBondDetail.selectedGuarantorRating = '2+';
    const companyBefore = JSON.stringify(page.companyDetail);
    await page.loadSecurityMasterComparison('A.IB');
    assert.equal(requests.length, 1);
    assert.equal(page.securityMasterComparison.status, 'ready');
    assert.equal(page.securityMasterFieldValue('innerGuarantorRating'), '2+');
    assert.equal(JSON.stringify(page.companyDetail), companyBefore);
    page.currentPage = 'detail';
    mixin.watch.currentPage.call(page, 'detail');
    assert.equal(page.securityMasterComparison.status, 'disabled');
    await page.loadSecurityMasterComparison('A.IB');
    assert.equal(requests.length, 1, '主体详情不请求证券主档');
    assert.equal(page.securityMasterComparison.status, 'disabled');
    page.currentPage = 'absDetail';
    await page.loadSecurityMasterComparison('A.IB');
    assert.equal(requests.length, 2);
    assert.equal(page.securityMasterComparison.status, 'ready');
});
