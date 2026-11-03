const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function pageMethods(filename) {
    let options;
    const context = vm.createContext({
        Vue: function(config) { options = config; },
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) } },
        URLSearchParams,
        moment() {}
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/security_master_diff.js'), 'utf8'), context);
    const html = fs.readFileSync(path.join(__dirname, '../pages', filename), 'utf8');
    assert.doesNotMatch(html, /window\.RrsAbsIdentity|src=["'][^"']*abs_identity\.js/);
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    return options.methods;
}

function identityHelper(filename = 'security_pool_adjust.html') {
    const methods = pageMethods(filename);
    const page = { $set(object, key, value) { object[key] = value; } };
    for (const name of ['buildAbsIdentityFields', 'applyAbsIdentitySelection', 'resolveInitialAbsIdentity']) {
        assert.equal(typeof methods[name], 'function', filename + ' 必须在 Vue methods 中声明 ' + name);
        page[name] = methods[name].bind(page);
    }
    return page;
}

test('六个单券及批量入口直接传递已选主体信息，自选优先且空评级不会沿用普通主体', () => {
    for (const filename of ['security_pool_adjust.html', 'forbidden_pool_adjust.html', 'crmw_pool_adjust.html',
        'batch_security_pool_adjust.html', 'stock_security_batch_adjust.html', 'batch_crmw_pool_adjust.html']) {
        const methods = pageMethods(filename);
        const page = { isAbsBond: () => true };
        const ordinary = { code: 'A', name: '主体A', rating: '2', ratingBondissuer: 'AA', ratingBondissuerAgency: 'R1' };
        const self = { companyCode: 'B', companyName: '主体B', innerRating: null, ratingBondissuer: null, ratingBondissuerAgency: null };
        const selected = methods.buildSelectedRatingCompany.call(page, {}, [ordinary], 'A', self);
        assert.equal(selected.companyCode, 'B', filename);
        assert.equal(selected.companyName, '主体B', filename);
        assert.equal(selected.innerRating, null, filename);
        assert.equal(selected.ratingBondissuer, null, filename);
        assert.equal(selected.ratingBondissuerAgency, null, filename);
        assert.equal(selected.rightsHolderName, '主体A', filename);
        assert.equal(selected.selfSelectedRightsHolderName, '主体B', filename);
        const cleared = methods.buildSelectedRatingCompany.call(page, {}, [ordinary], 'A', null);
        assert.equal(cleared.companyCode, 'A', filename);
        assert.equal(cleared.ratingBondissuerAgency, 'R1', filename);
    }
});

test('普通权益人五字段全部来自同一候选', () => {
    const helper = identityHelper();
    const detail = {};
    helper.applyAbsIdentitySelection(detail, { code: 'A', name: '主体A', rating: '2', ratingBondissuer: 'AA+', ratingBondissuerAgency: 'R1' }, null);
    assert.deepEqual(detail, { issuer: '主体A', issuerCode: 'A', innerIssuerRating: '2', ratingBondissuer: 'AA+', ratingBondissuerAgency: 'R1' });
});

test('自选 C 优先，清除自选后五字段整体恢复普通 A', () => {
    const helper = identityHelper();
    const detail = {};
    const ordinary = { code: 'A', name: '主体A', rating: '2', ratingBondissuer: 'AA', ratingBondissuerAgency: 'R1' };
    helper.applyAbsIdentitySelection(detail, ordinary, { companyCode: 'C', companyName: '主体C', innerRating: '1', ratingBondissuer: 'AAA', ratingBondissuerAgency: 'R2' });
    assert.equal(detail.issuerCode, 'C');
    assert.equal(detail.ratingBondissuerAgency, 'R2');
    helper.applyAbsIdentitySelection(detail, ordinary, null);
    assert.equal(detail.issuerCode, 'A');
    assert.equal(detail.ratingBondissuerAgency, 'R1');
});

test('在库或在途身份不跟随候选排序改变', () => {
    const helper = identityHelper();
    const selected = helper.resolveInitialAbsIdentity({ absIdentity: { issuerCode: 'A' } }, [{ code: 'B' }, { code: 'A' }]);
    assert.equal(selected.ordinaryCode, 'A');
    assert.equal(selected.selfSelected, null);
});

test('全市场自选身份恢复完整五字段', () => {
    const helper = identityHelper();
    const selected = helper.resolveInitialAbsIdentity({ absIdentity: { issuerCode: 'C', issuer: '主体C', innerIssuerRating: '1', ratingBondissuer: 'AAA', ratingBondissuerAgency: 'R2' } }, [{ code: 'A' }]);
    assert.equal(selected.selfSelected.companyCode, 'C');
    assert.equal(selected.selfSelected.ratingBondissuerAgency, 'R2');
});

test('成功入库后即使全部出清，也恢复固定 A 而不跟随候选 B', () => {
    const helper = identityHelper();
    const selected = helper.resolveInitialAbsIdentity({ absIdentity: { issuerCode: 'A' } }, [{ code: 'B' }, { code: 'A' }]);
    assert.equal(selected.ordinaryCode, 'A');
});

test('CRMW 申请修改沿用该笔快照主体，不跟随候选顺序改变', () => {
    const helper = identityHelper('crmw_pool_adjust.html');
    const selected = helper.resolveInitialAbsIdentity({ issuerCode: 'A', issuer: '主体A' }, [{ code: 'B' }, { code: 'A' }]);
    assert.equal(selected.ordinaryCode, 'A');
});

test('缺少评级时清除上一主体评分，零值仍保留', () => {
    const helper = identityHelper();
    const detail = { ratingBondissuer: 'AAA', ratingBondissuerAgency: 'OLD', innerIssuerRating: '1' };
    helper.applyAbsIdentitySelection(detail, { code: 'B', name: '主体B', rating: 0 }, null);
    assert.equal(detail.ratingBondissuer, null);
    assert.equal(detail.ratingBondissuerAgency, null);
    assert.equal(detail.innerIssuerRating, 0);
});

function batchPage(filename) {
    let options;
    function Vue(config) { options = config; }
    Vue.set = (object, key, value) => { object[key] = value; };
    const context = vm.createContext({
        Vue,
        window: { RrsAuth: { getCurrentUser: () => ({ userId: '1', userName: '测试用户' }) } },
        moment: () => ({ format: () => '2026-10-30' })
    });
    const html = fs.readFileSync(path.join(__dirname, '../pages', filename), 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) vm.runInContext(match[1], context);
    }
    const page = { $nextTick() {}, $set(object, key, value) { object[key] = value; } };
    Object.entries(options.methods).forEach(([key, method]) => { page[key] = method.bind(page); });
    Object.assign(page, options.data.call(page));
    page.currentPool = { id: 101 };
    page.direction = 'in';
    page.isInbound = true;
    page.securitySearchForm.sourcePoolIds = [1];
    return page;
}

for (const filename of ['batch_security_pool_adjust.html', 'stock_security_batch_adjust.html']) {
    test(`${filename} 在库 A 排在候选 B 后仍回显 A 的五字段`, async () => {
        const page = batchPage(filename);
        page.apiPost = async () => ({ records: [{ securityCode: 'ABS1', securityType: 'abs', absFlag: 1,
            absIdentity: { issuerCode: 'A' } }], total: 1 });
        page.queryGuarantorGradeMapByRecords = async () => ({ ABS1: [
            { code: 'B', name: '主体B', rating: '1', ratingBondissuer: 'AAA', ratingBondissuerAgency: 'R2' },
            { code: 'A', name: '主体A', rating: '2', ratingBondissuer: 'AA+', ratingBondissuerAgency: 'R1' }
        ] });
        await page.loadSecurityList();
        const row = page.securityTableData[0];
        assert.equal(row.selectedRelatedCompanyCode, 'A');
        assert.equal(row.issuerCode, 'A');
        assert.equal(row.issuer, '主体A');
        assert.equal(row.innerIssuerRating, '2');
        assert.equal(row.ratingBondissuer, 'AA+');
        assert.equal(row.ratingBondissuerAgency, 'R1');
    });
}

for (const filename of ['security_pool_adjust.html', 'forbidden_pool_adjust.html', 'batch_security_pool_adjust.html', 'stock_security_batch_adjust.html']) {
    test(filename + ' 的 ABS 方法属于 Vue 实例，选择自选后整体回填五字段', () => {
        const page = identityHelper(filename);
        const detail = {};
        page.applyAbsIdentitySelection(detail, { code: 'A', name: '主体A' }, {
            companyCode: 'B', companyName: '主体B', innerRating: '2', ratingBondissuer: 'AA+', ratingBondissuerAgency: 'R2'
        });
        assert.deepEqual(detail, { issuer: '主体B', issuerCode: 'B', innerIssuerRating: '2', ratingBondissuer: 'AA+', ratingBondissuerAgency: 'R2' });
    });
}
