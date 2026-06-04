// ============================================================
// znty-sirm 全局字典常量
// 维护说明：所有业务字段的枚举值在此统一维护，前端从此文件读取
// 用法：在 HTML 页面中引入 <script src="dict.js"></script>
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
// 表：ip_adjust_log, ip_pool_status
// 说明：调库申请从提交到最终入池/驳回/撤回的全生命周期状态
const DICT_AUDIT_STATUS = {
    '-1': '无效调整',     // 批量校验不通过，操作中止，流程未正式发起
    '00': '待审核',       // 已提交，等待一级审核人处理
    '10': '一级审核通过', // 一级审核通过，等待二级审批
    '11': '驳回待修改',   // 一级审核驳回，发起人可修改后重新提交
    '20': '审批通过',     // 二级审批通过，证券已入池/已生效
    '21': '审批驳回',     // 二级审批驳回，流程终止
    '99': '已撤回',       // 发起人主动撤回，流程终止
};

// audit_status → el-tag type（用于 <el-tag :type="...">）
const DICT_AUDIT_STATUS_TAG_TYPE = {
    '-1': 'info',
    '00': 'warning',
    '10': 'success',
    '11': 'warning',
    '20': 'success',
    '21': 'danger',
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
    '99': { bg: '#F0F2FA', color: '#8895B8' },
};

// ── 2. 调整方向（adjust_mode）─────────────────────────────
// 表：ip_adjust_log, ip_pool_status
const DICT_ADJUST_MODE = {
    '调入': '调入',
    '调出': '调出',
};

// ── 3. 调整类型（adjust_type）─────────────────────────────
// 表：ip_adjust_log, ip_pool_status
const DICT_ADJUST_TYPE = {
    '手工调整':     '手工调整',     // 单条手工录入
    '联动调整':     '联动调整',     // 入一级库自动联动关联库
    '互斥调整':     '互斥调整',     // 进入某库自动移出互斥库
    '关联调整':     '关联调整',     // 因关联关系触发的调整
    'Excel导入':    'Excel导入',    // 批量 Excel 文件导入
    '手动批量调整': '手动批量调整', // 手动批量操作（可触发校验中止）
};

// ── 4. 投资池类型（pool_type）─────────────────────────────
// 表：ip_investment_pool, ip_adjust_log, ip_pool_status
const DICT_POOL_TYPE = {
    'credit_bond':       '信用债',   // 信用债大库及子库（一至五级库）
    'offshore_bond':     '境外债',   // 境外债库
    'convertible_bond':  '转债',     // 可转债/可交换债库
    'special_account':   '专户产品', // 专户产品库及子库
    'forbidden':         '禁投池',   // 禁止交易池
    'research':          '研究池',
    'fund':              '基金池',
    'restricted':        '限制池',
    'industry':          '行业池',
    'whitelist':         '白名单',
    'blacklist':         '黑名单',
    'private_placement': '私募池',
    'other':             '其他',
};

// ── 5. 投资池层级（pool_level）────────────────────────────
// 表：ip_investment_pool
const DICT_POOL_LEVEL = {
    1: '顶级池',   // 一级目录，如"信用债大库"、"禁投池"
    2: '子级池',   // 叶子节点，如"一级库"、"二级库"
};

// ── 6. 投资池启用状态（status）────────────────────────────
// 表：ip_investment_pool
const DICT_POOL_ENABLED_STATUS = {
    'enabled':  '启用',
    'disabled': '停用',
};

// ── 7. 投资池关系类型（relation_type）────────────────────
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

// ── 8. 自动调整规则类型（rule_type）──────────────────────
// 表：ip_pool_auto_rule
const DICT_POOL_AUTO_RULE_TYPE = {
    'auto_in':  '自动调入',
    'auto_out': '自动调出',
};

// ── 9. 权限类型（permission_type）────────────────────────
// 表：ip_pool_permission
const DICT_POOL_PERMISSION_TYPE = {
    'viewable':         '可查看',
    'adjustable':       '可调整',     // 可发起调库申请
    'excel_importable': '可Excel导入',
};

// ── 10. 权限主体类型（subject_type）──────────────────────
// 表：ip_pool_permission
const DICT_PERMISSION_SUBJECT_TYPE = {
    'role': '角色',
    'user': '人员',
};

// ── 11. 研报限制（in_report_restriction / out_report_restriction）
// 表：ip_investment_pool
const DICT_REPORT_RESTRICTION = {
    'none':     '不限制研究报告',
    'any':      '任意一篇研究报告',
    'internal': '必须是内部研究报告',
};

// ── 12. 证券存续状态（bond_status）───────────────────────
// 前端查询条件，根据到期日与当前日期比较计算
// 注意：security_pool_adjust_history/forbidden_pool_query 使用中文值，
//       security_pool_query 使用英文值，建议统一为英文值
const DICT_BOND_STATUS = {
    'active':  '存续',
    'matured': '到期',
};


// ════════════════════════════════════════════════════════════
// 二、证券信息
// ════════════════════════════════════════════════════════════

// ── 13. 证券类型——整数码（d_security_type）────────────────
// 表：sirm_securityinfo（字段 d_security_type）
// 说明：证券基础信息表中的整数类型码
const DICT_SECURITY_TYPE_INT = {
    1: '中期票据',
    2: '公司债',
    3: '可交换债',
    4: '商业银行债',
    5: '短期融资券',
    6: '资产支持证券',
    7: '超短期融资券',
};

// ── 14. 证券类型——字符串码（security_type）───────────────
// 表：ip_adjust_log, ip_pool_status（字段 security_type）
// 表：dict_security_type（字段 security_type）
// 大类 bond=债券 / stock=股票 / fund=基金 / company=公司主体
const DICT_SECURITY_TYPE_STR = {
    // 债券
    'treasury_bond':    '国债',
    'local_gov_bond':   '地方政府债',
    'financial_bond':   '金融债',
    'enterprise_bond':  '企业债',
    'company_bond':     '公司债',
    'mtn':              '中期票据',
    'cp':               '短期融资券',
    'scp':              '超短期融资券',
    'ncd':              '同业存单',
    'convertible_bond': '可转债',
    'exchangeable_bond':'可交换债',
    'subordinated_bond':'次级债',
    'bank_bond':        '商业银行债',
    'abs':              '资产支持证券',
    // 股票
    'a_share':          'A股',
    'b_share':          'B股',
    's_share':          'S股',
    'h_share':          '港股',
    // 基金
    'etf_fund':         'ETF基金',
    'lof_fund':         'LOF基金',
    'closed_fund':      '封闭式基金',
    // 公司主体
    'company':          '公司主体',
};

// ── 15. 证券大类（category_type）─────────────────────────
// 表：dict_security_type
const DICT_SECURITY_CATEGORY = {
    'bond':    '债券',
    'stock':   '股票',
    'fund':    '基金',
    'company': '公司主体',
};

// ── 16. 利率类型（b_info_interesttype）───────────────────
// 表：sirm_securityinfo
const DICT_INTEREST_TYPE = {
    '固定利率': '固定利率',
    '浮动利率': '浮动利率', // 基准利率 + 固定利差，如 SHIBOR+spread
    '累进利率': '累进利率', // 利率随时间递增，常见于可转/可交换债
    '零息债':   '零息债',   // 不付息，折价发行
};

// ── 17. 付息频率（b_info_interestfrequency）──────────────
// 表：sirm_securityinfo
const DICT_INTEREST_FREQUENCY = {
    '按年付息':         '按年付息',
    '按半年付息':       '按半年付息',
    '按季付息':         '按季付息',
    '按月付息':         '按月付息',
    '到期一次还本付息': '到期一次还本付息', // 短融/超短融/零息债
};

// ── 18. 发行方式（b_info_issuetype）──────────────────────
// 表：sirm_securityinfo
const DICT_ISSUE_TYPE = {
    '公开发行':   '公开发行',
    '非公开发行': '非公开发行', // PPN、私募债等
    '簿记建档':   '簿记建档',   // ABS 等结构化产品常用
};

// ── 19. 主体类型/公司性质（s_info_comptype）──────────────
// 表：sirm_securityinfo
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

// ── 20. 外部评级（rating_security / rating_securityissuer）
// 表：sirm_securityinfo
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

// ── 21. 评级展望（rating_outlook）────────────────────────
// 表：sirm_securityinfo
const DICT_RATING_OUTLOOK = {
    '稳定': '稳定',
    '正面': '正面',
    '负面': '负面',
    '发展中': '发展中',
};

// ── 22. 外部评级机构（rating_security_agency）────────────
// 表：sirm_securityinfo
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

// ── 23. 主体内部评级（inner_issuer_rating）───────────────
// 表：sirm_securityinfo
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

// ── 24. 证券内部分类（s_info_innerclass）─────────────────
// 表：sirm_securityinfo
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

// ── 25. 行业分类（s_info_industryname）───────────────────
// 表：sirm_securityinfo（一级行业）
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

// ── 26. 货币（crncy_code）────────────────────────────────
// 表：sirm_securityinfo
const DICT_CURRENCY = {
    'CNY': '人民币',
    'USD': '美元',
    'HKD': '港元',
    'EUR': '欧元',
};

// ── 27. 交易场所（市场代码）──────────────────────────────
// 前端规则参数选项、证券信息查询筛选
const DICT_EXCHANGE = {
    '银行间': '银行间市场（CIBM）',
    '上交所': '上海证券交易所（SSE）',
    '深交所': '深圳证券交易所（SZSE）',
    '北交所': '北京证券交易所（BSE）',
    'OTC':    '场外柜台（OTC）',
};


// ════════════════════════════════════════════════════════════
// 三、审批流程定义
// ════════════════════════════════════════════════════════════

// ── 28. 流程状态（status）────────────────────────────────
// 表：wf_flow_definition, wf_flow_version
const DICT_FLOW_STATUS = {
    'draft':    '草稿',   // 新建未发布
    'active':   '已发布', // 当前生效版本
    'disabled': '已停用', // 停止使用
};

// flow_status → el-tag type
const DICT_FLOW_STATUS_TAG_TYPE = {
    'draft':    'info',
    'active':   'success',
    'disabled': 'danger',
};

// ── 29. 流程业务分类（category）──────────────────────────
// 表：wf_flow_definition
const DICT_FLOW_CATEGORY = {
    'bond':   '利率债',
    'credit': '信用债',
    'fund':   '基金',
    'other':  '其他',
};

// ── 30. 节点类型（node_type）─────────────────────────────
// 表：wf_flow_node
const DICT_NODE_TYPE = {
    'start':     '开始节点',
    'end':       '结束节点',
    'approval':  '审批节点',
    'condition': '条件判断节点',
    'auto':      '自动执行节点',
    'notify':    '消息通知节点',
};

// ── 31. 节点形状（shape）─────────────────────────────────
// 表：wf_flow_node
const DICT_NODE_SHAPE = {
    'circle':  '圆形',  // 开始/结束节点
    'rect':    '矩形',  // 审批/自动/通知节点
    'diamond': '菱形',  // 条件判断节点
};

// ── 32. 审批策略（approval_strategy）────────────────────
// 表：wf_node_approval_config
const DICT_APPROVAL_STRATEGY = {
    'preempt':   '抢占审批（任一人通过即可）',
    'all':       '全部处理（所有人均须处理）',
    'initiator': '流程发起人处理',
};

// ── 33. 自动任务类型（task_code）─────────────────────────
// 表：wf_node_auto_config
const DICT_AUTO_TASK_CODE = {
    'createAccount':   '创建账号',
    'updatePosition':  '更新持仓',
    'syncSettlement':  '同步清算',
    'riskCheck':       '风控检查',
    'sendNotify':      '发送通知',
    'archiveRecord':   '归档记录',
};

// ── 34. 消息通知对象（notify_target）─────────────────────
// 表：wf_node_notify_config
const DICT_NOTIFY_TARGET = {
    'initiator': '流程发起人',
    'person':    '指定人员',
};

// ── 35. 条件逻辑（cond_logic）────────────────────────────
// 表：wf_flow_edge
const DICT_COND_LOGIC = {
    'AND': '且（AND）—— 所有条件同时满足',
    'OR':  '或（OR）—— 任一条件满足即可',
};

// ── 36. 比较运算符（operator）────────────────────────────
// 表：wf_edge_cond_rule
const DICT_COND_OPERATOR = {
    'eq':  '等于（==）',
    'neq': '不等于（!=）',
    'gt':  '大于（>）',
    'lt':  '小于（<）',
    'gte': '大于等于（>=）',
    'lte': '小于等于（<=）',
};

// ── 37. 条件判断字段（field_code）────────────────────────
// 表：wf_edge_cond_rule（连线条件规则表）
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

// ── 38. 规则分类（category_code）─────────────────────────
// 表：rule_category
const DICT_RULE_CATEGORY = {
    'risk':      '风控规则',
    'credit':    '信用评估',
    'pricing':   '定价规则',
    'admission': '准入规则',
    'warning':   '预警规则',
    'other':     '其他',
};

// ── 39. 规则状态（status）────────────────────────────────
// 表：rule_definition
const DICT_RULE_STATUS = {
    'active':   '启用',
    'disabled': '禁用',
};

// ── 40. 参数类型（param_type）────────────────────────────
// 表：rule_param
const DICT_RULE_PARAM_TYPE = {
    'string':      '字符串（文本输入框）',
    'number':      '数值（数字输入框）',
    'select':      '单选（下拉框）',
    'multiselect': '多选（多选下拉框）',
};

// ── 41. 测试用例结果（last_result）───────────────────────
// 表：rule_test_case
const DICT_TEST_RESULT = {
    'pending': '待执行',
    'running': '执行中',
    'pass':    '通过',
    'fail':    '失败',
};

// ── 42. 执行状态（run_status）────────────────────────────
// 表：rule_test_run
const DICT_RUN_STATUS = {
    'running': '执行中',
    'pass':    '通过',
    'fail':    '失败',
};

// ── 43. 日志类型（log_type）──────────────────────────────
// 表：rule_test_run_log
const DICT_LOG_TYPE = {
    'info':    '信息',
    'success': '成功',
    'error':   '错误',
};


// ════════════════════════════════════════════════════════════
// 五、系统通用
// ════════════════════════════════════════════════════════════

// ── 44. 逻辑删除标志（is_deleted）────────────────────────
// 所有主表通用字段
const DICT_IS_DELETED = {
    0: '正常',
    1: '已删除',
};

// ── 45. 启用/停用（enabled）──────────────────────────────
// 表：rule_category, rule_preset_option_set
const DICT_ENABLED = {
    1: '启用',
    0: '停用',
};

// ── 46. 我的证券池状态（status）──────────────────────────
// 表：my_security_pool
const DICT_MY_SECURITY_STATUS = {
    'use': '关注中',
    'del': '已移除',
};
