# 智慧风控 / 智能投研平台 UI 设计规范

> 本规范基于 `D:\my-project-all\znty-rrs-slice` 下 6 个静态切图模块抽取生成，面向后续 `Vue2 + ElementUI` 企业后台页面开发。所有新增页面、重构页面、组件封装和视觉走查均应优先遵循本文档，不应引入新的视觉语言。

## 1. 分析范围与结论

本次把 `znty-rrs-slice` 作为一个完整产品分析，而不是逐页说明。扫描范围包含：

| 模块 | 说明 |
|---|---|
| 兴业基金PC规范260313-研发版 | PC 设计规范与通用组件资产 |
| 兴业基金智能投研平台-内评计算切图 | 内部评级、计算得分、导入、审核与详情场景 |
| 兴业基金智能投研平台-内部排名总览切图260305 | 内部排名、多维度基金排名与复杂表格场景 |
| 兴业基金智能投研平台-实盘收益切图260304 | 实盘收益、图表、指标与列表场景 |
| 兴业基金智能投研平台-研报检索切图260304 | 研报检索、筛选与结果列表场景 |
| 兴业基金智能投研平台-重点推荐切图260304 | 重点推荐、个股追踪、研报与推荐卡片场景 |

扫描得到的文件规模如下：

| 类型 | 数量 |
|---|---:|
| `.html` | 75 |
| `.png` | 1115 |
| `.svg` | 493 |
| `.pdf` | 6 |
| 其他无扩展文件 | 24 |

目录中的 `index.html` 均为 `Spec Export - Sketch MeaXure` 导出物，包含设计稿画板、切图预览、标注与资源索引；`links` 下页面多为 56-60 字节的跳转占位；真正承载视觉信息的是各模块的 `index.html`、`preview` 图片、`assets` 图标与 SVG。6 个主 `index.html` 中均出现 `Vue` / `Element` / `el-button` 等导出工具相关痕迹，但切图本身不是可运行的 ElementUI 页面。后续实现应以现有前端项目的 ElementUI 2.15 为组件基础，将本规范中的尺寸、颜色、间距和状态覆盖到 ElementUI。

预览图以 `2880x1800`、`2880x1680`、`2880x1560` 以及对应的 `720x450`、`720x420`、`720x390` 成对出现，说明主设计基准是 `1440x900` 桌面端后台，导出倍率多为 2x 和缩略图。图标资产目录以 `12px`、`14px`、`16px`、`24px`、`32px` 为主，其中 `16px` 出现 726 次，是业务菜单、表格操作、选择框、刷新、导出等常规图标的主尺寸。

整体视觉语言可以概括为：白色内容面板、浅灰页面底、深蓝主色、低饱和蓝灰文字、细边框分割、高密度表格、紧凑筛选区、金融数据看板式信息层级。它不是营销型页面，也不是大卡片陈列型系统；它应保持企业后台的密度、秩序和稳定性。

## 2. 颜色规范

### 2.1 颜色频次模型

颜色频次最高的值集中在以下几类：

| 颜色 | 频次特征 | 设计语义 |
|---|---:|---|
| `#E5E5E5` | 最高频，含 alpha 变体后仍最高 | 边框、表格分割、浅分割线 |
| `#FFFFFF` | 高频 | 卡片、表格、弹窗、输入框背景 |
| `#3F485A` | 高频 | 正文、菜单文字、表格主体文字 |
| `#2743A4` | 高频 | 主品牌色、主按钮、选中态、链接 |
| `#242933` | 高频 | 标题、强调正文 |
| `#F7F8FA` | 高频 | 页面背景、表头背景、浅色区域 |
| `#9199BD` | 高频 | 次级文字、辅助说明、弱提示 |
| `#E9ECF6` | 中高频 | 选中浅底、hover 浅底、标签底 |
| `#FF4542` | 中频 | 危险、错误、下跌或异常 |
| `#06C687` / `#32CD32` | 中频 | 成功、通过、上涨或正向结果 |
| `#FFC802` | 中频 | 警告、待处理、提示 |
| `#F97A6D` / `#F5822E` | 中频 | 强警示、橙色业务状态 |
| `#D1A777` / `#A7865F` | 中频 | 金色强调、等级或排名类业务 |

注意：导出文件中存在 `#FFFFFFFF`、`#FFE5E5E5`、`#3F485AFF` 等 8 位 Hex 或 ARGB 变体。实现时统一归一为 6 位 Hex + CSS opacity，不直接在业务 CSS 中扩散 8 位颜色。

### 2.2 基础 Color Token

| Token | Hex | 用途 |
|---|---|---|
| `--color-primary` | `#2743A4` | 主按钮、主链接、选中菜单、关键操作 |
| `--color-primary-hover` | `#1F3683` | 主按钮 hover、深色选中态 |
| `--color-primary-active` | `#1F3683` | 主按钮 active、当前菜单强选中 |
| `--color-primary-light` | `#E9ECF6` | 主色浅底、选中浅底、hover 背景 |
| `--color-primary-soft` | `#F7F8FA` | 页面底色、表头底色、弱分区底色 |
| `--color-success` | `#06C687` | 成功、通过、正向状态 |
| `--color-success-strong` | `#32CD32` | 强成功、图表正向高亮 |
| `--color-success-light` | `#E7F9F3` | 成功浅底标签 |
| `--color-warning` | `#FFC802` | 待处理、警告、提示 |
| `--color-warning-light` | `#FFF4CC` | 警告浅底标签 |
| `--color-danger` | `#FF4542` | 错误、拒绝、删除、风险提示 |
| `--color-danger-light` | `#FFEDEC` | 危险浅底标签 |
| `--color-orange` | `#F5822E` | 橙色业务状态、强调数据 |
| `--color-orange-light` | `#FDE6D5` | 橙色浅底 |
| `--color-gold` | `#D1A777` | 排名、评级、重点推荐强调 |
| `--color-gold-dark` | `#A7865F` | 金色深色文字或边框 |
| `--color-bg-page` | `#F7F8FA` | 页面背景 |
| `--color-bg-panel` | `#FFFFFF` | 卡片、表格、弹窗背景 |
| `--color-bg-hover` | `#E9ECF6` | 列表 hover、菜单 hover、浅选中 |
| `--color-border` | `#E5E5E5` | 默认边框与分割线 |
| `--color-border-dark` | `#CCCCCC` | 强边框、输入框 hover 边框 |
| `--color-text-primary` | `#242933` | 标题、强正文 |
| `--color-text-regular` | `#3F485A` | 普通正文、表格内容 |
| `--color-text-secondary` | `#707783` | 次级信息 |
| `--color-text-placeholder` | `#9199BD` | placeholder、弱说明 |
| `--color-text-disabled` | `#CCCCCC` | 禁用文本 |
| `--color-black` | `#000000` | 遮罩透明底，不直接用于正文 |

### 2.3 颜色使用规则

主色只能用于可交互重点对象：主按钮、当前页菜单、当前标签、链接、选中项、表格内可点击操作。不要把 `#2743A4` 大面积铺在卡片背景中，避免把系统做成单一蓝色主题。

边框统一使用 `#E5E5E5`，表格单元格分割、卡片内部分割、输入框默认边框都应走这个颜色。只有 hover、focus、选中或重要容器才使用 `#CCCCCC`、`#2743A4` 或深色边框。

正文优先使用 `#3F485A`，标题使用 `#242933`。`#9199BD` 用于 placeholder、弱提示、说明、次级指标，不用于核心表格数据，避免金融数据可读性下降。

状态色遵循“文字 + 浅底 + 必要时边框”的组合。成功类为 `#06C687` / `#E7F9F3`，警告类为 `#FFC802` / `#FFF4CC`，危险类为 `#FF4542` / `#FFEDEC`，橙色业务强调为 `#F5822E` / `#FDE6D5`。

## 3. 字体规范

### 3.1 字体频次模型

切图中字体频次最高的是：

| Font Family | 频次特征 | 用途 |
|---|---:|---|
| `PingFangSC-Regular` | 10247 | 主正文、表格、表单 |
| `PingFangSC-Semibold` | 829 | 标题、按钮强调、关键字段 |
| `PingFangSC-Medium` | 181 | 次级标题、标签、强调 |
| `SourceHanSansCN-Heavy` | 22 | 极少量大标题或视觉展示 |
| `SourceHanSansCN-Bold` | 10 | 局部强调 |

实现时使用系统字体栈，不强制引入新字体文件：

```css
font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

如设计稿中的 `PingFangSC-Regular`、`PingFangSC-Semibold`，在 CSS 中通过 `font-weight` 表达。

### 3.2 字号与行高

频次最高字号为 `13px`、`14px`、`12px`、`16px`、`24px`、`22px`。频次最高行高为 `22px`、`21px`、`24px`、`12px`、`20px`。结合企业后台实现，统一为以下排版 Token：

| 场景 | 字号 | 字重 | 行高 | 颜色 |
|---|---:|---:|---:|---|
| 一级页面标题 | `24px` | `600` | `32px` | `#242933` |
| 二级模块标题 | `16px` | `600` | `24px` | `#242933` |
| 三级区块标题 | `14px` | `600` | `22px` | `#242933` |
| 普通正文 | `13px` | `400` | `22px` | `#3F485A` |
| 表格正文 | `13px` | `400` | `22px` | `#3F485A` |
| 表格表头 | `13px` | `600` | `22px` | `#242933` |
| 表单 Label | `13px` | `400` | `22px` | `#3F485A` |
| 输入框文字 | `13px` | `400` | `22px` | `#3F485A` |
| Placeholder | `13px` | `400` | `22px` | `#9199BD` |
| 按钮文字 | `13px` | `500` | `20px` | 随按钮类型 |
| 标签文字 | `12px` | `400` | `20px` | 随状态 |
| 辅助说明 | `12px` | `400` | `20px` | `#9199BD` |
| 指标数字 | `20px` / `22px` | `600` | `30px` | `#242933` |
| 大屏展示数字 | `24px` / `28px` | `600` | `34px` | 根据业务状态 |

### 3.3 排版规则

后台页面默认字号使用 `13px`，不是 ElementUI 默认的 `14px`。在 `znty-sirm-ui` 中应通过全局样式覆盖表格、表单、按钮、弹窗正文，使密度与切图一致。

标题只在真实层级变化时加粗。不要为了强调普通字段随意使用 `600`，否则表格密度会变重。表格中金额、排名、评级、涨跌幅等关键数据可用 `500` 或状态色，但不应大面积加粗。

行高优先使用 `22px`。表格、表单、详情项、列表项统一走 `13px / 22px`，保证中文阅读稳定。`12px / 20px` 仅用于标签、说明、角标、辅助提示。

## 4. 间距规范

### 4.1 间距频次模型

导出样式中 padding 高频值为 `16`、`4`、`20`、`1`、`15`、`10`、`8`、`24`、`12`、`32`。margin 高频值为 `2`、`10`、`8`、`4`、`15`、`16`、`24`。其中 `1px`、`2px` 多来自导出图层或线条，不作为布局间距主 Token。

项目采用 4px 基础栅格，兼容 8px 节奏：

| Token | 值 | 用途 |
|---|---:|---|
| `--space-xxs` | `4px` | 图标与文字、标签内边距、紧凑间隔 |
| `--space-xs` | `8px` | 表单项内间距、按钮图标间距、紧凑行间距 |
| `--space-sm` | `12px` | 表单列间距、工具栏按钮组间距 |
| `--space-md` | `16px` | 卡片内边距、查询区内边距、区块上下间距 |
| `--space-lg` | `20px` | 页面主内容内边距、弹窗正文边距 |
| `--space-xl` | `24px` | 页面区块间距、弹窗头尾内边距 |
| `--space-xxl` | `32px` | 大区块间距、空状态上下间距 |
| `--space-section` | `40px` | 少量大区域分隔，不作为常规表单间距 |

### 4.2 布局间距规则

页面内容区左右留白建议 `20px` 或 `24px`。在 1440 宽基准下，左侧菜单展开时内容区仍应保持表格可读，不使用大面积居中留白。

卡片或面板内边距默认 `16px`。复杂查询区使用 `16px 20px`，弹窗正文使用 `20px 24px`，表格上方工具栏与表格之间使用 `12px`。

同一行表单项之间使用 `16px` 或 `24px`；Label 与控件之间不额外加大间距，交给 ElementUI `label-width` 管理。按钮组内按钮间距使用 `8px`。

列表、表格、卡片之间的纵向间距优先 `16px`。只有页面大区块切换或图表与表格组合时使用 `20px` / `24px`。

## 5. 圆角规范

圆角频次最高的是 `4px`，出现 1854 次；其次是 `3px`、`8px`、`2px`。因此全局圆角以 `4px` 为基础，不使用大圆角卡片。

| 组件 | 圆角 |
|---|---:|
| Button | `4px` |
| Input / Select / DatePicker | `4px` |
| Card / Panel | `4px` |
| Dialog | `4px` 或 `8px`，默认 `4px` |
| Tag | `2px` / `4px`，默认 `2px` |
| Table 行、单元格 | `0` |
| Tabs 选项卡 | `2px 2px 0 0` 或无圆角 |
| Tooltip / Popover | `4px` |
| Checkbox / Radio 内部图形 | 按 ElementUI 默认，颜色覆盖 |

规范原则：后台系统避免 `12px` 以上圆角；除头像、圆形状态点、图表点位外不使用 `50%` 圆角。

## 6. 阴影规范

切图中的阴影分两类：大量 `inset` 阴影用于导出工具表达表格分割线；真实浮层阴影主要为蓝灰色低透明度。

| Token | 值 | 用途 |
|---|---|---|
| `--shadow-border-bottom` | `inset 0 -1px 0 0 #E5E5E5` | 表格行、标题栏分割 |
| `--shadow-border-right-bottom` | `inset -1px 0 0 0 #E5E5E5, inset 0 -1px 0 0 #E5E5E5` | 表格单元格分割 |
| `--shadow-card` | `0 1px 2px 0 rgba(67,96,148,0.10)` | 轻卡片、轻面板 |
| `--shadow-popup` | `0 0 10px 0 rgba(77,108,160,0.10), 0 2px 6px 0 rgba(77,108,160,0.20)` | 下拉、Popover、悬浮菜单 |
| `--shadow-dialog` | `0 2px 24px 0 rgba(77,108,160,0.06), 0 4px 12px 0 rgba(77,108,160,0.16)` | 弹窗 |
| `--shadow-heavy` | `0 2px 48px 0 rgba(77,108,160,0.06), 0 6px 20px 0 rgba(77,108,160,0.10)` | 抽屉或大浮层，谨慎使用 |

常规页面卡片不应依赖强阴影建立层级，优先使用白底、边框和分割线。只有浮层、下拉、弹窗、固定列遮挡关系需要阴影。

## 7. 图标规范

图标资产集中在 `assets` 下，命名包含业务域、尺寸和状态，例如 `通用图标/16px/导出-默认.svg`、`权益研究/16px/研究报告-默认.svg`、`缺省图/无数据.svg`。图标状态包含 `默认`、`悬停`、`点击`、`选中`、`禁用`。

图标尺寸规则：

| 尺寸 | 用途 |
|---|---|
| `12px` | 小箭头、表格排序、轻量说明、下拉辅助 |
| `14px` | 表格行内操作、选项卡箭头、局部业务图标 |
| `16px` | 主操作图标、菜单图标、输入框尾图标、刷新导出 |
| `24px` | 顶部通知、退出、锁定、用户操作 |
| `32px` | 大箭头、轮播或重点操作 |

实现时优先复用已有 SVG / PNG 资源，不自行画风格不一致的新图标。若 ElementUI 自带图标可满足功能但视觉差异明显，应使用切图资产中的通用图标。新增图标必须提供默认、hover、active/selected、disabled 所需状态，颜色遵循文本色与主色 Token。

图标与文字间距默认 `4px` 或 `8px`。按钮内图标使用 `14px` 或 `16px`，菜单图标使用 `16px`。不要在后台工具栏中使用大于 `16px` 的功能图标。

## 8. 组件体系

### 8.1 ElementUI 判断

切图导出物本身不是 ElementUI 源码，但其组件形态与 ElementUI 企业后台高度一致。结合现有 `znty-sirm-ui` 技术栈，组件归类如下：

| 类型 | 组件 |
|---|---|
| ElementUI 基础组件 | Button、Input、Select、DatePicker、Table、Dialog、Tabs、Card、Menu、Pagination、Breadcrumb、Form、Checkbox、Radio、Switch、Tooltip、Popover |
| 二次封装组件 | 查询区、表格工具栏、状态 Tag、金额/涨跌幅单元格、导入弹窗、详情弹窗、菜单折叠布局、表格固定列布局 |
| 业务组件 | 内评计算步骤、研报检索条件、内部排名表格、实盘收益图表、重点推荐卡片、评级结果详情、空状态、权限/未开通状态 |
| 未在切图中明显出现但可按 ElementUI 承接 | Drawer、Tree、Breadcrumb、Pagination 的实现规范 |

组件开发原则：使用 ElementUI 提供行为能力，使用项目 CSS 覆盖尺寸、颜色、字体、间距；不要复制切图导出的绝对定位 HTML。

### 8.2 Button

| 状态 | 规范 |
|---|---|
| 默认尺寸 | 高 `32px`，字号 `13px`，字重 `500` |
| Padding | 默认 `0 12px`，带图标 `0 12px`，紧凑按钮 `0 8px` |
| Radius | `4px` |
| Primary | 背景 `#2743A4`，边框 `#2743A4`，文字 `#FFFFFF` |
| Primary Hover | 背景 `#1F3683`，边框 `#1F3683` |
| Default | 背景 `#FFFFFF`，边框 `#E5E5E5`，文字 `#3F485A` |
| Default Hover | 边框 `#2743A4`，文字 `#2743A4`，背景 `#FFFFFF` |
| Text Button | 文字 `#2743A4`，无边框，无背景 |
| Danger | 背景或文字 `#FF4542`，删除类操作需二次确认 |
| Disabled | 背景 `#F7F8FA`，边框 `#E5E5E5`，文字 `#CCCCCC` |

按钮层级：每个操作区最多一个主按钮；查询区主按钮为“查询”，次按钮为“重置”；表格工具栏中的“导出”“刷新”等使用默认按钮或文本按钮。危险操作不使用主色。

### 8.3 Input / Select / DatePicker

| 属性 | 规范 |
|---|---|
| 默认高度 | `32px` |
| 字号 | `13px` |
| Padding | 输入框 `0 12px`，带图标右侧预留 `32px` |
| Border | `1px solid #E5E5E5` |
| Radius | `4px` |
| 文本 | `#3F485A` |
| Placeholder | `#9199BD` |
| Hover | 边框 `#CCCCCC` |
| Focus / Active | 边框 `#2743A4`，必要时浅蓝 focus shadow |
| Disabled | 背景 `#F7F8FA`，文字 `#CCCCCC`，边框 `#E5E5E5` |

Select 下拉图标使用 `12px` 或 `16px` 箭头资源；DatePicker 使用 `16px` 日历图标。输入框不使用大阴影，不使用圆角胶囊形态。

### 8.4 Table

表格是项目最高频核心组件，切图中 `table` 关键字出现 2619 次，内部排名与内评计算模块尤为密集。表格规范必须优先保证信息密度、横向比较和稳定扫描。

| 属性 | 规范 |
|---|---|
| 表头高度 | `40px` |
| 行高 | `40px` 或 `44px`，复杂表格可 `45px` |
| 字号 | `13px` |
| 表头字重 | `600` |
| 表体字重 | `400` |
| 表头背景 | `#F7F8FA` |
| 表格背景 | `#FFFFFF` |
| 边框 | `#E5E5E5` |
| Hover 行 | `#F7F8FA` 或 `#E9ECF6` 弱底 |
| 选中行 | `#E9ECF6` |
| 空状态 | 使用缺省图 `无数据.svg`，文案 `暂无数据` |

数字列右对齐，文本列左对齐，状态列居中或左对齐按页面一致性决定。金额、收益率、排名等列应保留足够宽度，避免换行。表格内操作按钮使用文本按钮，颜色 `#2743A4`，多个操作之间用 `8px` 间距或竖线分隔。

固定列阴影可使用 `rgba(77,108,160,0.10/0.20)` 系阴影，避免纯黑重阴影。表头和单元格分割线统一 `#E5E5E5`。

### 8.5 Dialog

| 属性 | 规范 |
|---|---|
| 宽度 | 小弹窗 `420px`，中弹窗 `560px` / `640px`，复杂表单 `800px` |
| Radius | `4px` |
| Header | 高约 `48px`，内边距 `0 24px`，标题 `16px / 600` |
| Body | 内边距 `20px 24px` |
| Footer | 内边距 `12px 24px 20px`，按钮右对齐 |
| Shadow | `--shadow-dialog` |
| Mask | `rgba(0,0,0,0.35)` 或 ElementUI 默认遮罩微调 |

提示弹窗使用图标 + 标题 + 说明 + 操作按钮结构。复杂弹窗中的表单仍使用 `13px` 字号和 `32px` 控件高。弹窗内容不可用过大留白，也不要把按钮放在正文中间。

### 8.6 Drawer

切图中没有明显 Drawer，但如后续需要右侧详情抽屉，按 Dialog 与页面详情规范延伸：

| 属性 | 规范 |
|---|---|
| 宽度 | `480px` / `640px`，复杂详情可 `720px` |
| 背景 | `#FFFFFF` |
| Header | `48px`，标题 `16px / 600` |
| Body | `20px 24px` |
| Shadow | `--shadow-heavy` 或右侧方向阴影 |
| Footer | 固定底部，按钮右对齐 |

Drawer 只用于上下文详情、审批记录、辅助编辑，不替代主页面。

### 8.7 Tabs

`tab` 关键字出现 2855 次，说明选项卡是主要信息组织方式。

| 属性 | 规范 |
|---|---|
| 高度 | `40px` |
| 字号 | `13px` |
| 默认文字 | `#3F485A` |
| Hover | `#2743A4` |
| Active | `#2743A4`，字重 `500` 或 `600` |
| 下划线 | `2px solid #2743A4` |
| 卡片式 Tabs | 边框 `#E5E5E5`，选中底 `#FFFFFF` |

Tabs 与页面标题、查询区之间保持 `16px` 间距。标签数量较多时允许横向滚动或更多菜单，但不换成大卡片入口。

### 8.8 Card / Panel

| 属性 | 规范 |
|---|---|
| 背景 | `#FFFFFF` |
| Border | `1px solid #E5E5E5` 或无边框白底 |
| Radius | `4px` |
| Padding | `16px` |
| Shadow | 默认无；悬浮类使用 `--shadow-card` |
| Header | `16px / 600`，底部分割线可选 |

页面区块不应做成多层嵌套卡片。查询区、工具栏、表格区域可以处于同一白色面板内，通过分割线和间距组织。

### 8.9 Menu

左侧菜单是 PC 端后台的主导航。图标主尺寸 `16px`，文字 `13px` 或 `14px`。

| 状态 | 规范 |
|---|---|
| 默认 | 文字 `#3F485A`，图标默认态 |
| Hover | 背景 `#E9ECF6`，文字 `#2743A4` |
| Active | 背景 `#E9ECF6` 或主色强调，文字 `#2743A4`，图标选中态 |
| Disabled | 文字 `#CCCCCC`，图标禁用态 |
| 折叠 | 仅显示 `16px` 图标，保留 Tooltip |

菜单宽度建议展开 `200px` / `220px` / `240px`，折叠 `56px` / `64px`。切图中存在菜单收起默认页面，说明折叠态是必要状态。

### 8.10 Pagination

切图导出文本中未明显出现 Pagination 关键字，但后台表格必须统一：

| 属性 | 规范 |
|---|---|
| 高度 | `32px` |
| 字号 | `13px` |
| 布局 | 右对齐，位于表格下方 `16px` |
| 当前页 | 背景或文字 `#2743A4` |
| Border | `#E5E5E5` |
| Disabled | `#CCCCCC` |

推荐 ElementUI `prev, pager, next, sizes, jumper, total`。分页区域不单独加卡片。

### 8.11 Form

`form` 关键字出现 7536 次，是最高频业务结构。表单规范如下：

| 属性 | 规范 |
|---|---|
| Label 字号 | `13px` |
| Label 颜色 | `#3F485A` |
| Label 宽度 | 查询区 `72px` / `80px`，复杂表单 `96px` / `120px` |
| 控件高度 | `32px` |
| 行间距 | `16px` |
| 列间距 | `16px` / `24px` |
| 必填星号 | `#FF4542` |
| 错误提示 | `12px`，`#FF4542`，控件下方 |

查询表单使用横向紧凑布局，常规控件宽度 `160px` / `180px` / `240px`。复杂编辑表单可使用两列，字段较长时单独占整行。

### 8.12 Checkbox / Radio / Switch

| 组件 | 默认尺寸 | Active | Disabled |
|---|---|---|---|
| Checkbox | `16px` | `#2743A4` | 边框 `#E5E5E5`，文字 `#CCCCCC` |
| Radio | `16px` | `#2743A4` | 边框 `#E5E5E5`，文字 `#CCCCCC` |
| Switch | 高 `20px`，宽约 `40px` | 背景 `#2743A4` | 背景 `#CCCCCC` |

勾选项文字使用 `13px / 22px`，组内间距 `16px`。表格多选框必须垂直居中。

### 8.13 Tree / Breadcrumb

切图中 Tree 与 Breadcrumb 不明显，但如果业务需要，按以下规则补齐：

Breadcrumb 使用 `12px` 或 `13px`，默认 `#9199BD`，当前页 `#3F485A`，分隔符 `#CCCCCC`。只用于层级较深的详情或配置页，不在所有页面强制展示。

Tree 节点高度 `32px`，文字 `13px`，选中底 `#E9ECF6`，选中文字 `#2743A4`，图标 `12px` / `16px`。树组件用于流程、分类、组织、指标树，不用于普通菜单替代。

## 9. 页面布局规范

### 9.1 页面宽度与栅格

主设计基准为 `1440x900`，2x 预览为 `2880x1800`。页面应适配 `1366`、`1440`、`1920` 宽度。主内容区域使用流式宽度，不固定死 1440；表格列宽、图表容器和卡片网格使用响应式约束。

页面总体结构：

```text
App
  Header / Topbar
  Sidebar
  Main
    Page Header
    Query Panel
    Toolbar
    Content Panel / Table / Chart
    Pagination / Footer
```

左右留白：主内容 `20px` 或 `24px`。上下留白：页面顶部 `16px` / `20px`，区块间 `16px`。Header 高度建议 `56px` / `60px`，侧栏菜单项高度 `40px` / `44px`。

### 9.2 Header

Header 承载系统名、当前业务入口、通知、锁定、退出、用户信息等。图标尺寸 `24px`，文本 `14px`。背景通常为白色或深色品牌栏，若使用深色栏，菜单选中仍需与主色体系一致。

Header 不应放过多筛选条件。业务操作下沉到页面 Toolbar。

### 9.3 查询区

查询区是后台页面的第一功能区，通常位于页面标题或 Tabs 下方。推荐白底面板，内边距 `16px 20px`，控件高度 `32px`。查询项按 4 栅格或自适应 flex 排布：Label + 控件组合横向排列，按钮位于末尾。

查询按钮顺序：主按钮“查询”，次按钮“重置”，其他高级筛选、展开收起使用文本按钮或图标按钮。条件较多时支持折叠，展开区与基础区之间保留 `12px` 间距。

### 9.4 Toolbar

Toolbar 位于查询区与表格之间，承载新增、导入、导出、刷新、批量操作、视图切换等。高度约 `32px`，上下间距 `12px`。左侧放批量与主操作，右侧放导出、刷新、列设置等工具。

工具按钮使用 `32px` 高，带图标按钮图标 `16px`。不要把 Toolbar 做成独立大卡片。

### 9.5 Table 区

表格区域优先占据主要宽度。复杂表格允许横向滚动和固定列；表头固定需要在长列表中启用。表格与分页属于同一数据区，分页右对齐。

如果页面同时包含图表和表格，图表位于上方或左侧，表格仍保持白底和分割线。图表卡片内边距 `16px`，图例和筛选项使用 `12px` 字号。

### 9.6 Dialog / Import / Detail

批量导入、审核提示、详情展示在切图中多次出现。导入弹窗应包含上传区域、模板下载、文件校验结果和确认按钮。审核提示弹窗应明确显示操作影响，不做静默兜底。

详情弹窗或详情页使用“字段 Label + 值”的二维结构，Label 使用 `#707783` 或 `#9199BD`，值使用 `#3F485A`，重要字段用 `#242933`。

## 10. 业务组件规范

### 10.1 状态 Tag

Tag 高度 `22px` / `24px`，字号 `12px`，圆角 `2px`。状态色使用浅底 + 深文字：

| 状态 | 文字色 | 背景 |
|---|---|---|
| 成功 / 通过 / 生效 | `#06C687` | `#E7F9F3` |
| 待处理 / 待审核 | `#A7865F` 或 `#FFC802` | `#FFF4CC` |
| 失败 / 拒绝 / 异常 | `#FF4542` | `#FFEDEC` |
| 普通 / 未开始 | `#707783` | `#F7F8FA` |
| 推荐 / 重点 | `#D1A777` | `#F6EDE4` |
| 橙色警示 | `#F5822E` | `#FDE6D5` |

不要新增随意颜色的 Tag。业务枚举多时先归类到以上状态族。

### 10.2 数据色

金融数据中的正负、涨跌、收益率需要与业务确认方向。默认建议：

| 数据语义 | 颜色 |
|---|---|
| 正向、上涨、盈利、通过 | `#06C687` |
| 负向、下跌、亏损、拒绝 | `#FF4542` |
| 中性、无变化 | `#3F485A` |
| 排名、评级、推荐 | `#D1A777` / `#A7865F` |

不要在后端做 code 到中文名转换；前端字典映射时可同时映射状态色，但必须使用本文 Token。

### 10.3 空状态

使用已有缺省图资源，例如 `无数据.svg`、`搜索无结果.svg`、`加载出错.svg`、`访问无权限.svg`、`功能未开通.svg`。空状态图建议宽 `120px` / `160px`，文字 `13px`，颜色 `#9199BD`，上下间距 `32px`。

表格空状态可继续使用 ElementUI `empty-text="暂无数据"`，如页面需要更强提示则使用缺省图组件。

## 11. Design Token

### 11.1 Color Token

```css
:root {
  --xy-primary: #2743A4;
  --xy-primary-hover: #1F3683;
  --xy-primary-active: #1F3683;
  --xy-primary-light: #E9ECF6;
  --xy-success: #06C687;
  --xy-success-strong: #32CD32;
  --xy-success-light: #E7F9F3;
  --xy-warning: #FFC802;
  --xy-warning-light: #FFF4CC;
  --xy-danger: #FF4542;
  --xy-danger-light: #FFEDEC;
  --xy-orange: #F5822E;
  --xy-orange-light: #FDE6D5;
  --xy-gold: #D1A777;
  --xy-gold-dark: #A7865F;
  --xy-bg-page: #F7F8FA;
  --xy-bg-panel: #FFFFFF;
  --xy-bg-hover: #E9ECF6;
  --xy-border: #E5E5E5;
  --xy-border-dark: #CCCCCC;
  --xy-text-primary: #242933;
  --xy-text-regular: #3F485A;
  --xy-text-secondary: #707783;
  --xy-text-placeholder: #9199BD;
  --xy-text-disabled: #CCCCCC;
}
```

### 11.2 Typography Token

```css
:root {
  --xy-font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  --xy-font-size-xs: 12px;
  --xy-font-size-sm: 13px;
  --xy-font-size-md: 14px;
  --xy-font-size-lg: 16px;
  --xy-font-size-xl: 20px;
  --xy-font-size-title: 24px;
  --xy-line-height-xs: 20px;
  --xy-line-height-sm: 22px;
  --xy-line-height-md: 24px;
  --xy-line-height-lg: 30px;
  --xy-line-height-title: 32px;
  --xy-font-weight-regular: 400;
  --xy-font-weight-medium: 500;
  --xy-font-weight-semibold: 600;
}
```

### 11.3 Spacing Token

```css
:root {
  --xy-space-xxs: 4px;
  --xy-space-xs: 8px;
  --xy-space-sm: 12px;
  --xy-space-md: 16px;
  --xy-space-lg: 20px;
  --xy-space-xl: 24px;
  --xy-space-xxl: 32px;
  --xy-space-section: 40px;
}
```

### 11.4 Radius Token

```css
:root {
  --xy-radius-xs: 2px;
  --xy-radius-sm: 3px;
  --xy-radius-md: 4px;
  --xy-radius-lg: 8px;
  --xy-radius-circle: 50%;
}
```

默认使用 `--xy-radius-md`。只有 Tag、Tabs 局部可用 `2px`；弹窗如需更柔和可用 `8px`，但项目全局仍以 `4px` 为主。

### 11.5 Shadow Token

```css
:root {
  --xy-shadow-line-bottom: inset 0 -1px 0 0 #E5E5E5;
  --xy-shadow-cell: inset -1px 0 0 0 #E5E5E5, inset 0 -1px 0 0 #E5E5E5;
  --xy-shadow-card: 0 1px 2px 0 rgba(67, 96, 148, 0.10);
  --xy-shadow-popup: 0 0 10px 0 rgba(77, 108, 160, 0.10), 0 2px 6px 0 rgba(77, 108, 160, 0.20);
  --xy-shadow-dialog: 0 2px 24px 0 rgba(77, 108, 160, 0.06), 0 4px 12px 0 rgba(77, 108, 160, 0.16);
  --xy-shadow-heavy: 0 2px 48px 0 rgba(77, 108, 160, 0.06), 0 6px 20px 0 rgba(77, 108, 160, 0.10);
}
```

### 11.6 Animation Token

切图是静态稿，没有完整动效定义。ElementUI 落地时使用轻量、短时、功能性的动效：

| Token | 值 | 用途 |
|---|---|---|
| `--xy-duration-fast` | `120ms` | hover、按钮反馈 |
| `--xy-duration-base` | `180ms` | 下拉、选中、标签切换 |
| `--xy-duration-slow` | `240ms` | Dialog / Drawer 进入退出 |
| `--xy-ease-base` | `cubic-bezier(0.4, 0, 0.2, 1)` | 默认缓动 |
| `--xy-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | 浮层出现 |

动效不得影响表格性能，不对大表格行做复杂动画。

### 11.7 ZIndex Token

与 ElementUI 默认层级兼容：

| Token | 值 | 用途 |
|---|---:|---|
| `--xy-z-header` | `100` | 顶部栏 |
| `--xy-z-sidebar` | `110` | 侧边栏 |
| `--xy-z-sticky` | `200` | 表头、固定工具栏 |
| `--xy-z-dropdown` | `1000` | 下拉菜单 |
| `--xy-z-popover` | `2000` | Popover / Tooltip |
| `--xy-z-dialog` | `3000` | Dialog |
| `--xy-z-message` | `4000` | Message / Notification |

不要随意写超过 `9999` 的层级。遇到遮挡问题应先检查组件挂载位置和父级 `z-index`。

## 12. 冲突样式与例外

本次采用“频率最高者作为全局规范”的原则。主要冲突如下：

| 类别 | 高频规范 | 例外值 | 例外来源 / 说明 |
|---|---|---|---|
| 主字号 | `13px`，出现 6853 次 | `14px` 出现 3038 次 | 部分按钮、菜单或导出标注页更接近 14px；实现时正文表格用 13px，标题/菜单可用 14px |
| 主圆角 | `4px`，出现 1854 次 | `3px`、`8px`、`2px` | Tag 和 Tabs 可用 2px，弹窗可局部 8px，其余统一 4px |
| 页面背景 | `#F7F8FA` | `#FFFFFF` 大面积出现 | 白色主要是面板、表格和弹窗；页面底仍用 `#F7F8FA` |
| 边框 | `#E5E5E5` | `#CCCCCC`、`#979797` | hover、强边界或导出工具标注产生，默认边框不用深灰 |
| 主色 | `#2743A4` | `#1F3683`、`#4D6CA0` | hover / active / 阴影色，不替代主色 |
| 成功色 | `#06C687` | `#32CD32`、`#73C899` | 图表或业务强调可用强成功色，普通状态用 `#06C687` |
| 警告色 | `#FFC802` | `#D1A777`、`#A7865F` | 排名、评级、推荐使用金色族；普通警告使用黄色族 |
| 阴影 | 浮层蓝灰阴影 | 大量 inset 表格线 | inset 多为表格分割表达，不作为卡片阴影 |

模块层面例外：

| 模块 | 例外特征 | 处理原则 |
|---|---|---|
| 兴业基金PC规范260313-研发版 | 包含大量规范标注与导出工具 UI，`#FFFFFF`、`#242933` 占比高 | 只提取设计规范和资产，不把导出工具界面当业务页面 |
| 内部排名总览 | `#E5E5E5` 极高频，表格分割密集 | 表格规范优先参考该模块，但边框仍统一 `#E5E5E5` |
| 实盘收益 | `#F7F8FA`、图表色与状态色更多 | 图表和指标可使用状态扩展色，但页面骨架仍遵循全局规范 |
| 重点推荐 | `#F97A6D` 出现较多 | 作为推荐、热度、警示业务强调，不升级为全局主色 |
| 研报检索 | 样本较少，主色和基础色一致 | 不单独建立模块主题 |
| 内评计算 | 弹窗、导入、审核场景较多 | Dialog、Form、Upload 规范重点参考该模块 |

## 13. ElementUI 落地建议

在 `znty-sirm-ui` 中建议建立一个全局样式入口，例如 `css/theme.css` 或现有公共 CSS 文件，集中覆盖 ElementUI：

```css
body {
  font-family: var(--xy-font-family);
  font-size: var(--xy-font-size-sm);
  color: var(--xy-text-regular);
  background: var(--xy-bg-page);
}

.el-button {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--xy-radius-md);
  font-size: var(--xy-font-size-sm);
}

.el-input__inner,
.el-select .el-input__inner {
  height: 32px;
  line-height: 32px;
  border-radius: var(--xy-radius-md);
  border-color: var(--xy-border);
  font-size: var(--xy-font-size-sm);
}

.el-table {
  color: var(--xy-text-regular);
  font-size: var(--xy-font-size-sm);
}

.el-table th {
  background: var(--xy-bg-page);
  color: var(--xy-text-primary);
  font-weight: var(--xy-font-weight-semibold);
}
```

实际落地时不要一次性重写所有 ElementUI 样式。建议先从页面容器、按钮、输入框、表格、弹窗、Tag 六类核心组件开始，逐页迁移并做视觉回归。

## 14. 后续设计与开发约束

1. 新页面必须使用本文 Design Token，不新增散落 Hex 色值；如确需新增颜色，先归类到现有状态族。
2. 页面第一屏应是可用业务界面，不做营销式大 Hero、装饰插画或大面积渐变。
3. 表格、查询区、工具栏是本系统的核心工作流，信息密度优先于装饰性。
4. 不引入新的 UI 库、图标库、字体库，除非用户明确确认。
5. 空值展示遵循项目约定：字段、表格单元格、详情项为空时显示空白；空列表可显示“暂无数据”。
6. 图标优先复用 `znty-rrs-slice` 资产或现有前端资产，保持默认、悬停、点击、选中、禁用状态一致。
7. 所有 Vue2 + ElementUI 页面生成时，按钮高度、表单控件高度、表格字号、主色、边框色必须与本文一致。
8. 后续如从真实业务页面中发现更高优先级规范，应更新本文，而不是在单页内局部发散。

## 15. 快速检查清单

开发或评审一个页面时，按以下清单检查：

| 检查项 | 标准 |
|---|---|
| 主色 | 是否只使用 `#2743A4` 及其 hover/active |
| 背景 | 页面底是否为 `#F7F8FA`，内容面板是否为白色 |
| 字号 | 表格、表单、正文是否以 `13px` 为主 |
| 控件高度 | Button/Input/Select/DatePicker 是否为 `32px` |
| 圆角 | 常规组件是否为 `4px` |
| 边框 | 默认边框是否为 `#E5E5E5` |
| 表格 | 表头是否浅灰底、分割线是否统一、数字列是否对齐 |
| 查询区 | 是否紧凑、按钮顺序是否为查询/重置/更多 |
| 弹窗 | 是否右下角操作、标题与正文间距是否稳定 |
| 图标 | 是否使用 12/14/16/24/32px 体系和既有状态 |
| 状态色 | 是否归入成功/警告/危险/橙色/金色体系 |
| 空状态 | 是否使用既有缺省图或 ElementUI 空文案 |

本规范是当前切图目录的全局设计模型。后续所有设计任务、Vue 页面开发、ElementUI 页面生成，都应严格遵循该规范，不允许引入新的设计语言。
