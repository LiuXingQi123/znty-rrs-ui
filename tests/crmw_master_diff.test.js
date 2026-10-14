// 无需安装依赖：node --test tests/crmw_master_diff.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 执行三个 CRMW 页面的实际配置和差异标签表达式，保留原选择控件的数据结构。
function harness(name) {
    let options;
    const window = { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) } };
    const context = vm.createContext({ window, Vue: function(config) { options = config; },
        URLSearchParams, moment: () => ({ format: () => '2026-10-14 12:00:00' }) });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    const html = fs.readFileSync(path.join(__dirname, '../pages', name + '.html'), 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const feature = window.RrsSecurityMasterDiff;
    assert.ok(options.mixins.includes(feature.mixin), '页面已接入公共对比模块');
    const page = { ...feature.mixin.data(), ...options.data(), currentPage: 'detail' };
    Object.entries(feature.mixin.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    const requests = [];
    page.bondDetail = { windCode: 'BOND.IB', ratingBondissuer: 'AA', innerGuarantorRating: '3',
        guarantor: '快照担保人', securityType: 'bond', absFlag: 0 };
    page.crmwDetail = { windCode: 'CRMW.IB', fullName: '只读凭证' };
    page.apiPost = async (url, body) => {
        requests.push({ url, body });
        return { windCode: body.securityCode, ratingBondissuer: 'AAA', innerGuarantorRating: '1' };
    };
    const start = html.indexOf('<el-descriptions :column="3" border size="small" class="bond-info-descriptions">');
    const end = html.indexOf('</el-descriptions>', start);
    // 允许表达式中包含 =>，按引号边界提取整个组件标签。
    const tags = [...html.slice(start, end).matchAll(/<security-master-diff-label\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)]
        .map(match => match[0]);
    const props = field => {
        const tag = tags.find(item => item.includes('field="' + field + '"') || field === 'guarantor' && item.includes(':field='));
        assert.ok(tag, '存在对应字段标签：' + field);
        const attrs = Object.fromEntries([...tag.matchAll(/(:?[\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
        const state = vm.createContext(page);
        return {
            field: attrs.field || vm.runInContext(attrs[':field'], state),
            value: vm.runInContext(attrs[':value'], state)
        };
    };
    return { page, feature, requests, html, tags, props };
}

for (const name of ['crmw_pool_adjust', 'crmw_pool_adjust_detail', 'crmw_pool_adjust_approve']) {
    test(name + ' 只读取标的主档，保留凭证、快照和业务定位，统一开关有效', async () => {
        const { page, feature, requests, html, tags } = harness(name);
        const before = JSON.stringify({ bond: page.bondDetail, crmw: page.crmwDetail });
        page.selectedAdjustLogId = 99;
        await page.loadSecurityMasterComparison('BOND.IB');
        assert.equal(requests.length, 1);
        assert.equal(requests[0].url, '/api/v1/securityPoolAdjust/querySecurityMasterDetail');
        assert.deepEqual(JSON.parse(JSON.stringify(requests[0].body)), { securityCode: 'BOND.IB' });
        assert.equal(JSON.stringify({ bond: page.bondDetail, crmw: page.crmwDetail }), before);
        assert.equal(page.securityMasterComparison.status, 'ready');
        assert.equal(feature.differs(page.securityMasterComparison, 'ratingBondissuer', page.bondDetail.ratingBondissuer), true);
        assert.equal(tags.length, 26);
        const crmwStart = html.indexOf('<!-- CRMW基本信息 -->');
        const crmwEnd = html.indexOf('</el-descriptions>', crmwStart);
        assert.doesNotMatch(html.slice(crmwStart, crmwEnd), /security-master-diff-label/);
        feature.enabled = false;
        await page.loadSecurityMasterComparison('BOND.IB');
        assert.equal(requests.length, 1);
        assert.equal(page.securityMasterComparison.status, 'disabled');
    });

    test(name + ' 担保人和内评按原控件的选中或快照值比较，ABS 权益人名称不误报', () => {
        const { page, props } = harness(name);
        page.isAdjustMode = name !== 'crmw_pool_adjust_approve';
        page.guarantorOptions = [{ code: 'G1', name: '本次所选担保人', rating: '2+' }];
        if (page.isAdjustMode) {
            page.bondDetail.selectedGuarantorCode = 'G1';
            page.bondDetail.selectedGuarantorRating = '2+';
        }
        assert.equal(props('guarantor').field, 'guarantor');
        assert.equal(props('guarantor').value, page.isAdjustMode ? '本次所选担保人' : '快照担保人');
        assert.equal(props('innerGuarantorRating').value, page.isAdjustMode ? '2+' : '3');
        if (name === 'crmw_pool_adjust_detail') {
            page.isAdjustMode = false;
            assert.equal(props('guarantor').value, '快照担保人');
            assert.equal(props('innerGuarantorRating').value, '3');
        }
        page.bondDetail.absFlag = 1;
        assert.equal(props('guarantor').field, '', 'ABS 权益人名称没有对应主档比较项');
    });
}
