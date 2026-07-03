# 兴业基金智能投研平台-前端视觉规范报告

> 本报告基于 `D:\my-project-all\znty-rrs-slice` 下的核心规范包与业务页面切图整理，面向 `znty-sirm-ui` 后续 Vue2 + ElementUI 页面改造、组件复用和 AI 批量生成。实现时应优先遵循本文档，不再引入新的视觉语言。

## 1. 分析范围与整体结论

### 1.1 分析对象

本次分析覆盖以下切图包：

| 模块 | 视觉侧重点 |
|---|---|
| 兴业基金PC规范260313-研发版 | 色彩、字体、按钮、标题、表格、标签、图标等核心 Design System |
| 兴业基金智能投研平台-内部排名总览切图260305 | 多维排名、复杂表头、高密度金融表格 |
| 兴业基金智能投研平台-内评计算切图 | 内部评级、得分计算、审核、导入、详情 |
| 兴业基金智能投研平台-实盘收益切图260304 | 实盘收益、推荐收益、正负收益数据、图表 |
| 兴业基金智能投研平台-研报检索切图260304 | 搜索、筛选、多选下拉、研报结果列表 |
| 兴业基金智能投研平台-重点推荐切图260304 | 重点推荐、个股追踪、研报推荐、业务强调卡片 |

抽样统计结果显示：颜色高频集中在 `#E5E5E5`、`#FFFFFF`、`#3F485A`、`#2743A4`、`#242933`、`#F7F8FA`；字号高频集中在 `13px`、`14px`、`12px`、`16px`；高度高频集中在 `32px`、`22px`、`16px`、`24px`、`40px`；圆角以 `4px` 为主。

### 1.2 产品气质

整体风格是典型金融投研 B 端系统：

| 关键词 | 设计表现 |
|---|---|
| 稳重 | 深金融蓝作为主色，低饱和蓝灰文字，避免高亮娱乐化配色 |
| 高密度 | 32px 表格行、13px 单元格文字、紧凑筛选栏 |
| 数据优先 | 表格、指标、排名、收益率是第一视觉层级 |
| 克制 | 大面积白底和浅灰底，少阴影，细边框分割 |
| 品牌感 | 深蓝为主，金色用于分类标题、排名、重点推荐等高级强调 |

后续页面不要做营销式大留白、渐变大背景、装饰性卡片堆叠或强插画风格。应保持“白色内容面板 + 浅灰页面底 + 深蓝操作色 + 高密度表格”的系统感。

## 2. 金融级色彩系统

### 2.1 品牌主色

| Token | Hex | 用途 |
|---|---|---|
| 主品牌蓝 | `#2743A4` | 主按钮、文字按钮、链接、菜单选中、Tabs 激活、筛选选中态 |
| 品牌深蓝 | `#1F3683` | hover / active、深色选中态、按钮按下态 |
| 品牌浅蓝底 | `#E9ECF6` | 菜单 hover、按钮组选中背景、浅色标签、弱选中状态 |
| 图表辅助蓝 | `#4D6CA0` | 图表线条、弱品牌辅助色、浅蓝透明背景 |

主色不是 ElementUI 默认的 `#409EFF`，后续必须覆盖为 `#2743A4`。

### 2.2 功能色与金融涨跌色

本切图体系中红、绿均有出现。按国内基金/证券业务习惯，建议统一为“上涨红、下跌绿”；若页面文案是“成功/通过/正向状态”，再使用成功绿。

| 语义 | Hex | 使用场景 |
|---|---|---|
| 上涨 / 正收益红 | `#FF4542` | 收益率为正、涨幅、风险警示中的强红、危险操作 |
| 下跌 / 负收益绿 | `#06C687` | 收益率为负、跌幅、行情下行数据 |
| 成功绿 | `#32CD32` | 审核通过、计算成功、图表正向状态 |
| 成功浅底 | `#E7F9F3` | 成功标签背景 |
| 警告黄 | `#FFC802` | 待处理、预警、提示 |
| 警告浅底 | `#FFF4CC` | 警告标签背景 |
| 危险浅底 | `#FFEDEC` | 错误、拒绝、删除确认标签背景 |
| 橙色业务状态 | `#F5822E` | 中性提醒、评级状态、阶段性业务标签 |
| 推荐强调 | `#F97A6D` | 重点推荐、推荐理由、特殊业务强调 |
| 金色强调 | `#D1A777` | 排名、评级、分类标题竖条、重点模块强调 |
| 金色文字 | `#A7865F` | 金色浅底上的文字、等级类说明 |

### 2.3 中性色

| 语义 | Hex | 使用场景 |
|---|---|---|
| 页面背景 | `#F7F8FA` | 页面底、表头底、浅灰分区 |
| 内容面板 | `#FFFFFF` | 卡片、表格、弹窗、输入框 |
| 一级文字 | `#242933` | 页面标题、模块标题、表头、强正文 |
| 正文文字 | `#3F485A` | 表格正文、表单值、普通说明 |
| 次级文字 | `#707783` | 次要正文、字段说明 |
| 弱提示文字 | `#9199BD` | placeholder、图表轴线文字、辅助提示 |
| 边框分割线 | `#E5E5E5` | 表格线、输入框边框、面板分割 |
| 弱禁用底 | `#F6F6F6` | 禁用标签、弱按钮背景 |
| 禁用文字 | `#CCCCCC` | 禁用态文本、禁用图标 |

### 2.4 色彩使用原则

- 页面 70% 以上面积应由 `#F7F8FA` 和 `#FFFFFF` 承担。
- 操作色只使用 `#2743A4`，不要混入 ElementUI 默认蓝。
- 表格边框优先用 `#E5E5E5`，不要使用过深灰线。
- 金色只用于业务强调，不要作为大面积背景。
- 状态色必须有明确业务语义，不要为了装饰而使用红、绿、黄。

## 3. 基金/投研特化排版

### 3.1 字体家族

切图中主字体为 `PingFang SC`，少量规范标题使用 `Source Han Sans CN`。前端实现建议：

```css
font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

数字展示不需要强制等宽字体，但收益率、排名、净值、分数等需要右对齐或小数点视觉对齐。若后续封装数字组件，可对纯数字使用：

```css
font-variant-numeric: tabular-nums;
```

### 3.2 字号层级

| 层级 | 字号 | 行高 | 字重 | 场景 |
|---|---:|---:|---:|---|
| 页面大标题 | `20px` / `22px` | `28px` / `30px` | `600` | 页面标题、一级业务标题 |
| 指标大数字 | `24px` / `28px` | `32px` / `34px` | `600` | 收益率、排名、评分、核心 KPI |
| 模块标题 | `16px` | `24px` | `600` | 卡片标题、分类标题、详情区块标题 |
| 常规正文 | `14px` | `22px` | `400` | 表单、按钮、筛选项、普通说明 |
| 表格文字 | `13px` | `21px` / `22px` | `400` | 表格单元格 |
| 表头文字 | `13px` | `21px` / `22px` | `600` | 表头字段、复杂表头 |
| 弱提示/小标签 | `12px` | `20px` | `400` | 小型切换、标签、辅助提示 |

### 3.3 数字展示规则

- 收益率、排名、得分等关键数字可提升到 `24px` 或 `28px`，颜色跟随业务状态。
- 表格内数字保持 `13px`，右对齐；百分比、小数、金额字段保持同列小数位一致。
- 排名类数字可用主蓝或金色强调，但不要每列都高亮。
- 负数和正数不要用默认黑色混排，必须通过红/绿或业务标签表达方向。

## 4. 投研组件风格定制

### 4.1 表格 el-table

表格是本系统最核心组件，应优先保证扫描效率。

| 属性 | 规范 |
|---|---|
| 表头背景 | `#F7F8FA` |
| 表头文字 | `13px / 600 / #242933` |
| 表体文字 | `13px / 400 / #3F485A` |
| 行高 | 推荐 `32px`，复杂表格可 `36px` |
| 单元格 padding | 横向 `8px`，纵向按行高压缩 |
| 边框 | `1px solid #E5E5E5` |
| hover 行 | `#F7F8FA` 或 `#E9ECF6` 的弱化版本 |
| 斑马纹 | 不作为默认；如数据量大，可用 `#FAFBFC` 极浅底 |
| 操作列 | 文字按钮 `#2743A4`，危险操作 `#FF4542` |

实现建议：

- 多维排名、内评计算、实盘收益明细使用 `border` 表格。
- 表头支持排序图标时，图标尺寸以 `14px` 为主。
- 固定列阴影要轻，避免强烈投影；可用 `rgba(0,0,0,0.07)`。
- 不要把表格包在多层卡片中，页面一个白色内容区即可。

### 4.2 表单与检索 el-input / el-select

| 属性 | 规范 |
|---|---|
| 默认高度 | `32px` |
| 小型筛选高度 | `28px` |
| 圆角 | `4px` |
| 边框 | `#E5E5E5` |
| hover 边框 | `#2743A4` 的弱化状态 |
| focus 边框 | `#2743A4` |
| placeholder | `#9199BD` |
| 字号 | `14px` |

研报检索类页面可使用较明显的搜索输入区，但仍应保持后台检索形态：输入框、选择器、按钮同高，横向排列，筛选条件不要做成营销搜索框。

### 4.3 按钮 el-button

| 类型 | 背景 | 边框 | 文字 | 高度 | 圆角 |
|---|---|---|---|---:|---:|
| 主按钮 | `#2743A4` | `#2743A4` | `#FFFFFF` | `32px` | `4px` |
| 主按钮 hover | `#1F3683` | `#1F3683` | `#FFFFFF` | `32px` | `4px` |
| 次按钮 | `#FFFFFF` | `#E5E5E5` | `#3F485A` | `32px` | `4px` |
| 小按钮 | 同类型 | 同类型 | 同类型 | `28px` | `4px` |
| 文字按钮 | 透明 | 透明 | `#2743A4` | `22px` | `0` |
| 危险按钮 | `#FF4542` | `#FF4542` | `#FFFFFF` | `32px` | `4px` |

按钮间距建议 `8px` 或 `12px`。主按钮只用于页面主操作，如查询、确认、提交、导入；同一区域不要出现多个同权重主按钮。

### 4.4 选项卡 el-tabs / 分段控件

切图中存在多层切换：一级业务 Tab、二级标签、三级按钮单选。

| 层级 | 样式 |
|---|---|
| 一级 Tab | 文字 `14px`，激活色 `#2743A4`，下划线 `2px`，背景白色 |
| 二级标签 | 高 `32px`，选中背景 `#2743A4`，文字白色；未选中 `#F6F6F6` / `#242933` |
| 三级分段 | 容器高 `28px`，背景 `rgba(233,236,246,0.5)`；选中项高 `24px`，背景 `#2743A4`，圆角 `4px` |

内部排名、实盘收益、重点推荐等页面的切换应优先使用“下划线 Tab + 轻量标签”，不要使用重卡片式 Tabs。

### 4.5 标签、状态与评级

- 普通标签：高 `24px`，圆角 `4px`，字号 `12px` 或 `13px`。
- 业务状态标签使用浅底深字，不使用大面积实心色。
- 排名、评级、重点推荐可使用金色体系：浅底 `#FAF6F1`，强调线 `#D1A777`，文字 `#A7865F`。

## 5. 骨架与间距

### 5.1 页面结构

推荐结构：

```text
页面浅灰背景 #F7F8FA
  顶部标题 / 面包屑 / 操作区
  白色筛选区
  白色内容区
    Tabs / 指标条 / 图表
    高密度表格
    分页
```

不要在页面中堆叠“卡片里的卡片”。同一业务区域用留白、标题、分割线和浅灰底区分即可。

### 5.2 间距网格

| Token | 值 | 使用场景 |
|---|---:|---|
| xs | `4px` | 图标与文字、表格内小间隔 |
| sm | `8px` | 按钮间距、表单项内部 |
| md | `12px` | 筛选项横向间隔、标签间隔 |
| lg | `16px` | 页面内边距、模块内间距 |
| xl | `20px` | 区块间距 |
| xxl | `24px` | 页面大区块、标题与内容 |
| xxxl | `32px` | 大模块分隔、看板区块 |

### 5.3 圆角与阴影

| 对象 | 圆角 | 阴影 |
|---|---:|---|
| 输入框 / 按钮 / 标签 | `4px` | 无 |
| 表格 | `0` 或外层 `4px` | 无 |
| 普通面板 | `4px` / `8px` | 少用 |
| 弹窗 | `4px` / `8px` | `0 2px 10px rgba(0,0,0,0.12)` |
| 下拉浮层 | `4px` | `0 2px 8px rgba(0,0,0,0.12)` |

金融 B 端页面的质感主要来自边界、对齐和信息层级，不来自厚重阴影。

## 6. 图表与数据可视化

- 图表背景使用白色，坐标轴文字使用 `#9199BD`。
- 网格线使用 `#E5E5E5` 或更浅的透明灰。
- 主序列优先使用 `#2743A4`，对比序列使用 `#D1A777`、`#4D6CA0`。
- 收益正负方向使用红/绿，不要用随机色。
- 图例字号 `12px` 或 `13px`，不要抢占表格主信息。

## 7. AI 生成页面时的硬性约束

1. 页面第一屏必须是实际业务操作界面，不做欢迎页、介绍页、宣传页。
2. 表格密度优先，默认表格文字 `13px`，行高接近 `32px`。
3. 主色只用 `#2743A4`，禁止继续沿用 ElementUI 默认蓝。
4. 所有空单元格保持空白，不用 `-`、`--` 占位。
5. 查询区控件同高，默认 `32px`，横向紧凑排列。
6. 卡片圆角不超过 `8px`，普通页面优先 `4px`。
7. 不使用渐变球、背景大图、插画、营销式 hero。
8. 金融数字必须右对齐，收益率必须按业务规则着色。
9. 图标优先 `14px` / `16px`，与文字保持 `4px` 或 `8px` 间距。
10. 修改现有页面时保持当前纯静态 HTML + Vue2 写法，不引入新库。

## 8. variables.scss 建议变量

下面变量命名兼容 ElementUI 2.x 常见 Sass 覆盖方式，也包含项目自定义 token。当前项目是 CDN 静态 HTML，若暂不编译 Sass，可将这些变量转换为 CSS 变量或普通 CSS 覆盖规则使用。

```scss
// 品牌色
$--color-primary: #2743A4;
$--color-primary-dark: #1F3683;
$--color-primary-light: #E9ECF6;
$--color-primary-plain: #F7F8FA;

// 功能色
$--color-success: #06C687;
$--color-success-strong: #32CD32;
$--color-warning: #FFC802;
$--color-danger: #FF4542;
$--color-info: #9199BD;

// 金融业务色
$--color-rise: #FF4542; // 国内证券/基金习惯：上涨、正收益
$--color-fall: #06C687; // 国内证券/基金习惯：下跌、负收益
$--color-recommend: #F97A6D;
$--color-orange: #F5822E;
$--color-gold: #D1A777;
$--color-gold-dark: #A7865F;

// 中性色
$--background-color-base: #F7F8FA;
$--color-white: #FFFFFF;
$--color-black: #242933;
$--color-text-primary: #242933;
$--color-text-regular: #3F485A;
$--color-text-secondary: #707783;
$--color-text-placeholder: #9199BD;
$--border-color-base: #E5E5E5;
$--border-color-light: #E5E5E5;
$--border-color-lighter: #E9ECF6;
$--border-color-extra-light: #F6F6F6;
$--disabled-fill-base: #F6F6F6;
$--disabled-color-base: #CCCCCC;

// 字体
$--font-path: "element-ui/lib/theme-chalk/fonts";
$--font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
$--font-size-extra-large: 20px;
$--font-size-large: 16px;
$--font-size-medium: 14px;
$--font-size-base: 14px;
$--font-size-small: 13px;
$--font-size-extra-small: 12px;
$--font-weight-primary: 400;
$--font-line-height-primary: 22px;

// 圆角
$--border-radius-base: 4px;
$--border-radius-small: 4px;
$--border-radius-circle: 100%;
$--border-radius-zero: 0;

// 阴影
$--box-shadow-base: 0 2px 8px rgba(0, 0, 0, 0.08);
$--box-shadow-light: 0 2px 10px rgba(0, 0, 0, 0.12);
$--box-shadow-table-fixed: 0 0 8px rgba(0, 0, 0, 0.07);

// 按钮
$--button-font-size: 14px;
$--button-border-radius: 4px;
$--button-padding-vertical: 8px;
$--button-padding-horizontal: 16px;
$--button-medium-padding-vertical: 8px;
$--button-medium-padding-horizontal: 16px;
$--button-small-padding-vertical: 7px;
$--button-small-padding-horizontal: 12px;
$--button-mini-padding-vertical: 6px;
$--button-mini-padding-horizontal: 10px;
$--button-primary-background-color: $--color-primary;
$--button-primary-border-color: $--color-primary;
$--button-primary-font-color: #FFFFFF;
$--button-default-background-color: #FFFFFF;
$--button-default-border-color: #E5E5E5;
$--button-default-font-color: #3F485A;

// 输入与选择器
$--input-height: 32px;
$--input-medium-height: 32px;
$--input-small-height: 28px;
$--input-mini-height: 24px;
$--input-border: 1px solid #E5E5E5;
$--input-border-color: #E5E5E5;
$--input-border-radius: 4px;
$--input-hover-border: #2743A4;
$--input-focus-border: #2743A4;
$--input-font-color: #3F485A;
$--input-placeholder-color: #9199BD;

// 表格
$--table-font-color: #3F485A;
$--table-header-font-color: #242933;
$--table-header-background-color: #F7F8FA;
$--table-row-hover-background-color: #F7F8FA;
$--table-current-row-background-color: #E9ECF6;
$--table-border-color: #E5E5E5;
$--table-border: 1px solid #E5E5E5;
$--table-padding: 5px 8px;
$--table-cell-padding: 5px 8px;

// Tabs
$--tabs-header-height: 40px;
$--tabs-active-color: #2743A4;
$--tabs-hover-color: #2743A4;
$--tabs-ink-bar-color: #2743A4;

// 标签
$--tag-font-size: 12px;
$--tag-border-radius: 4px;
$--tag-primary-color: #2743A4;
$--tag-primary-fill: #E9ECF6;
$--tag-success-color: #06C687;
$--tag-success-fill: #E7F9F3;
$--tag-warning-color: #A7865F;
$--tag-warning-fill: #FFF4CC;
$--tag-danger-color: #FF4542;
$--tag-danger-fill: #FFEDEC;

// 项目自定义间距
$rrs-spacing-xs: 4px;
$rrs-spacing-sm: 8px;
$rrs-spacing-md: 12px;
$rrs-spacing-lg: 16px;
$rrs-spacing-xl: 20px;
$rrs-spacing-xxl: 24px;
$rrs-spacing-xxxl: 32px;

// 项目自定义尺寸
$rrs-page-padding: 16px;
$rrs-filter-height: 32px;
$rrs-table-row-height: 32px;
$rrs-panel-radius: 4px;
$rrs-card-radius: 8px;
$rrs-icon-size-sm: 14px;
$rrs-icon-size-md: 16px;
```

## 9. 推荐 CSS 覆盖片段

如果继续使用 CDN 版 ElementUI，可在页面公共样式中先落地以下覆盖方向：

```css
body {
  background: #F7F8FA;
  color: #3F485A;
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
}

.el-button {
  height: 32px;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
}

.el-button--primary {
  background-color: #2743A4;
  border-color: #2743A4;
}

.el-button--primary:hover,
.el-button--primary:focus {
  background-color: #1F3683;
  border-color: #1F3683;
}

.el-input__inner,
.el-select .el-input__inner {
  height: 32px;
  line-height: 32px;
  border-radius: 4px;
  border-color: #E5E5E5;
  color: #3F485A;
}

.el-input__inner:focus {
  border-color: #2743A4;
}

.el-table {
  color: #3F485A;
  font-size: 13px;
}

.el-table th {
  background: #F7F8FA;
  color: #242933;
  font-weight: 600;
}

.el-table td,
.el-table th {
  padding: 5px 0;
  border-color: #E5E5E5;
}

.el-tabs__active-bar {
  background-color: #2743A4;
}

.el-tabs__item.is-active,
.el-tabs__item:hover {
  color: #2743A4;
}

.text-rise {
  color: #FF4542;
}

.text-fall {
  color: #06C687;
}
```
