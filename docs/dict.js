// ============================================================
// znty-sirm 全局字典常量（参考文档）
// ============================================================
// 维护说明：本文件为 code→中文名称 的统一参考字典，与后端枚举
//          （com.znty.sirm.common.enums）及 dict_security_type 演示数据逐项核对。
// 现状：各 HTML 页面当前 inline 维护各自字典，尚未统一引入本文件；
//      本文件作为权威参考，后续页面接入统一字典时以此为准。
// 位置：docs/dict.js（参考文档，非运行时依赖）
// ============================================================

// ────────────────────────────────────────────────────────────
// 工具函数
// ────────────────────────────────────────────────────────────

const DictUtil = {
    // code → label，找不到时返回 code 本身
    label(dict, code) {
        if (code === null || code === undefined || code === '') return '';
        return dict[String(code)] || String(code);
    },
    // 将字典对象转换为 el-select 选项数组 [{ value, label }]
    toOptions(dict) {
        return Object.entries(dict).map(([value, label]) => ({ value, label }));
    },
};


// ════════════════════════════════════════════════════════════
// 一、证券池调整
// ════════════════════════════════════════════════════════════

// ── 1. 审核状态（audit_status）────────────────────────────
// 枚举：AuditStatus
// 表：ip_adjust_log, ip_pool_status
// 说明：调库申请从提交到最终入池/驳回/撤回的全生命周期状态
const DICT_AUDIT_STATUS = {
    '-1': '无效调整',     // 批量校验不通过，操作中止，流程未正式发起
    '00': '已提交待审核', // 已提交，等待审核人处理
    '10': '审核通过待审批', // 审核通过，等待审批人处理
    '11': '驳回待修改',   // 一级审核驳回，发起人可修改后重新提交
    '20': '审批通过',     // 二级审批通过，证券已入池/已生效
    '21': '审批驳回',     // 二级审批驳回，流程终止
    '32': 'O32自动审批',  // 预留：当前自动审批节点通过后落地为 '20'，此 code 运行时不直接写入
    '99': '发起人已撤回', // 发起人主动撤回，流程终止
};

// audit_status → el-tag type（用于 <el-tag :type="...">）
const DICT_AUDIT_STATUS_TAG_TYPE = {
    '-1': 'danger',
    '00': 'warning',
    '10': 'success',
    '11': 'warning',
    '20': 'success',
    '21': 'danger',
    '32': 'success',
    '99': 'info',
};

// audit_status → 自定义徽标颜色（用于 security_pool_adjust 内联样式）
const DICT_AUDIT_STATUS_STYLE = {
    '-1': { bg: '#F0F2FA', color: '#8895B8' },
    '00': { bg: '#EEF2FD', color: '#1746D4' },
    '10': { bg: '#E8FBF3', color: '#0A8A5A' },
    '11': { bg: '#FFF6E8', color: '#B05E00' },
    '20': { bg: '#E8FBF3', color: '#0A8A5A' },
    '21': { bg: '#FFF0F0', color: '#D02020' },
    '32': { bg: '#E8FBF3', color: '#0A8A5A' },
    '99': { bg: '#F0F2FA', color: '#8895B8' },
};

// ── 2. 调整方向（adjust_mode）─────────────────────────────
// 枚举：AdjustMode
// 表：ip_adjust_log, ip_pool_status
const DICT_ADJUST_MODE = {
    '调入': '调入',
    '调出': '调出',
};

// ── 3. 调整类型（adjust_type）─────────────────────────────
// 表：ip_adjust_log, ip_pool_status
// 说明：无独立后端枚举，为业务字段 adjust_type 的取值集合
const DICT_ADJUST_TYPE = {
    '手工调整':     '手工调整',     // 单条手工录入
    '联动调整':     '联动调整',     // 入一级库自动联动关联库
    '互斥调整':     '互斥调整',     // 进入某库自动移出互斥库
    '关联调整':     '关联调整',     // 因关联关系触发的调整
    'Excel导入':    'Excel导入',    // 批量 Excel 文件导入
    '手动批量调整': '手动批量调整', // 手动批量操作（可触发校验中止）
    '自动调整':     '自动调整',     // 主体入池/出池生效后，旗下债券自动同步调整产生
};

// ── 4. 调库项标签（item_tag）──────────────────────────────
// 枚举：ItemType
// 业务字段 item_tag（与 adjust_type 不同字段）
const DICT_ITEM_TYPE = {
    'manual':  '手工项',
    'linkage': '联动项',
    'mutex':   '互斥项',
};

// ── 5. 调库流程类型（flow_type）───────────────────────────
// 枚举：FlowType
// 业务字段 flow_type（ip_adjust_log.flow_type / ip_pool_status.flow_type）
const DICT_FLOW_TYPE = {
    'whitelistInbound':  '白名单调入',
    'simpleInbound':     '简易调入',
    'normalInbound':     '默认调入',
    'upgradeInbound':    '上调',
    'downgradeInbound':  '下调',
    'normalOutbound':    '默认调出',
};

// ── 6. 流程步骤状态（step_status）────────────────────────
// 枚举：StepStatus
// 表：ip_adjust_step.step_status
const DICT_STEP_STATUS = {
    'pending':      '待处理',
    'approve':      '通过',
    'reject':       '驳回',
    'submit':       '提交',
    'auto_process': '自动处理',
    'canceled':     '已撤回',
};

// ── 7. 流程步骤处理动作（process_action）─────────────────
// 枚举：ProcessAction
// 表：ip_adjust_step.process_action
const DICT_PROCESS_ACTION = {
    'submit':       '提交',
    'approve':      '通过',
    'reject':       '驳回',
    'auto_process': '自动处理',
    'skipped':      '被跳过',
};

// ── 8. 投资池类型（pool_type）─────────────────────────────
// 枚举：PoolType
// 表：ip_investment_pool, ip_adjust_log, ip_pool_status
const DICT_POOL_TYPE = {
    'credit_bond':       '信用债',   // 信用债大库及子库（一至五级库）
    'offshore_bond':     '境外债',   // 境外债库
    'convertible_bond':  '转债',     // 可转债/可交换债库
    'special_account':   '专户产品', // 专户产品库及子库
    'crmw':              'CRMW库',
    'forbidden':         '禁投池',   // 禁止交易池
    'observe':           '观察池',   // 观察池（禁投池调整目标池之一，id=16）
    'research':          '研究池',
    'fund':              '基金池',
    'restricted':        '限制池',
    'industry':          '行业池',
    'whitelist':         '白名单',
    'blacklist':         '黑名单',
    'private_placement': '私募池',
    'other':             '其他',
};

// ── 9. 投资池层级（pool_level）────────────────────────────
// 表：ip_investment_pool
const DICT_POOL_LEVEL = {
    1: '顶级池',   // 一级目录，如"信用债大库"、"禁投池"
    2: '子级池',   // 叶子节点，如"一级库"、"二级库"
};

// ── 10. 投资池启用状态（status）───────────────────────────
// 枚举：PoolStatus
// 表：ip_investment_pool
const DICT_POOL_ENABLED_STATUS = {
    'enabled':  '启用',
    'disabled': '停用',
};

// ── 11. 投资池关系类型（relation_type）────────────────────
// 枚举：RelationType
// 表：ip_pool_relation
const DICT_POOL_RELATION_TYPE = {
    'source':           '来源池',
    'in_restrict':      '调入限制池',
    'out_restrict':     '调出限制池',
    'in_linked':        '调入联动池',
    'out_linked':       '调出联动池',
    'in_mutex':         '调入互斥池',   // 调入本池时需从互斥池移出
    'out_mutex':        '调出互斥池',
    'in_soft_restrict': '调入弹性禁投池',
    'out_soft_restrict':'调出弹性禁投池',
};

// ── 12. 自动调整规则类型（rule_type）──────────────────────
// 枚举：RuleType
// 表：ip_pool_auto_rule
const DICT_POOL_AUTO_RULE_TYPE = {
    'auto_in':  '自动调入',
    'auto_out': '自动调出',
};

// ── 13. 权限类型（permission_type）────────────────────────
// 枚举：PermissionType
// 表：ip_pool_permission
const DICT_POOL_PERMISSION_TYPE = {
    'viewable':         '可查看',
    'adjustable':       '可调整',     // 可发起调库申请
    'excel_importable': '可Excel导入',
};

// ── 14. 权限处理人类型（handler_type）─────────────────────
// 枚举：HandlerType
// 表：ip_pool_permission, wf_node_approval_handler
const DICT_PERMISSION_HANDLER_TYPE = {
    'role': '角色',
    'user': '人员',
};

// ── 15. 研报限制（in_report_restriction / out_report_restriction）
// 表：ip_investment_pool（无独立后端枚举）
const DICT_REPORT_RESTRICTION = {
    'none':     '不限制研究报告',
    'any':      '任意一篇研究报告',
    'internal': '必须是内部研究报告',
};

// ── 16. 证券存续状态（bond_status）───────────────────────
// 枚举：BondStatus
// 前端查询条件，根据到期日与当前日期比较计算，无独立 DB 字段
// 注意：forbidden_pool_query 使用中文值（存续/到期），
//       security_pool_query 使用英文值（active/matured），建议统一为英文值
const DICT_BOND_STATUS = {
    'active':  '存续',
    'matured': '到期',
};


// ════════════════════════════════════════════════════════════
// 二、证券信息
// ════════════════════════════════════════════════════════════

// ── 17. 证券类型——整数码（d_security_type）────────────────
// 表：rrs_securityinfo（字段 d_security_type）
// 说明：证券基础信息表中的整数类型码（无独立后端枚举）
const DICT_SECURITY_TYPE_INT = {
    1: '中期票据',
    2: '公司债',
    3: '可交换债',
    4: '商业银行债',
    5: '短期融资券',
    6: '资产支持证券',
    7: '超短期融资券',
};

// ── 18. 证券类型——字符串码（security_type）───────────────
// 表：dict_security_type（字段 security_type / security_type_name）
// 说明：与 sql/rrs_dict_demo_data.sql 中 dict_security_type 演示数据逐项核对；
//      页面实际从后端 /queryTempSecurityCodeOptions 等接口动态加载，本字典仅作参考。
//      大类 bond=债券 / stock=股票 / fund=基金 / company=公司主体 / 其他
const DICT_SECURITY_TYPE_STR = {
    // 股票（stock）
    'a_share':                    'A股',
    'b_share':                    'B股',
    'h_share':                    'H股',
    's_share':                    'S股',
    'hk_share':                   '港股',
    'net_staq_share':             'NET/STAQ股',
    'third_board_share':          '三板股',
    'third_board_b':              '三板B',
    // 基金（fund）
    'closed_fund':                '封闭式基金',
    'open_fund':                  '开放式基金',
    'qdii_fund':                  'QDII基金类型',
    'lof_fund':                   'LOF基金类型',
    'etf_fund':                   'ETF基金类型',
    // 债券（bond）
    'treasury_bond':              '国债',
    'local_gov_bond':             '地方政府债券',
    'financial_bond':             '金融债',
    'policy_financial_bond':      '政策性金融债',
    'gov_institution_bond':       '政府支持机构债',
    'intl_dev_bond':              '国际开发机构债券',
    'enterprise_bond':            '企业债',
    'corporate_bond':             '企业债',
    'company_bond':               '公司债',
    'bank_bond':                  '商业银行债',
    'interbank_subordinated_bond':'银行间次级债',
    'mtn':                        '中期票据',
    'cp':                         '短期融资券',
    'scp':                        '短期融资券',
    'fmcp':                       '超短期融资券',
    'ncd':                        '同业存单',
    'cd':                         '大额存单',
    'convertible_bond':           '可转债',
    'detachable_convertible_bond':'可分离转债存债',
    'exchangeable_bond':          '可交换公司债券',
    'abs':                        '资产证券化',
    'abn':                        '资产支持票据',
    'broker_asset_management':    '券商专项资产管理',
    'project_revenue_note':       '项目收益票据',
    'debt_right':                 '债权',
    'ppn':                        '定向工具',
    'treasury_repo':              '国债回购',
    'corp_repo':                  '企债回购',
    'outright_repo':              '买断式回购',
    'central_bank_bill':          '央行票据',
    'credit_bond':                '信用债',
    'crmw':                       '信用风险缓释凭证',
    'corp_bond_intl':             'Corp债券',
    'govt_bond_intl':             'Govt债券',
    // 公司主体
    'company':                    '公司主体',
    // 其他
    'index':                      '指数',
    'sector_index':               '板块指数',
    'warrant':                    '权证',
    'private_wealth_management':  '私募理财产品',
    'trust':                      '信托',
    'unknown':                    '未知',
};

// ── 19. 证券大类（category_type）─────────────────────────
// 枚举：CategoryType
// 表：dict_security_type
const DICT_SECURITY_CATEGORY = {
    'bond':    '债券',
    'stock':   '股票',
    'fund':    '基金',
    'company': '公司主体',
};

// ── 20. 利率类型（interest_type）───────────────────
// 表：rrs_securityinfo（无独立后端枚举）
const DICT_INTEREST_TYPE = {
    '固定利率': '固定利率',
    '浮动利率': '浮动利率', // 基准利率 + 固定利差，如 SHIBOR+spread
    '累进利率': '累进利率', // 利率随时间递增，常见于可转/可交换债
    '零息债':   '零息债',   // 不付息，折价发行
};

// ── 21. 付息频率（interest_frequency）──────────────
// 表：rrs_securityinfo（无独立后端枚举）
const DICT_INTEREST_FREQUENCY = {
    '按年付息':         '按年付息',
    '按半年付息':       '按半年付息',
    '按季付息':         '按季付息',
    '按月付息':         '按月付息',
    '到期一次还本付息': '到期一次还本付息', // 短融/超短融/零息债
};

// ── 22. 发行方式（issue_type）──────────────────────
// 表：rrs_securityinfo（无独立后端枚举）
const DICT_ISSUE_TYPE = {
    '公开发行':   '公开发行',
    '非公开发行': '非公开发行', // PPN、私募债等
    '簿记建档':   '簿记建档',   // ABS 等结构化产品常用
};

// ── 23. 主体类型/公司性质（comp_type）──────────────
// 表：rrs_securityinfo（无独立后端枚举）
const DICT_COMPANY_TYPE = {
    '央企':     '央企',
    '地方国企': '地方国企',
    '城投平台': '城投平台',
    '上市银行': '上市银行',
    '股份制银行':'股份制银行',
    '城商行':   '城商行',
    '民营企业': '民营企业',
    '民营房企': '民营房企',
    '外资企业': '外资企业',
    '其他':     '其他',
};

// ── 24. 外部评级（rating_bond / rating_bondissuer）
// 表：rrs_securityinfo（无独立后端枚举）
// 长期评级：AAA+ > AAA > AA+ > ... > D
// 短期评级：A-1（短融/超短融专用）
const DICT_RATING_LONG = [
    'AAA+', 'AAA', 'AA+', 'AA', 'AA-',
    'A+', 'A', 'A-',
    'BBB+', 'BBB', 'BBB-',
    'BB+', 'BB', 'BB-',
    'B', 'CCC', 'CC', 'C', 'D',
];
const DICT_RATING_SHORT = ['A-1', 'A-2', 'A-3', 'B', 'C', 'D']; // 短期评级（CP/SCP）

// ── 25. 评级展望（rating_outlook）────────────────────────
// 表：rrs_securityinfo（无独立后端枚举）
const DICT_RATING_OUTLOOK = {
    '稳定': '稳定',
    '正面': '正面',
    '负面': '负面',
    '发展中': '发展中',
};

// ── 26. 外部评级机构（rating_bond_agency）────────────
// 表：rrs_securityinfo（无独立后端枚举）
const DICT_RATING_AGENCY = {
    '中诚信国际': '中诚信国际',
    '联合资信':   '联合资信',
    '大公国际':   '大公国际',
    '东方金诚':   '东方金诚',
    '新世纪评级': '新世纪评级',
    '标准普尔':   '标准普尔（S&P）',
    '穆迪':       '穆迪（Moody\'s）',
    '惠誉':       '惠誉（Fitch）',
};

// ── 27. 主体内部评级（inner_issuer_rating）───────────────
// 表：rrs_securityinfo（无独立后端枚举）
// 1级最优，10级最差（对应外评 AAA → D）
const DICT_INNER_RATING = {
    '1级': '1级（对应外评 AAA+/AAA）',
    '2级': '2级（对应外评 AA+）',
    '3级': '3级（对应外评 AA）',
    '4级': '4级（对应外评 AA-）',
    '5级': '5级（对应外评 A+/A）',
    '6级': '6级（对应外评 A-/BBB+）',
    '7级': '7级（对应外评 BBB/BBB-）',
    '8级': '8级（对应外评 BB+/BB）',
    '9级': '9级（对应外评 BB-/B）',
    '10级':'10级（对应外评 CCC 及以下）',
};

// ── 28. 证券内部分类（inner_class）─────────────────
// 表：rrs_securityinfo（无独立后端枚举）
const DICT_INNER_CLASS = {
    '央企债': '央企债',
    '国企债': '国企债',
    '城投债': '城投债',
    '金融债': '金融债',
    '民企债': '民企债',
    '科创债': '科创债',
    'ABS':    'ABS',
    '可交换债':'可交换债',
};

// ── 29. 行业分类（industry_name）───────────────────
// 表：rrs_securityinfo（一级行业，无独立后端枚举）
const DICT_INDUSTRY = {
    '金融':     '金融',
    '地产':     '地产',
    '城投':     '城投',
    '制造业':   '制造业',
    '能源':     '能源',
    '交通运输': '交通运输',
    '信息技术': '信息技术',
    '消费':     '消费',
    '医疗':     '医疗',
    '公用事业': '公用事业',
    '建筑':     '建筑',
    '煤炭':     '煤炭',
    '银行':     '银行',
    '贸易':     '贸易',
    '基建':     '基建',
    'AMC':      'AMC（资产管理）',
};

// ── 30. 货币（crncy_code）────────────────────────────────
// 表：rrs_securityinfo（无独立后端枚举）
const DICT_CURRENCY = {
    'CNY': '人民币',
    'USD': '美元',
    'HKD': '港元',
    'EUR': '欧元',
};

// ── 31. 交易场所（市场代码）──────────────────────────────
// 枚举：MarketCode
// 前端规则参数选项、证券信息查询筛选、临时代码市场字段
const DICT_EXCHANGE = {
    'SSE':     '上海证券交易所',
    'SZSE':    '深圳证券交易所',
    'CIBM':    '银行间市场',
    'OTC':     '场外市场',
    'JWCW':    'JWCW 市场',
    'UNKNOWN': '未知市场',
};


// ════════════════════════════════════════════════════════════
// 三、审批流程定义
// ════════════════════════════════════════════════════════════

// ── 32. 流程状态（status）────────────────────────────────
// 枚举：FlowStatus
// 表：wf_flow_definition, wf_flow_version
// 说明：后端枚举仅 draft/active/disabled；archived 为页面历史版本归档语义，
//      后端枚举无此 code（flow_definition.html 实际用法对齐）
const DICT_FLOW_STATUS = {
    'draft':    '草稿',     // 新建未发布（后端枚举 FlowStatus.DRAFT）
    'active':   '已发布',   // 当前生效版本
    'disabled': '已停用',   // 停止使用
    'archived': '已归档',   // 历史版本归档（页面使用，后端枚举无）
};

// flow_status → el-tag type
const DICT_FLOW_STATUS_TAG_TYPE = {
    'draft':    'warning',
    'active':   'success',
    'disabled': 'info',
    'archived': 'info',
};

// ── 33. 流程业务分类（category）──────────────────────────
// 表：wf_flow_definition（无独立后端枚举）
const DICT_FLOW_CATEGORY = {
    'bond':    '债券',
    'stock':   '股票',
    'fund':    '基金',
    'company': '主体',
    'other':   '其他',
};

// ── 34. 节点类型（node_type）─────────────────────────────
// 枚举：NodeType
// 表：wf_flow_node
const DICT_NODE_TYPE = {
    'start':     '开始节点',
    'end':       '结束节点',
    'approval':  '审批节点',
    'condition': '条件判断节点',
    'auto':      '自动执行节点',
    'notify':    '消息通知节点',
};

// ── 35. 节点形状（shape）─────────────────────────────────
// 表：wf_flow_node（无独立后端枚举）
const DICT_NODE_SHAPE = {
    'circle':  '圆形',  // 开始/结束节点
    'rect':    '矩形',  // 审批/自动/通知节点
    'diamond': '菱形',  // 条件判断节点
};

// ── 36. 审批策略（approval_strategy）────────────────────
// 枚举：ApprovalStrategy
// 表：wf_node_approval_config
const DICT_APPROVAL_STRATEGY = {
    'preempt':   '抢占审批（任一人通过即可）',
    'all':       '全部处理（所有人均须处理）',
    'initiator': '流程发起人处理',
};

// ── 37. 自动任务类型（task_code）─────────────────────────
// 表：wf_node_auto_config（无独立后端枚举；FlowService 内 buildTask 已确认存在）
const DICT_AUTO_TASK_CODE = {
    'createAccount':   '创建账号',
    'updatePosition':  '更新持仓',
    'syncSettlement':  '同步清算',
    'riskCheck':       '风控检查',
    'sendNotify':      '发送通知',
    'archiveRecord':   '归档记录',
};

// ── 38. 消息通知对象（notify_target）─────────────────────
// 表：wf_node_notify_config（无独立后端枚举）
const DICT_NOTIFY_TARGET = {
    'initiator': '流程发起人',
    'person':    '指定人员',
};

// ── 39. 条件逻辑（cond_logic）────────────────────────────
// 表：wf_flow_edge（无独立后端枚举）
const DICT_COND_LOGIC = {
    'AND': '且（AND）—— 所有条件同时满足',
    'OR':  '或（OR）—— 任一条件满足即可',
};

// ── 40. 比较运算符（operator）────────────────────────────
// 表：wf_edge_cond_rule（无独立后端枚举）
const DICT_COND_OPERATOR = {
    'eq':  '等于（==）',
    'neq': '不等于（!=）',
    'gt':  '大于（>）',
    'lt':  '小于（<）',
    'gte': '大于等于（>=）',
    'lte': '小于等于（<=）',
};

// ── 41. 条件判断字段（field_code）────────────────────────
// 表：wf_edge_cond_rule（连线条件规则表，无独立后端枚举）
// 分组：审批结果类 / 业务标志类 / 流程变量类
const DICT_FLOW_COND_FIELD = {
    // 审批结果类
    'auditStatus':  '审核状态',
    'auditComment': '审核意见',
    // 业务标志类（布尔值，是/否）
    'isDebtSimple':  '债大库简易流程',
    'isWhitelist':   '白名单流程',
    'isSimple':      '简易流程',
    'isRestricted':  '禁止库标的',
    'isLargeAmount': '大额交易',
    // 流程变量类
    'applyAmount':  '申请金额',
    'creditRating': '标的评级',
    'investType':   '投资类型',
};


// ════════════════════════════════════════════════════════════
// 四、规则引擎
// ════════════════════════════════════════════════════════════

// ── 42. 规则分类（category_code）─────────────────────────
// 表：rule_category（无独立后端枚举）
const DICT_RULE_CATEGORY = {
    'risk':      '风控规则',
    'credit':    '信用评估',
    'pricing':   '定价规则',
    'admission': '准入规则',
    'warning':   '预警规则',
    'other':     '其他',
};

// ── 43. 规则状态（status）────────────────────────────────
// 枚举：RuleStatus
// 表：rule_definition
const DICT_RULE_STATUS = {
    'active':   '已启用',
    'disabled': '已禁用',
};

// ── 44. 参数类型（param_type）────────────────────────────
// 枚举：ParamType
// 表：rule_param
const DICT_RULE_PARAM_TYPE = {
    'string':      '字符串（文本输入框）',
    'number':      '数值（数字输入框）',
    'select':      '单选（下拉框）',
    'multiselect': '多选（多选下拉框）',
};

// ── 45. 测试用例结果（last_result）───────────────────────
// 枚举：TestResult
// 表：rule_test_case
const DICT_TEST_RESULT = {
    'pending': '未执行',
    'running': '执行中',
    'pass':    '通过',
    'fail':    '失败',
};

// ── 46. 执行状态（run_status）────────────────────────────
// 枚举：RunStatus
// 表：rule_test_run
const DICT_RUN_STATUS = {
    'running': '执行中',
    'pass':    '通过',
    'fail':    '失败',
};

// ── 47. 日志类型（log_type）──────────────────────────────
// 枚举：LogType
// 表：rule_test_run_log
const DICT_LOG_TYPE = {
    'info':    '信息',
    'success': '成功',
    'error':   '错误',
};


// ════════════════════════════════════════════════════════════
// 五、临时代码管理
// ════════════════════════════════════════════════════════════

// ── 48. 临时代码状态（status）────────────────────────────
// 枚举：TempStatus
// 表：rrs_temp_security_code.status
const DICT_TEMP_STATUS = {
    'temporary': '临时',
    'updated':   '已更新',
    'cancelled': '已取消',
    'deleted':   '已删除',
};

// ── 49. 临时代码操作类型（operation_type）────────────────
// 枚举：TempOperationType
// 表：rrs_temp_security_code.operation_type
const DICT_TEMP_OPERATION_TYPE = {
    'add':          '新增',
    'update':       '更新',
    'cancel_issue': '取消发行',
    'delete':       '删除',
};


// ════════════════════════════════════════════════════════════
// 六、附件与报告
// ════════════════════════════════════════════════════════════

// ── 50. 附件分类（attachment_category）───────────────────
// 枚举：AttachmentCategory
// 表：sys_attachment.attachment_category
const DICT_ATTACHMENT_CATEGORY = {
    'credit_report_hand': '手工上传信评报告',
    'credit_report_in':   '内部报告库信评报告',
    'credit_report_out':  '外部报告库信评报告',
    'material_hand':      '手工上传其他材料',
    'material_in':        '内部报告库其他材料',
    'material_out':       '外部报告库其他材料',
    'report_in':          '内部报告库附件',
    'report_out':         '外部报告库附件',
};

// ── 51. 附件逻辑用途（attachment_purpose）────────────────
// 枚举：AttachmentPurpose
// 说明：由 sys_attachment.attachment_category 派生，非独立 DB 列
const DICT_ATTACHMENT_PURPOSE = {
    'credit_report': '信评报告',
    'material':      '其他材料',
};

// ── 52. 报告类型（report_type）───────────────────────────
// 枚举：ReportType
// 表：rrs_report_in.report_type
const DICT_REPORT_TYPE = {
    'bond_in_report':  '债券入库报告',
    'bond_out_report': '债券出库报告',
    'fund_in_report':  '基金入库报告',
    'fund_out_report': '基金出库报告',
    'stock_in_report': '股票入库报告',
    'stock_out_report':'股票出库报告',
    'other_report':    '其他报告',
};


// ════════════════════════════════════════════════════════════
// 七、系统通用
// ════════════════════════════════════════════════════════════

// ── 53. 逻辑删除标志（is_deleted）────────────────────────
// 所有主表通用字段
const DICT_IS_DELETED = {
    0: '正常',
    1: '已删除',
};

// ── 54. 启用/停用（enabled）──────────────────────────────
// 表：rule_category, rule_preset_option_set, credit_bond_* 配置表
const DICT_ENABLED = {
    1: '启用',
    0: '停用',
};

// ── 55. 审计事件操作类型（oprt_type）─────────────────────
// 枚举：EventType
// 表：各 _evt 审计表（中英文两套并存）
// 说明：流程模块审计用英文 code，投资池审计用中文 code
const DICT_EVENT_TYPE = {
    // 英文（流程模块审计）
    'INSERT': '新增',
    'UPDATE': '修改',
    'DELETE': '删除',
    // 中文（投资池审计）
    '新增': '新增',
    '修改': '修改',
    '删除': '删除',
    '审核': '审核',
};

// ── 56. 我的证券池状态（status）──────────────────────────
// 表：my_security_pool（无独立后端枚举）
const DICT_MY_SECURITY_STATUS = {
    'use': '关注中',
    'del': '已移除',
};
