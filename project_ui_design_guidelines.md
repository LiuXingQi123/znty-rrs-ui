项目UI设计规范-精简版

1. 文档定位

- 本文档用于约束 znty-sirm-ui 后续页面开发、页面重构、AI生成页面和UI走查。
- 本规范基于以下三份文件合并精简：
  - project_ui_design_guidelines_deepseek.md
  - project_ui_design_guidelines_gemini.md
  - project_ui_design_guidelines_gpt.md
- 后续新增页面、组件封装、ElementUI样式覆盖，优先遵守本文档。
- 本项目整体风格为金融投研类B端后台系统，重点是稳重、紧凑、高密度、数据优先。

2. ElementUI 落地原则

- 本规范不是要求复刻切图 DOM 或逐像素重写 ElementUI。实现时优先使用 ElementUI 原生能力，视觉差异在可接受范围内时不新增样式。
- 查询区、表单区、工具栏默认使用 ElementUI `size="small"`，承接约 32px 的控件密度；只有高密度表格、特殊业务看板等场景允许额外压缩。
- Button、Input、Select、DatePicker、Form、Pagination 等基础组件优先按 ElementUI `small` 尺寸落地，不强制逐项精确到设计稿像素。
- Select、DatePicker、Pagination、Tabs、Dialog 等复杂组件优先保持 ElementUI 默认 DOM 和交互结构，只覆盖明显的主色、字体、边框、选中态和 hover 态。
- 新增 CSS 覆盖应优先进入公共样式层，避免在多个页面复制相同 ElementUI 覆盖规则。
- 若某设计值与 ElementUI 默认实现冲突，优先选择维护成本更低、交互稳定的 ElementUI 实现。
- 单页特殊样式必须有明确业务原因，不能为了统一视觉而大面积追加页面级内部选择器。

3. 重要：页面级样式作用域与冗余控制原则

- 页面内新增或修改 CSS 时，默认必须限定在当前页面根容器 id 下，例如 `#page_root .class-name`，避免样式污染其他页面或被其他页面样式意外覆盖。
- 页面根容器 id 应与当前 HTML 页面或 Vue 实例语义保持一致；同一页面内的业务样式、ElementUI 覆盖样式和状态样式都应优先加此前缀。
- 只有全项目确需共享的基础样式、公共变量、公共重置样式，才允许不加页面根 id；此类样式应放在公共样式层或明确标注为全局样式。
- 新增样式前必须先搜索当前页面和项目内是否已有同类样式；如果已有稳定写法，应优先复用、移动或小范围调整，不重新生成一套近似样式。
- 同类内容一致性也适用于 CSS：同类查询区、分页、表格字段、状态 Tag、弹窗、选择面板和业务功能片段，应尽量复用同一套类名、选择器层级、变量和样式规则。
- 发现历史迭代留下的重复、冲突或过期样式时，应在确认无引用或确认被新基准覆盖后再清理；不得盲目删除可能仍被页面使用的样式。
- 禁止为了单次修改在页面末尾不断追加重复覆盖规则；确需覆盖时，应优先合并到已有同类样式块，并保留最小必要选择器。

4. 重要：同类内容与复用场景一致性原则

- 同类内容一致性是本项目 UI 规范的强制要求，优先级高于单个页面的局部美化或临时样式偏好。
- 同一个项目中，相同类型的页面区域、组件、字段、状态、弹窗、抽屉、选择面板和业务功能片段，必须保持一致的样式、结构、交互和展示形式。
- 不仅分页、查询条件、表格字段、状态 Tag、评级字段等局部元素需要一致；完整功能片段也需要一致，例如同类选择弹窗、同类导入弹窗、同类详情弹窗、同类审核弹窗、同类业务选择面板、同类列表选择器等。
- 新增页面或 AI 生成页面前，必须先在项目中查找同类实现；如果已有稳定写法，应优先复用其布局、按钮位置、表格列组织、查询区结构、空状态、交互流程和视觉样式。
- 同一业务语义不得在不同页面使用不同颜色、不同标签形态、不同对齐方式、不同文案格式或不同操作布局。
- 同类弹窗和功能片段应统一标题区、查询区、内容区、底部按钮区、加载状态、空状态、选择状态、确认/取消按钮位置和反馈方式。
- 如确需差异化展示，必须有明确业务原因；差异应控制在必要范围内，不得因为页面单独生成、AI 生成或局部实现而形成另一套视觉和交互模式。

5. 整体设计原则

- 页面风格：白色内容面板 + 浅灰页面背景 + 深蓝主色 + 高密度表格。
- 业务气质：金融、投研、稳重、克制、专业。
- 信息组织：表格优先，筛选区紧凑，操作区清晰，数据层级明确。
- 视觉控制：不做营销化页面，不做大面积渐变，不做大圆角卡片，不做花哨插画。
- 组件策略：基于 Vue2 + ElementUI 实现，通过项目CSS覆盖颜色、字体、表格密度、边框、圆角等高频项。
- AI生成页面时，不能引入新的视觉语言，不能套用 Ant Design、Material Design、Tailwind、Glassmorphism 等风格。

6. 色彩规范

6.1 品牌色

| 用途 | 色值 | 说明 |
|---|---|---|
| 主品牌蓝 | #2743A4 | 主按钮、链接、选中态、菜单激活、Tab激活 |
| 品牌深蓝 | #1F3683 | hover、active、按钮按下态 |
| 品牌浅蓝底 | #E9ECF6 | 选中浅底、菜单hover、弱选中态 |
| 辅助蓝 | #4D6CA0 | 图表辅助线、弱品牌表达 |
| 品牌金 | #D1A777 | 排名、评级、重点推荐、分类标题强调 |
| 金色文字 | #A7865F | 金色浅底上的文字 |

6.2 中性色

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

6.3 状态色

| 状态 | 色值 | 浅底 | 使用场景 |
|---|---|---|---|
| 成功 | #06C687 | #E7F9F3 | 通过、生效、成功状态 |
| 强成功 | #32CD32 | #E7F9F3 | 图表正向高亮、强成功表达 |
| 危险 | #FF4542 | #FFEDEC | 错误、拒绝、删除、风险提示 |
| 警告 | #FFC802 | #FFF4CC | 待处理、预警、提示 |
| 橙色 | #F5822E | #FDE6D5 | 中性提醒、评级状态 |
| 推荐强调 | #F97A6D | 按业务场景 | 推荐理由、重点推荐局部强调 |

6.4 金融数据颜色

- 国内基金、证券业务中，涨跌颜色需要结合具体业务确认。
- 默认规则：
  - 正向、盈利、通过：#06C687
  - 负向、亏损、拒绝：#FF4542
  - 中性、无变化：#3F485A
- 如果页面明确采用“上涨红、下跌绿”，则：
  - 上涨、正收益：#FF4542
  - 下跌、负收益：#06C687
- 具体页面以业务字段语义为准，收益、涨跌、通过、拒绝等场景不得只按正负号机械套色。
- 同一个页面内必须保持一致，不允许同一语义使用两套颜色。

6.5 色彩使用限制

- 禁止使用 ElementUI 默认主色 #409EFF。
- 禁止新增主色、辅助色、状态色。
- 禁止大面积使用 #2743A4 作为页面背景。
- 金色只用于业务强调，不用于大面积铺底。
- 状态色必须有业务语义，不能作为装饰色随意使用。

7. 字体规范

7.1 字体族

```css
font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

- 不强制引入字体文件。
- PingFangSC-Regular 用 font-weight: 400 表达。
- PingFangSC-Medium 用 font-weight: 500 表达。
- PingFangSC-Semibold 用 font-weight: 600 表达。

7.2 字号层级

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

7.3 排版规则

- 后台页面默认字号优先使用 13px。
- 普通正文可使用 14px，但表格、表单、标签优先使用 13px。
- 标题、表头使用 600，不要大面积加粗。
- 金额、收益率、排名、评分等数字建议右对齐。
- 纯数字展示可使用：

```css
font-variant-numeric: tabular-nums;
```

8. 间距规范

8.1 基础间距

| Token | 值 | 使用场景 |
|---|---:|---|
| xxs | 4px | 图标与文字、小间隔 |
| xs | 8px | 按钮间距、表单内部间距 |
| sm | 12px | 标签间距、工具栏间距 |
| md | 16px | 卡片内边距、查询区内边距 |
| lg | 20px | 页面内容内边距、弹窗正文 |
| xl | 24px | 页面大区块、弹窗头尾 |
| xxl | 32px | 大模块分隔 |

8.2 布局规则

- 页面左右留白：20px / 24px。
- 卡片或面板内边距：16px。
- 查询区内边距：16px 20px。
- 表格上方工具栏与表格间距：12px。
- 表格与分页间距：16px。
- 表单项横向间距：16px / 24px。
- 按钮组间距：8px / 12px。

9. Border、Radius、Shadow

9.1 Border

| 类型 | 值 |
|---|---|
| 默认边框 | 1px solid #E5E5E5 |
| Hover边框 | 1px solid #CCCCCC |
| Focus边框 | 1px solid #2743A4 |
| Error边框 | 1px solid #FF4542 |
| 表格分割线 | 1px solid #E5E5E5 |

9.2 Radius

| 组件 | 圆角 |
|---|---:|
| Button | 4px |
| Input / Select / DatePicker | 4px |
| Card / Panel | 4px |
| Dialog / Drawer | 4px / 8px |
| Tag | 2px / 4px |
| Table单元格 | 0 |
| Tooltip / Popover | 4px |

9.3 Shadow

| 类型 | 值 | 使用场景 |
|---|---|---|
| 轻卡片 | 0 1px 2px rgba(67,96,148,0.10) | 少量轻面板 |
| 下拉浮层 | 0 2px 8px rgba(0,0,0,0.12) | Select、Dropdown、Popover |
| 弹窗 | 0 2px 10px rgba(0,0,0,0.12) | Dialog |
| 固定列 | 0 0 8px rgba(0,0,0,0.07) | Table固定列 |

- 常规页面不依赖强阴影建立层级。
- 优先使用白底、边框、间距和分割线。

10. 图标规范

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

11. 页面布局规范

11.1 标准列表页

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

11.2 查询区

- 白色背景。
- 内边距：16px 20px。
- 控件优先使用 ElementUI `size="small"`，实际高度约 32px。
- Label字号：13px。
- Label颜色：#3F485A。
- 控件横向紧凑排列。
- 查询按钮为主按钮，重置按钮为次按钮。
- 条件较多时支持展开收起。

11.3 工具栏

- 位于查询区和表格之间。
- 工具按钮优先使用 ElementUI `size="small"`，整体高度约 32px。
- 左侧放新增、导入、批量操作。
- 右侧放导出、刷新、列设置。
- 按钮间距：8px / 12px。

11.4 详情页

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

11.5 新增 / 编辑页

```text
页面标题
表单区
底部按钮区
```

- 表单控件优先使用 ElementUI `size="small"`，实际高度约 32px。
- 表单行间距：16px。
- 底部按钮右对齐。

12. ElementUI组件规范

12.1 Button

| 类型 | 背景 | 边框 | 文字 | 高度 | 圆角 |
|---|---|---|---|---:|---:|
| Primary | #2743A4 | #2743A4 | #FFFFFF | 跟随 small | 跟随 ElementUI |
| Primary Hover | #1F3683 | #1F3683 | #FFFFFF | 跟随 small | 跟随 ElementUI |
| Default | #FFFFFF | #E5E5E5 | #3F485A | 跟随 small | 跟随 ElementUI |
| Default Hover | #FFFFFF | #2743A4 | #2743A4 | 跟随 small | 跟随 ElementUI |
| Text | transparent | transparent | #2743A4 | 22px | 0 |
| Danger | #FF4542 | #FF4542 | #FFFFFF | 跟随 small | 跟随 ElementUI |
| Disabled | #F7F8FA | #E5E5E5 | #CCCCCC | 跟随 small | 跟随 ElementUI |

- 默认字号：13px / 14px。
- 默认字重：500。
- 高度、padding、圆角优先跟随 ElementUI `size="small"`，不要求为每种按钮单独定义完整 CSS。
- 小按钮使用 ElementUI `mini` 或 `small`，不强制精确 28px。
- 同一个操作区最多一个主按钮。
- 查询区按钮顺序：查询、重置、展开收起。
- 禁止渐变按钮、胶囊按钮、大圆角按钮。

12.2 Input / Textarea

| 属性 | 值 |
|---|---|
| 高度 | 优先 ElementUI small，约 32px |
| 字号 | 13px |
| 圆角 | 跟随 ElementUI small，必要时统一为 4px |
| 边框 | #E5E5E5 |
| Hover边框 | #CCCCCC |
| Focus边框 | #2743A4 |
| 文字 | #3F485A |
| Placeholder | #9199BD |
| Disabled背景 | #F7F8FA |
| Error颜色 | #FF4542 |

- 输入框 padding 优先跟随 ElementUI small，不为普通输入框单独重写内部结构。
- 带图标输入框右侧预留 32px。
- Textarea 字号保持 13px，行高 22px。
- Textarea 不解析 br，换行使用真实换行符。

12.3 Select / Cascader

- 高度：优先 ElementUI `size="small"`，约 32px。
- 字号：13px。
- 圆角：跟随 ElementUI small，必要时统一为 4px。
- 边框：#E5E5E5。
- Focus边框：#2743A4。
- Placeholder：#9199BD。
- 下拉图标：12px / 16px。
- 下拉项高度优先跟随 ElementUI 默认 small，不强制逐项重写。
- 选中项文字：#2743A4。
- Hover背景：#F7F8FA / #E9ECF6。
- 不强制改写下拉面板所有内部项，只覆盖明显的主色选中态和 hover 态。

12.4 Checkbox / Radio

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

12.5 Switch

| 属性 | 值 |
|---|---|
| 高度 | 20px |
| 宽度 | 40px |
| 开启颜色 | #2743A4 |
| 关闭颜色 | #CCCCCC |
| 禁用颜色 | #E5E5E5 |

12.6 DatePicker / TimePicker

- 高度：优先 ElementUI `size="small"`，约 32px。
- 字号：13px。
- 圆角：跟随 ElementUI small，必要时统一为 4px。
- 边框：#E5E5E5。
- 图标尺寸：16px。
- Focus颜色：#2743A4。
- 日期选中背景：#2743A4。
- 日期范围浅底：#E9ECF6。
- 不强制改写日期面板所有内部项，只覆盖主色选中态、范围浅底和明显 hover 态。

12.7 Form

| 属性 | 值 |
|---|---|
| Label字号 | 13px |
| Label颜色 | #3F485A |
| 查询区Label宽度 | 72px / 80px |
| 复杂表单Label宽度 | 96px / 120px |
| 控件高度 | 优先 ElementUI small，约 32px |
| 行间距 | 16px |
| 列间距 | 16px / 24px |
| 必填星号 | #FF4542 |
| 错误提示 | 12px / #FF4542 |

- 查询表单使用横向紧凑布局。
- 编辑表单可使用两列。
- 长字段单独占一整行。

12.8 Table

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
- 优先使用 ElementUI `size="small"` 或局部表格 CSS 控制密度，不强制所有表格行高 32px。
- 表格实际行高会受 padding、字体、复杂单元格内容、操作按钮等影响，视觉稳定优先于逐像素压缩。
- 数字列右对齐。
- 文本列左对齐。
- 状态列可居中。
- 操作列使用文字按钮，颜色 #2743A4。
- 危险操作使用 #FF4542。
- 固定列阴影要轻，不使用重黑阴影。
- 复杂表头保持 #F7F8FA 背景和 #E5E5E5 分割线。

12.9 Pagination

- 高度优先跟随 ElementUI 默认或 small 形态，保持紧凑即可。
- 字号：13px。
- 位置：表格下方 16px，右对齐。
- 当前页颜色：#2743A4。
- 边框：#E5E5E5。
- 禁用：#CCCCCC。
- 推荐布局：total、sizes、prev、pager、next、jumper。
- 不强制逐项重写分页内部按钮尺寸。

12.10 Tabs

| 层级 | 样式 |
|---|---|
| 一级Tab | 优先 ElementUI Tabs，文字13px / 14px，激活色#2743A4，下划线2px |
| 二级标签 | 优先使用 ElementUI RadioGroup / ButtonGroup / Tabs 承接，高度跟随 small |
| 三级分段 | 优先使用 ElementUI RadioGroup / ButtonGroup 承接，高度跟随 mini / small |

- 默认文字：#3F485A。
- Hover文字：#2743A4。
- Active文字：#2743A4，字重 500 / 600。
- 不使用重卡片式入口替代Tabs。
- 保留 ElementUI 默认结构，不强制自定义多级 Tabs DOM。

12.11 Dialog

| 属性 | 值 |
|---|---|
| 小弹窗宽度 | 420px |
| 中弹窗宽度 | 560px / 640px |
| 复杂弹窗宽度 | 800px |
| 圆角 | 4px / 8px |
| Header | 优先保持 ElementUI 默认结构，标题 16px / 600 |
| 标题 | 16px / 600 / #242933 |
| Body内边距 | 20px 24px |
| Footer内边距 | 12px 24px 20px |
| 按钮位置 | 右对齐 |

- 弹窗内容不使用过大留白。
- 删除、拒绝等危险操作必须二次确认。
- 不强制重写所有 header / body / footer 内部尺寸，只统一标题、正文间距、底部按钮对齐和主色。

12.12 Drawer

- 宽度：480px / 640px，复杂详情可 720px。
- 背景：#FFFFFF。
- Header优先保持 ElementUI 默认结构。
- 标题：16px / 600。
- Body内边距：20px 24px。
- 用于详情、审批记录、辅助编辑，不替代主页面。
- 不强制重写所有内部尺寸，只统一标题、正文间距、底部按钮对齐和主色。

12.13 Menu

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

12.14 Card / Panel

- 背景：#FFFFFF。
- 圆角：4px。
- Padding：16px。
- 边框：1px solid #E5E5E5 或无边框。
- 默认无阴影。
- 不允许多层卡片嵌套。

12.15 Tag

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

12.16 Upload

- 上传按钮使用 Default 或 Primary Button。
- 上传区域边框：1px dashed #E5E5E5。
- Hover边框：#2743A4。
- 提示文字：12px / #9199BD。
- 错误提示：#FF4542。
- 导入弹窗必须包含模板下载、上传、校验结果、确认按钮。

12.17 Tooltip / Popover / Dropdown

- 圆角：4px。
- 阴影：0 2px 8px rgba(0,0,0,0.12)。
- 字号：12px / 13px。
- 正文颜色：#3F485A。
- 弱提示：#9199BD。
- 菜单项高度优先跟随 ElementUI 默认或 small 形态。
- Hover背景：#F7F8FA / #E9ECF6。
- 不强制重写 Tooltip、Popover、Dropdown 的全部内部结构。

12.18 Message / Notification

- 成功：#06C687。
- 警告：#FFC802。
- 错误：#FF4542。
- 信息：#2743A4 / #9199BD。
- 文字字号：13px / 14px。
- 圆角：4px。
- 不使用新的状态色。

12.19 Breadcrumb

- 字号：12px / 13px。
- 默认颜色：#9199BD。
- 当前页颜色：#3F485A。
- 分隔符颜色：#CCCCCC。
- 只在层级较深页面使用，不强制所有页面展示。

12.20 Empty / Loading

- 空状态文案：暂无数据。
- 空状态文字：14px / #9199BD。
- 空状态图标优先使用项目缺省图。
- 表格Loading保持表头显示。
- 局部Loading使用白色轻遮罩。
- 按钮Loading时保持按钮宽度不跳动。

13. 图表规范

- 图表背景：#FFFFFF。
- 主序列颜色：#2743A4。
- 对比序列：#D1A777 / #4D6CA0。
- 坐标轴文字：#9199BD。
- 网格线：#E5E5E5。
- 图例字号：12px / 13px。
- 收益、涨跌、正负方向按金融数据颜色规则处理。
- 不使用随机多彩配色。
- 图表不可抢占表格主信息层级。

14. 数据展示规范

- 金额、收益率、排名、评分等数字右对齐。
- 百分比、小数、金额字段保持同列小数位一致。
- 空单元格保持空白，不默认使用 - 或 --。
- 关键指标可使用 20px / 22px / 24px / 28px。
- 表格内普通数据保持 13px。
- 排名、评级、重点推荐可用蓝色或金色强调，但不能整列过度高亮。

15. CSS变量建议

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

16. ElementUI覆盖重点

当前项目通过 CDN 静态 HTML 方式引入 ElementUI，暂无 Sass 构建流程；这里的 CDN 静态 HTML 场景是指无构建流程、通过 `<link>` / `<script>` 直接引入依赖。公网 CDN 与公司内网 / 离线环境的本地依赖写法按运行环境选择，不强制二选一。以下 `$--xxx` 变量仅作为未来接入 ElementUI 主题编译时的参考；当前实际落地应使用公共 CSS 或页面 CSS 覆盖，不应为了使用这些变量新增构建流程。

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

当前静态 HTML 直接引入依赖的场景下，优先通过公共 CSS 覆盖以下高频项：

- body 字体、页面背景、正文颜色。
- Primary Button 主色、hover 色、文字按钮色、危险色。
- Input / Select / DatePicker 的字号、边框色、focus 主色。
- Table 表头背景、表格字号、边框色、hover / selected 行背景。
- Tabs 激活色、Dialog 标题与正文间距、Tag 状态色。

17. 重要：修改范围与功能完整性原则

- 修改现有页面前，必须先阅读并理解当前页面结构、交互流程、样式实现、接口请求、字段展示和业务状态，不得在不了解原实现的情况下直接重写。
- 页面大型修改、样式统一、AI 生成改造或组件替换时，必须保留原页面已有功能、字段、按钮、弹窗、校验、请求、状态展示、空状态、加载状态和交互流程。
- 本次需求未要求修改的功能和表现，默认必须保持原样；不得因为重构、统一风格、简化实现或赶进度而删减、弱化或替换。
- 只允许修改用户明确要求的范围，以及为完成该需求确实必需的最小关联范围。
- 不得把原页面中已经存在的业务效果改成低配版本；如果必须调整，应保证功能等价、信息完整、交互路径不减少。
- 如果发现原页面存在历史问题、冗余代码或风格不一致，应先记录问题并明确修改范围；未经确认不得顺手改动与当前任务无关的功能。
- 修改完成后，必须对照原页面检查：功能是否缺失、字段是否减少、按钮是否丢失、弹窗是否缺少内容、校验是否弱化、接口调用是否改变、状态展示是否被删减。

18. AI页面开发约束

18.1 必须遵守

- 必须使用 Vue2 + ElementUI 风格。
- 必须使用本文档中的颜色、字体、字号、圆角、间距。
- 必须优先使用 ElementUI 原生组件、尺寸、状态和 DOM 结构。
- 主色必须是 #2743A4。
- 页面背景必须优先使用 #F7F8FA。
- 内容区域必须优先使用 #FFFFFF。
- 表格字号必须优先使用 13px。
- 查询区、表单区、工具栏默认使用 ElementUI `size="small"`，实际高度约 32px。
- 表格表头必须使用 #F7F8FA。
- 表格边框必须使用 #E5E5E5。
- 弹窗、表单、分页、Tabs 必须保持本文档风格。

18.2 禁止事项

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
- 禁止复制切图导出的绝对定位 DOM 作为业务页面实现。
- 禁止为了逐像素复刻设计稿而大量改写 Select、DatePicker、Pagination、Tabs 等复杂组件内部结构。
- 禁止页面级 CSS 不加当前页面根容器 id 前缀，公共样式、公共变量、公共重置样式除外。
- 禁止在页面末尾不断追加重复覆盖规则或生成近似重复样式。
- 禁止未确认引用关系就盲目删除历史样式。
- 禁止为同类组件、字段、弹窗、选择面板、业务功能片段新增另一套视觉或交互模式。
- 禁止未理解原页面结构、交互、接口、字段和状态就直接重写。
- 禁止删减、弱化或替换本次需求未要求修改的功能和表现。
- 禁止顺手改动当前任务无关的功能、接口、字段、按钮、弹窗、校验和状态展示。
- 禁止把原有业务效果改成低配版本。

18.3 推荐生成结构

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

19. 落地优先级

1. 先统一全局字体、页面背景、正文颜色。
2. 再统一 ElementUI 主按钮、输入框、选择框、表单的公共品牌色和 small 密度。
3. 然后统一表格表头、边框、字号、行高。
4. 再统一弹窗、Tabs、分页、Tag、Tooltip、Popover。
5. 最后处理各页面独有的图表、业务卡片、状态色和图标。

20. 开发与评审检查清单

| 检查项 | 标准 |
|---|---|
| ElementUI 使用 | 页面主要由 ElementUI 原生组件组成 |
| 控件密度 | 查询区、表单区、工具栏是否优先使用 `size="small"` |
| CSS 覆盖 | 是否只做公共品牌色、字体、表格、边框等必要覆盖 |
| 样式作用域 | 页面级 CSS 是否默认使用当前页面根容器 id 前缀 |
| 样式冗余 | 是否已复用或合并同类样式，未追加重复覆盖规则 |
| 复杂组件 | 是否避免为 Select、DatePicker、Pagination、Tabs 写大量页面级内部选择器 |
| 同类一致性 | 同类组件、字段、弹窗、选择面板和业务功能片段是否复用项目既有基准样式与交互 |
| 功能完整性 | 未要求修改的功能、字段、按钮、弹窗、校验、请求和状态展示是否保持原样 |
| 修改范围 | 是否只改用户要求和必要关联范围，未顺手改无关功能 |
| 切图实现 | 是否没有复制切图绝对定位 DOM |
| 主色 | 是否只使用 #2743A4 及其 hover / active |
| 背景 | 页面底是否为 #F7F8FA，内容面板是否为白色 |
| 表格 | 表头是否浅灰底、分割线是否统一、数字列是否对齐 |
| 状态色 | 是否归入成功、警告、危险、橙色、金色体系 |
| 空状态 | 是否使用既有缺省图或 ElementUI 空文案 |

21. 总结

- 项目核心风格：金融后台、白底、浅灰背景、深蓝主色、高密度表格。
- 核心主色：#2743A4。
- 核心字体：PingFang SC / Microsoft YaHei。
- 核心字号：13px、14px、16px、20px、24px。
- 核心控件密度：优先 ElementUI `size="small"`，实际高度约 32px。
- 核心圆角：4px。
- 核心边框：#E5E5E5。
- 核心页面结构：查询区 + 工具栏 + 表格 + 分页。
- 核心落地原则：优先 ElementUI 原生能力，少量公共 CSS 覆盖，不逐像素重写复杂组件。
- 后续所有页面开发和AI生成页面，都必须以本文档为准。
