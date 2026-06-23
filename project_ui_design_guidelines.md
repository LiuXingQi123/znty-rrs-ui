项目UI设计规范-精简版

1. 文档定位

- 本文档用于约束 znty-sirm-ui 后续页面开发、页面重构、AI生成页面和UI走查。
- 本规范基于以下三份文件合并精简：
  - 项目整体风格总结-deepseek.md
  - 项目整体风格总结-gemini.md
  - project-design-system-gpt.md
- 后续新增页面、组件封装、ElementUI样式覆盖，优先遵守本文档。
- 本项目整体风格为金融投研类B端后台系统，重点是稳重、紧凑、高密度、数据优先。

2. 整体设计原则

- 页面风格：白色内容面板 + 浅灰页面背景 + 深蓝主色 + 高密度表格。
- 业务气质：金融、投研、稳重、克制、专业。
- 信息组织：表格优先，筛选区紧凑，操作区清晰，数据层级明确。
- 视觉控制：不做营销化页面，不做大面积渐变，不做大圆角卡片，不做花哨插画。
- 组件策略：基于 Vue2 + ElementUI 实现，通过项目CSS覆盖颜色、尺寸、字体和间距。
- AI生成页面时，不能引入新的视觉语言，不能套用 Ant Design、Material Design、Tailwind、Glassmorphism 等风格。

3. 色彩规范

3.1 品牌色

| 用途 | 色值 | 说明 |
|---|---|---|
| 主品牌蓝 | #2743A4 | 主按钮、链接、选中态、菜单激活、Tab激活 |
| 品牌深蓝 | #1F3683 | hover、active、按钮按下态 |
| 品牌浅蓝底 | #E9ECF6 | 选中浅底、菜单hover、弱选中态 |
| 辅助蓝 | #4D6CA0 | 图表辅助线、弱品牌表达 |
| 品牌金 | #D1A777 | 排名、评级、重点推荐、分类标题强调 |
| 金色文字 | #A7865F | 金色浅底上的文字 |

3.2 中性色

| 用途 | 色值 | 说明 |
|---|---|---|
| 页面背景 | #F7F8FA | 页面底色、表头底色、浅色分区 |
| 内容背景 | #FFFFFF | 卡片、表格、弹窗、输入框 |
| 一级文字 | #242933 | 标题、表头、重要文字 |
| 正文文字 | #3F485A | 表格正文、表单值、普通文本 |
| 次级文字 | #707783 | 次要说明、字段说明 |
| 弱提示文字 | #9199BD | placeholder、辅助说明、图表轴文字 |
| 默认边框 | #E5E5E5 | 表格线、输入框边框、分割线 |
| 禁用底色 | #F6F6F6 | 禁用控件、弱按钮背景 |
| 禁用文字 | #CCCCCC | 禁用文字、禁用图标 |

3.3 状态色

| 状态 | 色值 | 浅底 | 使用场景 |
|---|---|---|---|
| 成功 | #06C687 | #E7F9F3 | 通过、生效、成功状态 |
| 强成功 | #32CD32 | #E7F9F3 | 图表正向高亮、强成功表达 |
| 危险 | #FF4542 | #FFEDEC | 错误、拒绝、删除、风险提示 |
| 警告 | #FFC802 | #FFF4CC | 待处理、预警、提示 |
| 橙色 | #F5822E | #FDE6D5 | 中性提醒、评级状态 |
| 推荐 | #F97A6D | #FFEDEC | 推荐理由、重点推荐 |

3.4 金融数据颜色

- 国内基金、证券业务中，涨跌颜色需要结合具体业务确认。
- 默认规则：
  - 正向、盈利、通过：#06C687
  - 负向、亏损、拒绝：#FF4542
  - 中性、无变化：#3F485A
- 如果页面明确采用“上涨红、下跌绿”，则：
  - 上涨、正收益：#FF4542
  - 下跌、负收益：#06C687
- 同一个页面内必须保持一致，不允许同一语义使用两套颜色。

3.5 色彩使用限制

- 禁止使用 ElementUI 默认主色 #409EFF。
- 禁止新增主色、辅助色、状态色。
- 禁止大面积使用 #2743A4 作为页面背景。
- 金色只用于业务强调，不用于大面积铺底。
- 状态色必须有业务语义，不能作为装饰色随意使用。

4. 字体规范

4.1 字体族

```css
font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

- 不强制引入字体文件。
- PingFangSC-Regular 用 font-weight: 400 表达。
- PingFangSC-Medium 用 font-weight: 500 表达。
- PingFangSC-Semibold 用 font-weight: 600 表达。

4.2 字号层级

| 场景 | 字号 | 行高 | 字重 | 颜色 |
|---|---:|---:|---:|---|
| 页面大标题 | 20px / 22px | 28px / 30px | 600 | #242933 |
| 指标大数字 | 24px / 28px | 32px / 34px | 600 | 按业务语义 |
| 模块标题 | 16px | 24px | 600 | #242933 |
| 三级标题 | 14px | 22px | 600 | #242933 |
| 正文 | 13px / 14px | 22px | 400 | #3F485A |
| 表格正文 | 13px | 22px | 400 | #3F485A |
| 表格表头 | 13px | 22px | 600 | #242933 |
| 表单Label | 13px | 22px | 400 | #3F485A |
| 输入框文字 | 13px | 22px | 400 | #3F485A |
| 按钮文字 | 13px / 14px | 20px | 500 | 按按钮类型 |
| 标签文字 | 12px | 20px | 400 | 按状态 |
| 辅助说明 | 12px | 20px | 400 | #9199BD |

4.3 排版规则

- 后台页面默认字号优先使用 13px。
- 普通正文可使用 14px，但表格、表单、标签优先使用 13px。
- 标题、表头使用 600，不要大面积加粗。
- 金额、收益率、排名、评分等数字建议右对齐。
- 纯数字展示可使用：

```css
font-variant-numeric: tabular-nums;
```

5. 间距规范

5.1 基础间距

| Token | 值 | 使用场景 |
|---|---:|---|
| xxs | 4px | 图标与文字、小间隔 |
| xs | 8px | 按钮间距、表单内部间距 |
| sm | 12px | 标签间距、工具栏间距 |
| md | 16px | 卡片内边距、查询区内边距 |
| lg | 20px | 页面内容内边距、弹窗正文 |
| xl | 24px | 页面大区块、弹窗头尾 |
| xxl | 32px | 大模块分隔 |

5.2 布局规则

- 页面左右留白：20px / 24px。
- 卡片或面板内边距：16px。
- 查询区内边距：16px 20px。
- 表格上方工具栏与表格间距：12px。
- 表格与分页间距：16px。
- 表单项横向间距：16px / 24px。
- 按钮组间距：8px / 12px。

6. Border、Radius、Shadow

6.1 Border

| 类型 | 值 |
|---|---|
| 默认边框 | 1px solid #E5E5E5 |
| Hover边框 | 1px solid #CCCCCC |
| Focus边框 | 1px solid #2743A4 |
| Error边框 | 1px solid #FF4542 |
| 表格分割线 | 1px solid #E5E5E5 |

6.2 Radius

| 组件 | 圆角 |
|---|---:|
| Button | 4px |
| Input / Select / DatePicker | 4px |
| Card / Panel | 4px |
| Dialog / Drawer | 4px / 8px |
| Tag | 2px / 4px |
| Table单元格 | 0 |
| Tooltip / Popover | 4px |

6.3 Shadow

| 类型 | 值 | 使用场景 |
|---|---|---|
| 轻卡片 | 0 1px 2px rgba(67,96,148,0.10) | 少量轻面板 |
| 下拉浮层 | 0 2px 8px rgba(0,0,0,0.12) | Select、Dropdown、Popover |
| 弹窗 | 0 2px 10px rgba(0,0,0,0.12) | Dialog |
| 固定列 | 0 0 8px rgba(0,0,0,0.07) | Table固定列 |

- 常规页面不依赖强阴影建立层级。
- 优先使用白底、边框、间距和分割线。

7. 图标规范

| 尺寸 | 使用场景 |
|---|---|
| 12px | 小箭头、排序、下拉辅助 |
| 14px | 表格操作、局部小图标 |
| 16px | 菜单、按钮、输入框尾图标、刷新导出 |
| 24px | 顶部通知、用户操作 |
| 32px | 空状态、重点操作、较大业务图标 |

- 图标默认颜色：#707783 / #9199BD。
- 图标激活颜色：#2743A4。
- 图标禁用颜色：#CCCCCC。
- 图标与文字间距：4px / 8px。
- 优先复用项目已有 SVG / PNG 资源，不随意新增风格不同的图标。

8. 页面布局规范

8.1 标准列表页

```text
页面标题
查询区
工具栏
表格
分页
```

- 页面背景：#F7F8FA。
- 内容面板：#FFFFFF。
- 查询区、工具栏、表格可放在同一个白色内容区内。
- 不要多层卡片嵌套。

8.2 查询区

- 白色背景。
- 内边距：16px 20px。
- 控件高度：32px。
- Label字号：13px。
- Label颜色：#3F485A。
- 控件横向紧凑排列。
- 查询按钮为主按钮，重置按钮为次按钮。
- 条件较多时支持展开收起。

8.3 工具栏

- 位于查询区和表格之间。
- 高度：32px。
- 左侧放新增、导入、批量操作。
- 右侧放导出、刷新、列设置。
- 按钮间距：8px / 12px。

8.4 详情页

```text
页面标题
基础信息区
Tabs
详情内容或表格
底部操作区
```

- 字段Label使用 #707783 / #9199BD。
- 字段值使用 #3F485A。
- 重要字段使用 #242933。

8.5 新增 / 编辑页

```text
页面标题
表单区
底部按钮区
```

- 表单控件高度：32px。
- 表单行间距：16px。
- 底部按钮右对齐。

9. ElementUI组件规范

9.1 Button

| 类型 | 背景 | 边框 | 文字 | 高度 | 圆角 |
|---|---|---|---|---:|---:|
| Primary | #2743A4 | #2743A4 | #FFFFFF | 32px | 4px |
| Primary Hover | #1F3683 | #1F3683 | #FFFFFF | 32px | 4px |
| Default | #FFFFFF | #E5E5E5 | #3F485A | 32px | 4px |
| Default Hover | #FFFFFF | #2743A4 | #2743A4 | 32px | 4px |
| Text | transparent | transparent | #2743A4 | 22px | 0 |
| Danger | #FF4542 | #FF4542 | #FFFFFF | 32px | 4px |
| Disabled | #F7F8FA | #E5E5E5 | #CCCCCC | 32px | 4px |

- 默认字号：13px / 14px。
- 默认字重：500。
- 默认padding：0 12px / 0 16px。
- 小按钮高度：28px。
- 同一个操作区最多一个主按钮。
- 查询区按钮顺序：查询、重置、展开收起。
- 禁止渐变按钮、胶囊按钮、大圆角按钮。

9.2 Input / Textarea

| 属性 | 值 |
|---|---|
| 高度 | 32px |
| 字号 | 13px |
| 圆角 | 4px |
| 边框 | #E5E5E5 |
| Hover边框 | #CCCCCC |
| Focus边框 | #2743A4 |
| 文字 | #3F485A |
| Placeholder | #9199BD |
| Disabled背景 | #F7F8FA |
| Error颜色 | #FF4542 |

- 输入框padding：0 12px。
- 带图标输入框右侧预留 32px。
- Textarea 字号保持 13px，行高 22px。
- Textarea 不解析 br，换行使用真实换行符。

9.3 Select / Cascader

- 高度：32px。
- 字号：13px。
- 圆角：4px。
- 边框：#E5E5E5。
- Focus边框：#2743A4。
- Placeholder：#9199BD。
- 下拉图标：12px / 16px。
- 下拉项高度：32px。
- 选中项文字：#2743A4。
- Hover背景：#F7F8FA / #E9ECF6。

9.4 Checkbox / Radio

| 属性 | 值 |
|---|---|
| 尺寸 | 16px |
| 字号 | 13px |
| 文字颜色 | #3F485A |
| 选中颜色 | #2743A4 |
| 默认边框 | #E5E5E5 |
| 禁用文字 | #CCCCCC |
| 组内间距 | 16px |

- 表格多选框必须垂直居中。
- CheckboxGroup、RadioGroup 不允许使用新的颜色体系。

9.5 Switch

| 属性 | 值 |
|---|---|
| 高度 | 20px |
| 宽度 | 40px |
| 开启颜色 | #2743A4 |
| 关闭颜色 | #CCCCCC |
| 禁用颜色 | #E5E5E5 |

9.6 DatePicker / TimePicker

- 高度：32px。
- 字号：13px。
- 圆角：4px。
- 边框：#E5E5E5。
- 图标尺寸：16px。
- Focus颜色：#2743A4。
- 日期选中背景：#2743A4。
- 日期范围浅底：#E9ECF6。

9.7 Form

| 属性 | 值 |
|---|---|
| Label字号 | 13px |
| Label颜色 | #3F485A |
| 查询区Label宽度 | 72px / 80px |
| 复杂表单Label宽度 | 96px / 120px |
| 控件高度 | 32px |
| 行间距 | 16px |
| 列间距 | 16px / 24px |
| 必填星号 | #FF4542 |
| 错误提示 | 12px / #FF4542 |

- 查询表单使用横向紧凑布局。
- 编辑表单可使用两列。
- 长字段单独占一整行。

9.8 Table

| 属性 | 值 |
|---|---|
| 表头背景 | #F7F8FA |
| 表头文字 | 13px / 600 / #242933 |
| 表体文字 | 13px / 400 / #3F485A |
| 表头高度 | 40px |
| 行高 | 40px / 44px，紧凑场景可接近32px |
| 单元格横向padding | 8px / 12px |
| 边框 | #E5E5E5 |
| Hover行 | #F7F8FA / #E9ECF6弱化色 |
| 选中行 | #E9ECF6 |
| 空状态 | 暂无数据 |

- 表格是项目核心组件，优先保证扫描效率。
- 数字列右对齐。
- 文本列左对齐。
- 状态列可居中。
- 操作列使用文字按钮，颜色 #2743A4。
- 危险操作使用 #FF4542。
- 固定列阴影要轻，不使用重黑阴影。
- 复杂表头保持 #F7F8FA 背景和 #E5E5E5 分割线。

9.9 Pagination

- 高度：32px。
- 字号：13px。
- 位置：表格下方 16px，右对齐。
- 当前页颜色：#2743A4。
- 边框：#E5E5E5。
- 禁用：#CCCCCC。
- 推荐布局：total、sizes、prev、pager、next、jumper。

9.10 Tabs

| 层级 | 样式 |
|---|---|
| 一级Tab | 文字13px / 14px，激活色#2743A4，下划线2px |
| 二级标签 | 高32px，选中背景#2743A4，文字白色 |
| 三级分段 | 高28px，选中项高24px，选中背景#2743A4 |

- 默认文字：#3F485A。
- Hover文字：#2743A4。
- Active文字：#2743A4，字重 500 / 600。
- 不使用重卡片式入口替代Tabs。

9.11 Dialog

| 属性 | 值 |
|---|---|
| 小弹窗宽度 | 420px |
| 中弹窗宽度 | 560px / 640px |
| 复杂弹窗宽度 | 800px |
| 圆角 | 4px / 8px |
| Header高度 | 48px |
| Header内边距 | 0 24px |
| 标题 | 16px / 600 / #242933 |
| Body内边距 | 20px 24px |
| Footer内边距 | 12px 24px 20px |
| 按钮位置 | 右对齐 |

- 弹窗内容不使用过大留白。
- 删除、拒绝等危险操作必须二次确认。

9.12 Drawer

- 宽度：480px / 640px，复杂详情可 720px。
- 背景：#FFFFFF。
- Header高度：48px。
- 标题：16px / 600。
- Body内边距：20px 24px。
- 用于详情、审批记录、辅助编辑，不替代主页面。

9.13 Menu

| 状态 | 样式 |
|---|---|
| 默认 | 文字#3F485A，图标默认态 |
| Hover | 背景#E9ECF6，文字#2743A4 |
| Active | 背景#E9ECF6，文字#2743A4，图标选中态 |
| Disabled | 文字#CCCCCC，图标禁用态 |

- 菜单图标：16px。
- 菜单文字：13px / 14px。
- 展开宽度：200px / 220px / 240px。
- 折叠宽度：56px / 64px。

9.14 Card / Panel

- 背景：#FFFFFF。
- 圆角：4px。
- Padding：16px。
- 边框：1px solid #E5E5E5 或无边框。
- 默认无阴影。
- 不允许多层卡片嵌套。

9.15 Tag

| 状态 | 文字 | 背景 |
|---|---|---|
| 成功 | #06C687 | #E7F9F3 |
| 待处理 | #A7865F / #FFC802 | #FFF4CC |
| 失败 | #FF4542 | #FFEDEC |
| 普通 | #707783 | #F7F8FA |
| 推荐 | #D1A777 | #F6EDE4 |
| 橙色警示 | #F5822E | #FDE6D5 |

- 高度：22px / 24px。
- 字号：12px。
- 圆角：2px / 4px。
- 不新增随机颜色Tag。

9.16 Upload

- 上传按钮使用 Default 或 Primary Button。
- 上传区域边框：1px dashed #E5E5E5。
- Hover边框：#2743A4。
- 提示文字：12px / #9199BD。
- 错误提示：#FF4542。
- 导入弹窗必须包含模板下载、上传、校验结果、确认按钮。

9.17 Tooltip / Popover / Dropdown

- 圆角：4px。
- 阴影：0 2px 8px rgba(0,0,0,0.12)。
- 字号：12px / 13px。
- 正文颜色：#3F485A。
- 弱提示：#9199BD。
- 菜单项高度：32px。
- Hover背景：#F7F8FA / #E9ECF6。

9.18 Message / Notification

- 成功：#06C687。
- 警告：#FFC802。
- 错误：#FF4542。
- 信息：#2743A4 / #9199BD。
- 文字字号：13px / 14px。
- 圆角：4px。
- 不使用新的状态色。

9.19 Breadcrumb

- 字号：12px / 13px。
- 默认颜色：#9199BD。
- 当前页颜色：#3F485A。
- 分隔符颜色：#CCCCCC。
- 只在层级较深页面使用，不强制所有页面展示。

9.20 Empty / Loading

- 空状态文案：暂无数据。
- 空状态文字：14px / #9199BD。
- 空状态图标优先使用项目缺省图。
- 表格Loading保持表头显示。
- 局部Loading使用白色轻遮罩。
- 按钮Loading时保持按钮宽度不跳动。

10. 图表规范

- 图表背景：#FFFFFF。
- 主序列颜色：#2743A4。
- 对比序列：#D1A777 / #4D6CA0。
- 坐标轴文字：#9199BD。
- 网格线：#E5E5E5。
- 图例字号：12px / 13px。
- 收益、涨跌、正负方向按金融数据颜色规则处理。
- 不使用随机多彩配色。
- 图表不可抢占表格主信息层级。

11. 数据展示规范

- 金额、收益率、排名、评分等数字右对齐。
- 百分比、小数、金额字段保持同列小数位一致。
- 空单元格保持空白，不默认使用 - 或 --。
- 关键指标可使用 20px / 22px / 24px / 28px。
- 表格内普通数据保持 13px。
- 排名、评级、重点推荐可用蓝色或金色强调，但不能整列过度高亮。

12. CSS变量建议

```css
:root {
  --color-primary: #2743A4;
  --color-primary-hover: #1F3683;
  --color-primary-light: #E9ECF6;
  --color-bg-page: #F7F8FA;
  --color-bg-panel: #FFFFFF;

  --color-text-primary: #242933;
  --color-text-regular: #3F485A;
  --color-text-secondary: #707783;
  --color-text-placeholder: #9199BD;
  --color-text-disabled: #CCCCCC;

  --color-border: #E5E5E5;
  --color-border-hover: #CCCCCC;

  --color-success: #06C687;
  --color-success-light: #E7F9F3;
  --color-warning: #FFC802;
  --color-warning-light: #FFF4CC;
  --color-danger: #FF4542;
  --color-danger-light: #FFEDEC;
  --color-orange: #F5822E;
  --color-orange-light: #FDE6D5;
  --color-gold: #D1A777;
  --color-gold-dark: #A7865F;

  --font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-number: 24px;

  --line-height-xs: 20px;
  --line-height-sm: 22px;
  --line-height-md: 24px;
  --line-height-lg: 30px;

  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 20px;
  --space-xl: 24px;
  --space-xxl: 32px;

  --radius-base: 4px;
  --radius-small: 2px;
  --radius-large: 8px;

  --shadow-popup: 0 2px 8px rgba(0,0,0,0.12);
  --shadow-dialog: 0 2px 10px rgba(0,0,0,0.12);
  --shadow-table-fixed: 0 0 8px rgba(0,0,0,0.07);
}
```

13. ElementUI覆盖重点

```scss
$--color-primary: #2743A4;
$--color-success: #06C687;
$--color-warning: #FFC802;
$--color-danger: #FF4542;
$--color-info: #9199BD;

$--font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
$--font-size-base: 13px;
$--font-size-small: 12px;
$--font-size-medium: 14px;
$--font-size-large: 16px;

$--border-color-base: #E5E5E5;
$--border-radius-base: 4px;

$--button-font-size: 13px;
$--button-border-radius: 4px;
$--input-height: 32px;
$--input-border-color: #E5E5E5;
$--table-header-background-color: #F7F8FA;
$--table-border-color: #E5E5E5;
```

14. AI页面开发约束

14.1 必须遵守

- 必须使用 Vue2 + ElementUI 风格。
- 必须使用本文档中的颜色、字体、字号、圆角、间距。
- 主色必须是 #2743A4。
- 页面背景必须优先使用 #F7F8FA。
- 内容区域必须优先使用 #FFFFFF。
- 表格字号必须优先使用 13px。
- 查询区控件高度必须为 32px。
- 按钮高度必须为 32px。
- 表格表头必须使用 #F7F8FA。
- 表格边框必须使用 #E5E5E5。
- 弹窗、表单、分页、Tabs 必须保持本文档风格。

14.2 禁止事项

- 禁止使用 ElementUI 默认蓝 #409EFF。
- 禁止新增主色或新的状态色。
- 禁止使用大面积渐变背景。
- 禁止使用营销式Hero区域。
- 禁止使用大插画、大卡片堆叠、大圆角风格。
- 禁止使用 Ant Design、Material Design、Tailwind、MacOS、Glass 风格。
- 禁止引入新的字体。
- 禁止随意扩大字号和行高。
- 禁止把普通后台页面做成低密度展示页。
- 禁止在同一个操作区出现多个同权重主按钮。
- 禁止表格内随机使用颜色强调。
- 禁止空单元格默认填充 - 或 --。

14.3 推荐生成结构

```text
列表页：
页面标题
查询区
工具栏
表格
分页

详情页：
页面标题
基础信息
Tabs
详情表格或字段区
底部操作

编辑页：
页面标题
表单区
底部按钮

弹窗表单：
弹窗标题
表单内容
底部按钮
```

15. 落地优先级

1. 先统一全局字体、页面背景、正文颜色。
2. 再统一 ElementUI 主按钮、输入框、选择框、表单。
3. 然后统一表格表头、边框、字号、行高。
4. 再统一弹窗、Tabs、分页、Tag、Tooltip、Popover。
5. 最后处理各页面独有的图表、业务卡片、状态色和图标。

16. 总结

- 项目核心风格：金融后台、白底、浅灰背景、深蓝主色、高密度表格。
- 核心主色：#2743A4。
- 核心字体：PingFang SC / Microsoft YaHei。
- 核心字号：13px、14px、16px、20px、24px。
- 核心控件高度：32px。
- 核心圆角：4px。
- 核心边框：#E5E5E5。
- 核心页面结构：查询区 + 工具栏 + 表格 + 分页。
- 后续所有页面开发和AI生成页面，都必须以本文档为准。
