/* 证券主档差异提示：独立读取、独立展示，不修改表单、快照或调库请求。 */
(function() {
    const numberFields = new Set(['issueAmountplan', 'couponRate', 'infoPledgeRatio',
        'dateCallExists', 'dateInrightExists', 'dateExists']);
    const dateFields = new Set(['carryDate', 'maturityDate']);
    // 仅比较主档实际维护且基本信息区展示的字段；市场关联和 ABS 自选权益人不属于此范围。
    const fields = ['fullName', 'shortName', 'windCode', 'issuer', 'issueAmountplan', 'couponRate',
        'maturityembeddedDesc', 'carryDate', 'maturityDate', 'infoPledgeRatio', 'ratingBondAgency',
        'ratingBond', 'ratingBondissuer', 'ratingOutlook', 'guarantor', 'agencyName',
        'innerIssuerRating', 'securityTypeName', 'dateCallExists', 'innerGuarantorRating',
        'dateInrightExists', 'dateExists', 'dateExistsStr', 'fundUse', 'promptReason', 'analysis'];

    // 规范化展示格式进行比较，空值与零值保持不同，无法解析的内容保留原值。
    function normalize(field, value) {
        if (value == null || String(value).trim() === '') return '';
        const text = String(value).replace(/\r\n?/g, '\n').trim();
        if (dateFields.has(field)) {
            const parsed = moment(text, ['YYYYMMDD', 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'], true);
            return parsed.isValid() ? parsed.format('YYYYMMDD') : text;
        }
        if (numberFields.has(field)) {
            // 十进制文本不转浮点数，避免长小数或大金额被舍入后误判相同。
            const decimal = text.match(/^([+-]?)(\d*)(?:\.(\d*))?$/);
            if (decimal && (decimal[2] || decimal[3])) {
                const integer = (decimal[2] || '0').replace(/^0+(?=\d)/, '');
                const fraction = (decimal[3] || '').replace(/0+$/, '');
                const sign = decimal[1] === '-' && (integer !== '0' || fraction) ? '-' : '';
                return sign + integer + (fraction ? '.' + fraction : '');
            }
            if (Number.isFinite(Number(text))) return String(Number(text));
        }
        return text;
    }

    // 比较完成且代码对应时才能标记差异，缺失对比字段不推断为数据库空值。
    function differs(comparison, field, value) {
        return comparison.status === 'ready'
            && fields.includes(field)
            && Object.prototype.hasOwnProperty.call(comparison.master, field)
            && normalize(field, value) !== normalize(field, comparison.master[field]);
    }

    // Tooltip 中明确说明空值，正文控件仍沿用原有空白展示。
    function display(field, value) {
        if (value == null || String(value).trim() === '') return '（空）';
        if (dateFields.has(field)) {
            const parsed = moment(String(value), ['YYYYMMDD', 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'], true);
            if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
        }
        return String(value);
    }

    const labelComponent = {
        props: ['label', 'field', 'value', 'comparison'],
        // 只装饰标签，保留原控件的尺寸、禁用状态、校验和事件。
        render(h) {
            if (!differs(this.comparison, this.field, this.value)) return h('span', this.label);
            return h('el-tooltip', {
                props: { placement: 'top', effect: 'light', popperClass: 'security-master-diff-tooltip' }
            }, [
                h('div', { slot: 'content' }, [
                    h('div', '与当前证券主档不一致'),
                    h('div', '页面值：' + display(this.field, this.value)),
                    h('div', '主档值：' + display(this.field, this.comparison.master[this.field])),
                    h('div', '数据读取时间：' + this.comparison.loadedAt)
                ]),
                h('span', { class: 'security-master-diff-label', attrs: { tabindex: '0' } }, [
                    this.label, h('i', { class: 'el-icon-warning-outline security-master-diff-icon',
                        attrs: { 'aria-label': '与当前证券主档不一致' } })
                ])
            ]);
        }
    };

    window.RrsSecurityMasterDiff = {
        // 统一开关：改为 false 后，所有接入页面均不请求主档、不显示提示。
        enabled: true,
        fields,
        normalize,
        differs,
        // 按页面数据对象和视图隔离对比，ABS 页签可复用且不影响同页主体调库。
        createMixin(detailKey = 'bondDetail', activePage = 'detail', fieldAliases = {}) {
            return {
                components: { 'security-master-diff-label': labelComponent },
                data() {
                    return {
                        securityMasterComparison: { status: 'disabled', master: {}, loadedAt: '', code: '' },
                        securityMasterRequestSeq: 0 // 防止切换证券或返回列表后旧请求回写
                    };
                },
                watch: {
                    // 每次重新加载详情（含同券）都读取主档；普通字段编辑不发送请求。
                    [detailKey](detail) {
                        this.loadSecurityMasterComparison(detail && detail.windCode);
                    },
                    currentPage(page) {
                        if (page !== activePage) this.resetSecurityMasterComparison();
                    }
                },
                beforeDestroy() {
                    this.resetSecurityMasterComparison();
                },
                methods: {
                    // 取消旧对比结果，不更改原页面数据。
                    resetSecurityMasterComparison() {
                        this.securityMasterRequestSeq++;
                        this.securityMasterComparison = { status: 'disabled', master: {}, loadedAt: '', code: '' };
                    },
                    // 独立请求主档；失败仅标识对比不可用，不参与原有详情加载及提交。
                    async loadSecurityMasterComparison(code) {
                        this.resetSecurityMasterComparison();
                        if (!window.RrsSecurityMasterDiff.enabled || !code || this.currentPage !== activePage) return;
                        const seq = this.securityMasterRequestSeq;
                        this.securityMasterComparison = { status: 'loading', master: {}, loadedAt: '', code };
                        try {
                            const master = await this.apiPost('/api/v1/securityPoolAdjust/querySecurityMasterDetail',
                                { securityCode: code });
                            if (seq !== this.securityMasterRequestSeq || this[detailKey].windCode !== code) return;
                            if (!master || master.windCode !== code) throw new Error('主档证券代码不匹配');
                            this.securityMasterComparison = {
                                status: 'ready', master, code, loadedAt: moment().format('YYYY-MM-DD HH:mm:ss')
                            };
                        } catch (error) {
                            if (seq !== this.securityMasterRequestSeq || this[detailKey].windCode !== code) return;
                            this.securityMasterComparison = { status: 'unavailable', master: {}, loadedAt: '', code };
                        }
                    },
                    // 调库页的评级主体和评分来自现有选择控件，其余字段直接读取原表单。
                    securityMasterFieldValue(field) {
                        const detail = this[detailKey];
                        if (Object.prototype.hasOwnProperty.call(fieldAliases, field)) return detail[fieldAliases[field]];
                        if (field === 'guarantor' && Object.prototype.hasOwnProperty.call(detail, 'selectedGuarantorCode')) {
                            const selected = this.relatedRatingCompanyOptions.find(item => item.code === detail.selectedGuarantorCode);
                            return selected ? selected.name : '';
                        }
                        if (field === 'innerGuarantorRating' && Object.prototype.hasOwnProperty.call(detail, 'selectedGuarantorRating')) {
                            return this.isAbsBond(detail) ? this.effectiveRightsHolderRating : detail.selectedGuarantorRating;
                        }
                        return detail[field];
                    }
                }
            };
        }
    };
    window.RrsSecurityMasterDiff.mixin = window.RrsSecurityMasterDiff.createMixin();
})();
