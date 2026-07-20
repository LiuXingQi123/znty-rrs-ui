# 前端页面与样式功能清单

本文档记录前端 HTML 页面、CSS 样式文件及其对应的业务功能。新增、删除或重命名页面和样式文件时，应同步更新本清单。

## HTML 页面

| HTML 文件 | 功能名称 | 对应 CSS |
| --- | --- | --- |
| `batch_security_pool_adjust.html` | 证券池批量调整 | `css/batch_security_pool_adjust.css`、`css/common.css` |
| `company_pool_adjust_history.html` | 主体池调整历史查询 | `css/company_pool_adjust_history.css`、`css/common.css` |
| `company_pool_query.html` | 主体池查询 | `css/company_pool_query.css`、`css/common.css` |
| `credit_bond_grade_rule.html` | 主体内评分档规则 | `css/credit_bond_grade_rule.css`、`css/common.css` |
| `crmw_pool_adjust.html` | CRMW池调整 | `css/crmw_pool_adjust.css`、`css/common.css` |
| `crmw_pool_adjust_approve.html` | CRMW池调库审核 | `css/crmw_pool_adjust_approve.css`、`css/common.css` |
| `crmw_pool_adjust_detail.html` | CRMW池调库详情 | `css/crmw_pool_adjust_detail.css`、`css/common.css` |
| `crmw_pool_adjust_history.html` | CRMW池调整历史查询 | `css/crmw_pool_adjust_history.css`、`css/common.css` |
| `crmw_pool_query.html` | CRMW池查询 | `css/crmw_pool_query.css`、`css/common.css` |
| `flow_definition.html` | 流程定义 - 工作流平台 | `css/flow_definition.css`、`css/common.css` |
| `forbidden_pool_adjust.html` | 禁投池调整 | `css/forbidden_pool_adjust.css`、`css/common.css` |
| `forbidden_pool_adjust_approve.html` | 禁投池调整审核 | `css/forbidden_pool_adjust_approve.css`、`css/common.css` |
| `forbidden_pool_adjust_detail.html` | 禁投池调整详情 | `css/forbidden_pool_adjust_detail.css`、`css/common.css` |
| `forbidden_pool_history.html` | 禁投池历史查询 | `css/forbidden_pool_history.css`、`css/common.css` |
| `forbidden_pool_query.html` | 禁投池查询 | `css/forbidden_pool_query.css`、`css/common.css` |
| `index.html` | RRS 菜单工作台 | `css/index.css` |
| `investment_pool.html` | 投资池维护 | `css/investment_pool.css`、`css/common.css` |
| `login.html` | 前端演示登录 | `css/login.css` |
| `my_matters.html` | 我的事宜 | `css/my_matters.css`、`css/common.css` |
| `rule_manager.html` | 规则管理中心 | `css/rule_manager.css`、`css/common.css` |
| `security_pool_adjust.html` | 证券池调库 | `css/security_pool_adjust.css`、`css/common.css` |
| `security_pool_adjust_approve.html` | 证券池调库审核 | `css/security_pool_adjust_approve.css`、`css/common.css` |
| `security_pool_adjust_detail.html` | 证券池调库详情 | `css/security_pool_adjust_detail.css`、`css/common.css` |
| `security_pool_adjust_history.html` | 证券池调整历史 | `css/security_pool_adjust_history.css`、`css/common.css` |
| `security_pool_query.html` | 证券池查询 | `css/security_pool_query.css`、`css/common.css` |
| `temp_security_code.html` | 临时代码管理 | `css/temp_security_code.css`、`css/common.css` |
| `pool_open_day.html` | 投资池开放日维护 | `css/pool_open_day.css`、`css/common.css` |
| `docs/script_tool.html` | 数据初始化 | `css/script_tool.css`、`css/common.css` |
| `docs/script_table_clear.html` | 表数据清空 | `css/script_table_clear.css`、`css/common.css` |
| `docs/script_overview.html` | 脚本总览 | `css/script_overview.css`、`css/common.css` |
| `docs/script_health_check.html` | 环境检查 | `css/script_health_check.css`、`css/common.css` |
| `docs/script_schema_diff.html` | 数据库结构差异检查 | `css/script_schema_diff.css`、`css/common.css` |
| `docs/script_data_integrity.html` | 业务数据完整性检查 | `css/script_data_integrity.css`、`css/common.css` |
| `docs/script_module_reset.html` | 模块重置 | `css/script_module_reset.css`、`css/common.css` |
| `docs/script_demo_scene.html` | 场景生成 | `css/script_demo_scene.css`、`css/common.css` |
| `docs/business-issues-overview.html` | 业务问题总览 | HTML 内联样式 |
| `docs/hardcoded-validation-audit.html` | 写死值与校验缺口 | HTML 内联样式 |
| `docs/validation-comparison-audit.html` | 调库校验新旧对比 | HTML 内联样式 |
| `docs/flow-type-comparison-audit.html` | 调库流程类型对比 | HTML 内联样式 |
| `docs/query-scope-old-new-comparison.html` | 查询范围新老差异 | HTML 内联样式 |
| `docs/temp-security-code-old-new-comparison.html` | 临时代码管理新老对比 | HTML 内联样式 |
| `docs/security-pool-adjust-old-new-comparison.html` | 证券池调整新老对比 | HTML 内联样式 |
| `docs/batch-security-pool-adjust-old-new-comparison.html` | 证券池批量调整新老对比 | HTML 内联样式 |
| `docs/security-pool-query-old-new-comparison.html` | 证券池查询新老对比 | HTML 内联样式 |
| `docs/security-pool-adjust-history-old-new-comparison.html` | 证券池调整历史新老对比 | HTML 内联样式 |
| `docs/forbidden-pool-adjust-old-new-comparison.html` | 禁投池调整新老对比 | HTML 内联样式 |
| `docs/forbidden-pool-query-old-new-comparison.html` | 禁投池查询新老对比 | HTML 内联样式 |
| `docs/forbidden-pool-history-old-new-comparison.html` | 禁投池历史新老对比 | HTML 内联样式 |
| `docs/company-pool-query-old-new-comparison.html` | 主体池查询新老对比 | HTML 内联样式 |
| `docs/company-pool-adjust-history-old-new-comparison.html` | 主体池调整历史新老对比 | HTML 内联样式 |
| `docs/crmw-pool-adjust-old-new-comparison.html` | CRMW池调整新老对比 | HTML 内联样式 |
| `docs/crmw-pool-query-old-new-comparison.html` | CRMW池查询新老对比 | HTML 内联样式 |
| `docs/crmw-pool-adjust-history-old-new-comparison.html` | CRMW池调整历史新老对比 | HTML 内联样式 |
| `docs/my-matters-old-new-comparison.html` | 我的事宜新老对比 | HTML 内联样式 |
| `docs/security-pool-adjust-approve-old-new-comparison.html` | 证券池调库审核新老对比 | HTML 内联样式 |
| `docs/security-pool-adjust-detail-old-new-comparison.html` | 证券池调库详情新老对比 | HTML 内联样式 |
| `docs/forbidden-pool-adjust-approve-old-new-comparison.html` | 禁投池调整审核新老对比 | HTML 内联样式 |
| `docs/forbidden-pool-adjust-detail-old-new-comparison.html` | 禁投池调整详情新老对比 | HTML 内联样式 |
| `docs/crmw-pool-adjust-approve-old-new-comparison.html` | CRMW池调库审核新老对比 | HTML 内联样式 |
| `docs/crmw-pool-adjust-detail-old-new-comparison.html` | CRMW池调库详情新老对比 | HTML 内联样式 |
| `docs/investment-pool-old-new-comparison.html` | 投资池维护新老对比 | HTML 内联样式 |
| `docs/pool-open-day-old-new-comparison.html` | 投资池开放日维护新老对比 | HTML 内联样式 |
| `docs/flow-definition-old-new-comparison.html` | 流程定义新老对比 | HTML 内联样式 |
| `docs/rule-manager-old-new-comparison.html` | 规则管理中心新老对比 | HTML 内联样式 |
| `docs/credit-bond-grade-rule-old-new-comparison.html` | 主体内评分档规则新老对比 | HTML 内联样式 |
| `docs/bond-link-audit.html` | 老项目债券池调库链路梳理 | HTML 内联样式 |
| `docs/full-comparison-audit.html` | 新老系统调库全量对比 | HTML 内联样式 |
| `docs/security-pool-link-audit.html` | 证券池单笔调库体检 | HTML 内联样式 |
| `docs/batch-security-pool-link-audit.html` | 证券池批量调整体检 | HTML 内联样式 |
| `docs/forbidden-pool-link-audit.html` | 禁投池调整体检 | HTML 内联样式 |
| `docs/crmw-pool-link-audit.html` | CRMW池调整体检 | HTML 内联样式 |
| `docs/query-history-audit.html` | 查询与历史口径体检 | HTML 内联样式 |
| `docs/approval-matters-audit.html` | 审批与我的事宜体检 | HTML 内联样式 |
| `docs/investment-pool-permission-audit.html` | 投资池与权限体检 | HTML 内联样式 |
| `docs/workflow-engine-audit.html` | 流程定义与流转体检 | HTML 内联样式 |
| `docs/rule-rating-temp-audit.html` | 规则评级与临时代码体检 | HTML 内联样式 |
| `docs/attachment-report-audit.html` | 附件与报告体检 | HTML 内联样式 |
| `docs/data-consistency-performance-audit.html` | 数据一致性与性能体检 | HTML 内联样式 |
| `docs/business-acceptance-matrix.html` | 全业务验收矩阵 | HTML 内联样式 |

## CSS 样式

| CSS 文件 | 功能名称 | 适用页面 |
| --- | --- | --- |
| `css/batch_security_pool_adjust.css` | 证券池批量调整页面样式 | `batch_security_pool_adjust.html` |
| `css/common.css` | 全站公共基础样式 | 全部 HTML 页面 |
| `css/company_pool_adjust_history.css` | 主体池调整历史查询页面样式 | `company_pool_adjust_history.html` |
| `css/company_pool_query.css` | 主体池查询页面样式 | `company_pool_query.html` |
| `css/credit_bond_grade_rule.css` | 主体内评分档规则页面样式 | `credit_bond_grade_rule.html` |
| `css/crmw_pool_adjust.css` | CRMW池调整页面样式 | `crmw_pool_adjust.html` |
| `css/crmw_pool_adjust_approve.css` | CRMW池调库审核页面样式 | `crmw_pool_adjust_approve.html` |
| `css/crmw_pool_adjust_detail.css` | CRMW池调库详情页面样式 | `crmw_pool_adjust_detail.html` |
| `css/crmw_pool_adjust_history.css` | CRMW池调整历史查询页面样式 | `crmw_pool_adjust_history.html` |
| `css/crmw_pool_query.css` | CRMW池查询页面样式 | `crmw_pool_query.html` |
| `css/flow_definition.css` | 流程定义页面样式 | `flow_definition.html` |
| `css/forbidden_pool_adjust.css` | 禁投池调整页面样式 | `forbidden_pool_adjust.html` |
| `css/forbidden_pool_adjust_approve.css` | 禁投池调整审核页面样式 | `forbidden_pool_adjust_approve.html` |
| `css/forbidden_pool_adjust_detail.css` | 禁投池调整详情页面样式 | `forbidden_pool_adjust_detail.html` |
| `css/forbidden_pool_history.css` | 禁投池历史查询页面样式 | `forbidden_pool_history.html` |
| `css/forbidden_pool_query.css` | 禁投池查询页面样式 | `forbidden_pool_query.html` |
| `css/index.css` | RRS 菜单工作台样式 | `index.html` |
| `css/investment_pool.css` | 投资池维护页面样式 | `investment_pool.html` |
| `css/login.css` | 前端演示登录页面样式 | `login.html` |
| `css/my_matters.css` | 我的事宜页面样式 | `my_matters.html` |
| `css/rule_manager.css` | 规则管理中心页面样式 | `rule_manager.html` |
| `css/security_pool_adjust.css` | 证券池调库页面样式 | `security_pool_adjust.html` |
| `css/security_pool_adjust_approve.css` | 证券池调库审核页面样式 | `security_pool_adjust_approve.html` |
| `css/security_pool_adjust_detail.css` | 证券池调库详情页面样式 | `security_pool_adjust_detail.html` |
| `css/security_pool_adjust_history.css` | 证券池调整历史页面样式 | `security_pool_adjust_history.html` |
| `css/security_pool_query.css` | 证券池查询页面样式 | `security_pool_query.html` |
| `css/script_demo_scene.css` | 场景生成页面样式 | `docs/script_demo_scene.html` |
| `css/script_health_check.css` | 环境检查页面样式 | `docs/script_health_check.html` |
| `css/script_schema_diff.css` | 数据库结构差异检查页面样式 | `docs/script_schema_diff.html` |
| `css/script_data_integrity.css` | 业务数据完整性检查页面样式 | `docs/script_data_integrity.html` |
| `css/script_module_reset.css` | 模块重置页面样式 | `docs/script_module_reset.html` |
| `css/script_overview.css` | 脚本总览页面样式 | `docs/script_overview.html` |
| `css/script_table_clear.css` | 表数据清空页面样式 | `docs/script_table_clear.html` |
| `css/script_tool.css` | 数据初始化页面样式 | `docs/script_tool.html` |
| `css/temp_security_code.css` | 临时代码管理页面样式 | `temp_security_code.html` |
| `css/pool_open_day.css` | 投资池开放日维护页面样式 | `pool_open_day.html` |

## 业务文档页面

业务文档按用户要求将 CSS 内联在各 HTML 中，不引用独立页面样式文件。

| HTML 文件 | 功能名称 | 对应 CSS |
| --- | --- | --- |
| `docs/module-tables-index.html` | 业务文档总览 | HTML 内联样式 |
| `docs/security-pool-adjust-flow-tables.html` | 证券池调整文档 | HTML 内联样式 |
| `docs/batch-security-pool-adjust-tables.html` | 证券池批量调整文档 | HTML 内联样式 |
| `docs/security-pool-query-tables.html` | 证券池查询文档 | HTML 内联样式 |
| `docs/security-pool-adjust-history-tables.html` | 证券池调整历史文档 | HTML 内联样式 |
| `docs/temp-security-code-tables.html` | 临时代码管理文档 | HTML 内联样式 |
| `docs/forbidden-pool-adjust-tables.html` | 禁投池调整文档 | HTML 内联样式 |
| `docs/forbidden-pool-query-tables.html` | 禁投池查询文档 | HTML 内联样式 |
| `docs/forbidden-pool-history-tables.html` | 禁投池历史文档 | HTML 内联样式 |
| `docs/company-pool-query-tables.html` | 主体池查询文档 | HTML 内联样式 |
| `docs/company-pool-adjust-history-tables.html` | 主体池调整历史文档 | HTML 内联样式 |
| `docs/crmw-pool-adjust-tables.html` | CRMW池调整文档 | HTML 内联样式 |
| `docs/crmw-pool-query-tables.html` | CRMW池查询文档 | HTML 内联样式 |
| `docs/crmw-pool-adjust-history-tables.html` | CRMW池调整历史文档 | HTML 内联样式 |
| `docs/my-matters-tables.html` | 我的事宜文档 | HTML 内联样式 |
| `docs/security-pool-adjust-approve-tables.html` | 证券池调库审核文档 | HTML 内联样式 |
| `docs/security-pool-adjust-detail-tables.html` | 证券池调库详情文档 | HTML 内联样式 |
| `docs/forbidden-pool-adjust-approve-tables.html` | 禁投池调整审核文档 | HTML 内联样式 |
| `docs/forbidden-pool-adjust-detail-tables.html` | 禁投池调整详情文档 | HTML 内联样式 |
| `docs/crmw-pool-adjust-approve-tables.html` | CRMW池调库审核文档 | HTML 内联样式 |
| `docs/crmw-pool-adjust-detail-tables.html` | CRMW池调库详情文档 | HTML 内联样式 |
| `docs/investment-pool-tables.html` | 投资池维护文档 | HTML 内联样式 |
| `docs/flow-definition-tables.html` | 流程定义文档 | HTML 内联样式 |
| `docs/rule-manager-tables.html` | 规则管理中心文档 | HTML 内联样式 |
| `docs/credit-bond-grade-rule-tables.html` | 主体内评分档规则文档 | HTML 内联样式 |
