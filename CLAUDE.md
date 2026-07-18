# 前端开发规范（CLAUDE.md）

> 适用项目：Vue 2.x 管理系统类前端项目（`znty-rrs-ui`）  
> 说明：本目录 `CLAUDE.md` 与 `AGENTS.md` 内容同步（仅文件名不同），修改时须两边同时更新。

> 仓库级总览（业务模块、调库三链路、常用命令等）见上级 `../CLAUDE.md` / `../AGENTS.md`。本文件聚焦前端编码约定与本工程架构要点，不重复上级文档已有内容。

---

## 技术栈

| 技术 | 版本 / 引入方式 | 用途 |
|------|----------------|------|
| Vue | 2.5.x（页面 CDN 或本地文件，以页面实际引用为准） | 核心框架 |
| Element UI | 2.15.x（同上） | UI 组件库 |
| Axios | 页面 CDN 或本地文件（**不要写死 latest**，以仓库内引用为准） | HTTP 请求 |
| ECharts | 按需在页面引入（有图表的页才引） | 图表可视化 |
| Moment.js | 按需在页面引入 | 日期时间处理 |
| JavaScript | ES6+ | 业务逻辑 |
| HTML5 | — | 页面结构 |

> 依赖通过各页 `<script>` / `<link>` 引入（无 npm 构建）。**版本以页面实际引用的 CDN 地址或本地文件为准**，本文表格仅作对照，避免写 `latest` 造成漂移。  
> 引入上述以外的第三方库前，必须先询问用户并获得确认。

---

## 整体架构

> 本节描述需要跨多个文件才能理清的"大局"；逐页语法规范见下方各节。

### 工作台 Shell + iframe 多页签

- `index.html` 是唯一的工作台外壳：左侧 `el-menu` 分组导航 + 顶部一级菜单（`primaryMenus`：研究管理 / 文档管理）+ 多页签 `iframe` 内容区。所有业务页都在 `pages/` 下，通过 `<iframe :src="tab.url">` 加载，页签之间相互隔离、可独立刷新。
- 菜单结构在 `index.html` 的 `primaryMenus` / `menuGroups` 数据里硬编码，每项形如 `{ index, title, icon, page: 'pages/xxx.html', primaryMenu }`。**新增业务页时必须同时在 `menuGroups` 注册菜单项**，否则无法从工作台进入——只把 `.html` 丢进 `pages/` 不会出现在菜单里。
- 页签 `url` 由 `window.RrsAuth.buildPageUrl(page, loginUser)` 生成，自动把当前登录用户拼成 `?loginUserId=...&loginUserName=...`；业务页在 iframe 内调 `RrsAuth.getCurrentUser()` 读取。

### 登录与用户上下文（`js/api.js` 中的 `window.RrsAuth`）

- `login.html` 是**纯前端演示登录**（无后端校验，演示用户密码统一 `123456`）：选中用户 → `RrsAuth.authenticate(...)` 写入 `localStorage`（key `rrs-login-user`）→ `buildPageUrl('index.html', user)` 跳转工作台。
- 业务页无登录信息时 `RrsAuth.getCurrentUser()` 兜底返回管理员 `{ userId: '1', userName: '管理员' }`，因此直接打开 `pages/xxx.html` 也能跑通布局，但提交后端时拿不到真实操作人。
- 业务页提交后端时，把 `loginUser.userId / userName` 作为字段传入（参考 `pages/script_tool.html` 的 `currentUserId / currentUserName`），后端按此记录操作人。

### 统一请求封装（`js/api.js`）

- `axios.defaults.baseURL = 'http://localhost:18090'` 在 `js/api.js` 中设置一次；业务页直接 `this.apiPost('/api/v1/xxx', body)` 即可，**禁止**再设 `Vue.prototype.apiBase` 或在业务页里重复写 `axios.defaults.baseURL`。
- `Vue.prototype.apiPost(path, body, config)` 第 3 个 `config` 透传给 `axios`；传 `{ responseType: 'blob' }` 走文件下载分支，直接返回原始 `resp`、跳过 `success` 解析。
- 业务页 `<head>` 引入顺序固定：Element UI CSS → Vue → Element UI → axios → **`js/api.js`**（根目录 `js/api.js`，`pages/` 下用 `../js/api.js`）→ 按需 moment → 页面 CSS → `css/common.css`。`api.js` 必须在 axios 之后、页面脚本之前，否则 `apiPost` 未挂载。

### `css/common.css` 的 iframe 适配职责

- `common.css` **不是**通用基础样式，而是为「业务页嵌入工作台 iframe」做的统一适配：隐藏各页自带的 `.topbar / .search-label / .total-badge`（这些在 iframe 内会重复占位）、把调库详情页 `.pool-adjust-workflow-page` 的底部操作区固定到 iframe 视口底部。
- 业务页 `<body class="xxx-page">` + 根 `<div id="xxx">` 的命名是 `common.css` 选择器的基础；调库类详情页沿用 `pool-adjust-workflow-page` 这个 class 才能拿到固定底栏。新增页面沿用既有命名，不要新造命名空间。
- 改 `common.css` 会影响所有 iframe 内业务页，调整前先全站搜索受影响的选择器。

### 字典与文档

- `docs/dict.js` 是 code→中文名称的**对照参考**（应与后端 `com.znty.rrs.common.enums` 一致），**当前多数业务页未在运行时直接 `import` / 引入该文件**：页面内仍用 inline 字典 + `xxxLabel()` / `xxxTagType()` helper 做展示。
- **改枚举或新增枚举值时**：先更新 / 对照 `docs/dict.js`，再同步改各业务页 inline 字典与 helper，保证全站文案与配色一致；不要只改一页。
- `docs/*.html` 是工作台「**业务文档**」菜单下的功能说明页（表结构 / 字段 / 流程说明等，HTML 内联样式），总览入口为 `docs/module-tables-index.html`；菜单注册在 `index.html` 的「业务文档」分组。
- `docs/page_catalog.md` 是「页面 ↔ CSS」对照清单；新增 / 重命名 / 删除页面或样式文件时必须同步更新该清单。

### 重要：新增 / 修改功能时同步更新业务文档（强制）

> **此点优先级高。** 只改业务页、不改对应业务文档，视为交付不完整。

- 在 `pages/` 新增功能、或修改既有功能的**字段、接口、流程步骤、校验规则、状态含义、表格列、操作按钮**等时，必须同步更新 `docs/` 下**相对应**的业务文档页（一般为 `docs/*-tables.html`，名称与业务模块对应，如证券池调库 ↔ `security-pool-adjust-*.html`）。
- 新增业务模块 / 新页面时：除页面与 CSS、`page_catalog.md`、菜单外，还须新增或补全对应业务文档页，并在 `docs/module-tables-index.html` 与 `index.html`「业务文档」菜单中登记（若该模块应对用户可见）。
- 文档内容应与实现一致：接口路径与入参出参、关键字段含义、状态枚举、操作路径等；实现已变而文档仍写旧逻辑的，必须改文档。
- 若无法判断应对应哪份文档：先查 `docs/module-tables-index.html`、`index.html` 业务文档菜单、`docs/page_catalog.md`；仍不确定时**主动询问用户**（给出候选文档路径选项），不要跳过文档更新。

### 本地预览与调试

- 前端无构建。推荐入口：`login.html` → 登录后跳 `index.html` 工作台 → 通过菜单打开业务页（iframe）。直接打开 `pages/xxx.html` 可看布局，但脱离工作台 iframe 时 `common.css` 的隐藏 / 固定规则会失效，且无真实登录用户。
- 业务页请求 `http://localhost:18090`，需后端 `znty-rrs-parent` 服务在跑；跨域由后端处理，前端无需额外配置。用任意静态服务器（如 `python -m http.server`、VS Code Live Server）托管 UI 目录即可，避免 `file://` 协议下部分浏览器限制。

---

## 页面风格与 UI 设计规范

**整体页面风格与 UI 以 `project_ui_design_guidelines.md` 为准**（权威源）。新增页面、页面重构、样式调整、AI 生成页面和 UI 走查时，必须先阅读该文件。  
本节仅保留执行时常用摘要与本仓库编码侧约束；**若本节摘要与 `project_ui_design_guidelines.md` 冲突，以设计规范文件为准**。

### 核心风格

- 项目定位为金融投研类 B 端后台系统，整体气质应稳重、克制、专业、数据优先。
- 页面风格以白色内容面板、浅灰页面背景、深蓝主色、高密度表格为主。
- 信息组织优先服务查询、筛选、表格扫描、批量操作和详情查看，不做营销式展示页。

### 重要：全站风格一致 + 同类型页面一致（强制）

> **此点优先级高。** 改 UI 时宁可先问清，也不要在单页另起一套风格。

- **全站整体风格必须一致**：主色、字号密度、查询区/表格/分页/弹窗骨架、按钮与 Tag 用法等，均服从 `project_ui_design_guidelines.md` 与现有业务页基准实现，禁止单页「自成体系」。
- **同类型页面必须一致**：例如证券池 / 禁投池 / CRMW 的调库申请、审核、详情；各类查询列表、历史列表；同类选择弹窗、报告选择面板等。改其中一页的布局、列宽约定、状态 Tag、流程选择交互时，须对照同类页，避免只改一处造成分裂。
- 新增或改版前：先在项目中找到**同类已有页面**作为基准，复用其结构、类名、配色 helper 与交互；不要凭空设计。
- **拿不准时必须主动询问用户**（用选项让用户选，不要自行猜）：例如「跟 A 页对齐 / 跟 B 页对齐 / 全站统一成某套 / 仅本页特殊处理（需说明业务原因）」。风格取舍、列宽、是否改多页、是否动公共 CSS 等，有歧义时先问再改。

### 重要：同类内容一致性

- 同类内容一致性是强制要求，优先级高于单个页面的局部美化或临时样式偏好。
- 同类页面区域、组件、字段、状态、弹窗、抽屉、选择面板和业务功能片段必须保持一致；新增实现前必须先查找并复用项目既有基准写法。
- 不得因为页面单独生成、AI 生成或局部实现而形成另一套同类组件、同类字段或同类功能片段的视觉和交互模式。

### ElementUI 落地原则

- 优先使用 Vue2 + ElementUI 原生组件、状态、尺寸和 DOM 结构。
- 查询区、表单区、工具栏默认使用 `size="small"` 承接约 32px 控件密度。
- 不为了逐像素复刻切图而大量重写 Select、DatePicker、Pagination、Tabs、Dialog 等复杂组件内部结构。
- 样式覆盖优先进入公共样式层或页面已有样式结构，避免在多个页面复制相同 ElementUI 覆盖规则。

### 基础视觉 Token

- 主色：`#2743A4`，hover / active：`#1F3683`。
- 页面背景：`#F7F8FA`，内容背景：`#FFFFFF`。
- 主文字：`#242933`，正文：`#3F485A`，弱提示：`#9199BD`，边框：`#E5E5E5`。
- 表格、表单、正文优先使用 `13px`，常规圆角优先使用 `4px`。

### 禁止事项

- 禁止使用 ElementUI 默认蓝 `#409EFF` 作为项目主色。
- 禁止新增视觉体系、营销式 Hero、大面积渐变、大圆角卡片堆叠、Ant Design / Material / Tailwind / Glass 风格。
- 禁止复制切图导出的绝对定位 DOM 作为业务页面实现。

---

## 变量与方法

### 变量声明

- 用 `const` 声明不会重新赋值的变量
- 用 `let` 声明会重新赋值的变量
- **禁止**使用 `var`

```js
// ✅
const roleList = []
let currentPage = 1

// ❌
var roleList = []
```

### 方法定义

Vue 组件内方法统一使用简写形式，**禁止**使用 `方法名: function() {}` 旧语法。

```js
// ✅
methods: {
  async loadData() { ... },
  handleEdit(row) { ... }
}

// ❌
methods: {
  loadData: function() {},
  handleEdit: function(row) {}
}
```

### `this` 的使用

能直接使用 `this` 时，**禁止**声明 `const vm = this` 中转变量。

```js
// ✅
handleEdit(row) {
  this.form = { ...row }
  this.dialogVisible = true
}

// ❌
handleEdit(row) {
  const vm = this
  vm.form = { ...row }
}
```

---

## 注释规范

### `data()` 字段

重要字段在同行添加简洁注释：

```js
data() {
  return {
    dataSource: [],       // 列表数据
    dialogVisible: false, // 编辑弹窗显示状态
    loading: false,       // 加载状态
    currentRow: null,     // 当前操作行
    queryParam: {},       // 查询条件
    pagination: {
      pageIndex: 1,       // 当前页码（后端字段 pageIndex）
      pageSize: 20,       // 每页条数
      total: 0,           // 总条数
    }
  }
}
```

### 方法

每个方法前加单行 `//` 注释说明用途：

```js
// 加载列表数据
async loadList() {},

// 提交表单（新增 / 编辑）
async handleSubmit() {},

// 删除确认弹框
handleDelete(row) {},
```

### 样式

只在必要的样式块上方添加注释，无需逐行注释：

```css
/* 顶部操作栏 */
.toolbar { margin-bottom: 16px; }
```

---

## 页面结构

项目使用 `.html` 文件直接引入 Vue，通过 `new Vue({})` 初始化实例，**不使用 `.vue` 单文件组件**。

### Vue 实例选项顺序

```
el → data() → computed → watch → created / mounted → methods
```

### 标准页面模板（`pages/` 业务页）

以下按**本仓库真实约定**编写（路径相对 `pages/xxx.html`）。CDN 版本号可随项目现有页对齐，**不要**省略 `../js/api.js` 与 `../css/common.css`。

**新建页还需同步**：`index.html` 的 `menuGroups` 注册菜单、`docs/page_catalog.md` 登记「页面 ↔ CSS」、新增同名 `css/xxx.css`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>页面标题</title>
  <!-- 引入顺序：Element UI CSS → Vue → Element UI → axios → api.js → 按需 moment → 页面 CSS → common.css -->
  <link rel="stylesheet" href="https://unpkg.com/element-ui@2.15.14/lib/theme-chalk/index.css" />
  <script src="https://unpkg.com/vue@2.5.16/dist/vue.min.js"></script>
  <script src="https://unpkg.com/element-ui@2.15.14/lib/index.js"></script>
  <script src="https://unpkg.com/axios@1.7.9/dist/axios.min.js"></script>
  <script src="../js/api.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js"></script>
  <link rel="stylesheet" href="../css/demo_page.css" />
  <link rel="stylesheet" href="../css/common.css" />
</head>
<body class="demo-page">

<div id="demo_page">
  <!-- 搜索区 -->
  <div class="toolbar">
    <el-input v-model="queryParam.name" placeholder="请输入名称" size="small" style="width: 200px;"></el-input>
    <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
    <el-button size="small" @click="handleReset">重置</el-button>
  </div>

  <!-- 表格区 -->
  <el-table :data="dataSource" v-loading="loading" border stripe size="small">
    <el-table-column prop="name" label="名称"></el-table-column>
    <el-table-column label="操作" width="160">
      <template slot-scope="{ row }">
        <el-button type="text" @click="handleEdit(row)">编辑</el-button>
        <el-button type="text" @click="handleDelete(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 分页区：与后端约定使用 pageIndex / pageSize -->
  <el-pagination
    :total="pagination.total"
    :current-page="pagination.pageIndex"
    :page-size="pagination.pageSize"
    layout="total, prev, pager, next"
    @current-change="handlePageChange">
  </el-pagination>

  <!-- 编辑弹窗 -->
  <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" size="small">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button size="small" @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" size="small" @click="handleSubmit">确认</el-button>
    </span>
  </el-dialog>
</div>

<script>
new Vue({
  el: '#demo_page',
  data() {
    return {
      dataSource: [],       // 列表数据
      loading: false,       // 加载状态
      dialogVisible: false, // 弹窗显示状态
      dialogTitle: '',      // 弹窗标题
      form: {},             // 表单数据（新增/编辑）
      queryParam: {
        name: '',           // 名称
      },
      pagination: {
        pageIndex: 1,       // 当前页码（后端字段 pageIndex）
        pageSize: 20,       // 每页条数
        total: 0,           // 总条数
      },
      rules: {}             // 表单校验规则
    }
  },
  created() {
    this.loadList()
  },
  methods: {
    // 加载列表
    async loadList() {
      this.loading = true
      try {
        // apiPost 已解包 data；分页列表常见返回 { records/list, total } 以实际接口为准
        const data = await this.apiPost('/api/v1/demo/queryDemoPage', {
          ...this.queryParam,
          pageIndex: this.pagination.pageIndex,
          pageSize: this.pagination.pageSize
        })
        this.dataSource = data.records || data.list || []
        this.pagination.total = data.total || 0
      } finally {
        this.loading = false
      }
    },

    // 查询（回到第一页）
    handleSearch() {
      this.pagination.pageIndex = 1
      this.loadList()
    },

    // 搜索重置
    handleReset() {
      this.queryParam = { name: '' }
      this.pagination.pageIndex = 1
      this.loadList()
    },

    // 打开新增弹窗
    handleAdd() {
      this.dialogTitle = '新增'
      this.form = {}
      this.dialogVisible = true
    },

    // 打开编辑弹窗
    handleEdit(row) {
      this.dialogTitle = '编辑'
      this.form = { ...row }
      this.dialogVisible = true
    },

    // 提交表单
    async handleSubmit() {
      await this.$refs.formRef.validate()
      await this.apiPost('/api/v1/demo/saveDemo', this.form)
      this.$message.success('操作成功')
      this.dialogVisible = false
      this.loadList()
    },

    // 删除确认
    handleDelete(row) {
      this.$confirm('确认删除？', '提示', { type: 'warning' }).then(async () => {
        await this.apiPost('/api/v1/demo/deleteDemo', { id: row.id })
        this.$message.success('删除成功')
        this.loadList()
      })
    },

    // 分页切换
    handlePageChange(page) {
      this.pagination.pageIndex = page
      this.loadList()
    }
  }
})
</script>
</body>
</html>
```

> 说明：示例中的 `/api/v1/demo/*`、`demo_page` 仅为示意；真实接口 path、根容器 id、CSS 文件名按业务模块命名。页面私有样式写在 `css/页面名.css`，并用根容器 id 做选择器前缀。

---

## 样式修改与冗余控制

- 样式变更前，先定位已有选择器、页面结构和浏览器实际表现；现有效果已符合规范时，不新增 CSS 或 HTML。
- 只修改真实不一致的页面或组件；禁止用大范围兜底 CSS 掩盖问题。
- 统一按钮、表格、分页、表单等样式时，先选定符合规范的基准效果，对比实际渲染值后再做最小必要修改。
- 发现同类内容或同类功能片段样式不一致时，先选定项目内已有的基准实现，再做最小范围统一，不新增另一套表现。
- 同类内容一致性优先级高于单页局部美化；除非存在明确业务原因，否则不得为同类内容新增另一套视觉或交互模式。
- 页面内新增或修改 CSS 时，默认必须使用当前页面根容器 id 作为选择器前缀，例如 `#page_root .class-name`，避免影响其他页面。
- 只有全项目共享的基础样式、公共变量、公共重置样式，才允许不加页面根 id；此类样式必须明确是全局样式。
- 新增样式前必须先搜索当前页面和项目内是否已有同类样式；已有稳定写法时，优先复用或合并，不重新生成一套近似样式。
- 禁止在页面末尾不断追加重复覆盖规则；确需覆盖时，应合并到已有同类样式块，并保持最小必要选择器。
- 同类内容一致性同时适用于 CSS：同类组件、字段、弹窗、选择面板和业务功能片段应尽量复用同一套类名、变量和样式规则。

---

## 修改范围与功能完整性

- 修改现有页面前，必须先理解当前页面结构、交互流程、样式实现、接口请求、字段展示和业务状态。
- 页面大型修改、样式统一、AI 生成改造或组件替换时，必须保留原页面已有功能、字段、按钮、弹窗、校验、请求、状态展示、空状态、加载状态和交互流程。
- 本次需求未要求修改的功能和表现，默认必须保持原样；不得因为重构、统一风格、简化实现或赶进度而删减、弱化或替换。
- 只允许修改用户明确要求的范围，以及为完成该需求确实必需的最小关联范围。
- 修改完成后，必须对照原页面检查是否存在功能缺失、字段减少、按钮丢失、弹窗内容缺少、校验弱化、接口调用改变或状态展示删减。
- **风格类改动**：须满足「全站 / 同类型页面一致」；拿不准对齐哪一页或是否改多页时，**先向用户提供选项再改**（见上文「全站风格一致 + 同类型页面一致」）。
- **功能类改动**：须同步更新「业务文档」中对应功能描述页（见上文「新增 / 修改功能时同步更新业务文档」）；未更新文档不得视为完成。

---

## Axios 请求规范

### 封装方式

所有请求通过 `this.apiPost()` 发起，**禁止**在业务代码中直接调用 `axios`。

统一封装在 `js/api.js`（详见上文「整体架构 → 统一请求封装」），核心实现：

```js
// 接口根地址（js/api.js 中设置一次，业务页不再重复设置）
axios.defaults.baseURL = 'http://localhost:18090'

// 统一请求封装，后端返回结构：{ success: true/false, data, message }
Vue.prototype.apiPost = async function(path, body, config) {
  const resp = await axios.post(path, body || {}, config || {})
  // 文件下载等 blob 响应直接返回原始 resp，跳过 success 解析
  if (config && config.responseType === 'blob') return resp
  const json = resp.data || {}
  // 请求失败时弹出错误提示并中断后续逻辑
  if (!json.success) {
    this.$message.error(json.message || '接口异常')
    throw new Error(json.message || '接口异常')
  }
  return json.data
}
```

### 异步写法

统一使用 `async / await`，**禁止**使用 `.then().catch()` 链式写法。

```js
// ✅
async loadList() {
  this.loading = true
  const data = await this.apiPost('/api/list', this.queryParam)
  this.loading = false
  this.dataSource = data.list
}

// ❌
loadList() {
  this.apiPost('/api/list', this.queryParam).then(data => {
    this.dataSource = data.list
  })
}
```

---

## 日期时间

统一使用 `Moment.js`，**禁止**手写日期处理逻辑。

```js
moment(row.createTime).format('YYYY-MM-DD HH:mm:ss')  // 格式化
moment(row.createTime).fromNow()                        // 相对时间
moment(endDate).isAfter(startDate)                      // 范围校验
```

---

## ECharts

- 图表容器必须设置明确宽高，不可用百分比高度
- 组件销毁时调用 `chart.dispose()` 释放实例
- 数据更新使用 `setOption`，不重新 `init`

```js
// 页面挂载后初始化图表
mounted() {
  this.initChart()
},
// 组件销毁前释放图表实例，防止内存泄漏
beforeDestroy() {
  if (this.chart) {
    this.chart.dispose()
    this.chart = null
  }
},
methods: {
  // 初始化图表
  initChart() {
    this.chart = echarts.init(this.$refs.chartDom)
    this.chart.setOption(this.getOption())
  },
  // 更新图表数据
  updateChart() {
    this.chart.setOption(this.getOption())
  }
}
```

---

## 禁止事项

| # | 禁止行为 | 原因 |
|---|----------|------|
| 1 | 使用 `var` 声明变量 | 变量提升、作用域污染 |
| 2 | `方法名: function() {}` 旧语法 | 风格不一致，可读性差 |
| 3 | `const vm = this` 中转 | 箭头函数已解决 `this` 绑定 |
| 4 | 业务代码直接调用 `axios` | 绕过统一拦截器，难以维护 |
| 5 | 手写日期处理逻辑 | 应统一使用 Moment.js |
| 6 | 组件销毁不释放 ECharts 实例 | 导致内存泄漏 |
| 7 | 未经确认引入新的第三方库 | 避免冗余依赖和包体积膨胀 |
| 8 | 未先参考 `project_ui_design_guidelines.md` 就新增、重构或大改页面 | 容易偏离项目整体 UI 规范 |
| 9 | 单页另起一套风格，或同类型页面（如多条调库链路）视觉/交互不一致却不对照基准页 | 破坏全站与同类型一致性 |
| 10 | 风格取舍拿不准时不询问用户、自行猜测改法 | 易改错范围或多页分裂；应给选项请用户选择 |
| 11 | 新增/修改功能后不更新 `docs/` 下对应业务文档页（及必要的索引/菜单） | 业务文档与实现脱节，交付不完整 |
| 12 | 为同类组件、字段、弹窗、选择面板、业务功能片段新增另一套视觉或交互模式 | 破坏同类内容一致性 |
| 13 | 页面级 CSS 不加当前页面根容器 id 前缀 | 容易污染其他页面或被其他页面样式影响 |
| 14 | 在页面末尾不断追加重复覆盖规则或生成近似重复样式 | 增加样式冗余和维护成本 |
| 15 | 未确认引用关系就盲目删除历史样式 | 可能破坏仍在使用的页面效果 |
| 16 | 未理解原页面结构、交互、接口、字段和状态就直接重写 | 容易造成原有功能丢失 |
| 17 | 删减、弱化或替换本次需求未要求修改的功能和表现 | 破坏功能完整性 |
| 18 | 顺手改动当前任务无关的功能、接口、字段、按钮、弹窗、校验和状态展示 | 扩大改动范围，增加回归风险 |
| 19 | 把原有业务效果改成低配版本 | 降低页面信息完整性和交互质量 |
| 20 | 复制切图导出的绝对定位 DOM 作为业务页面实现 | 不符合 Vue2 + ElementUI 落地方式 |
| 21 | 为逐像素复刻设计稿而大量改写 ElementUI 复杂组件内部结构 | 维护成本高，容易破坏组件稳定性 |
| 22 | 表格中状态、类型、方向、评级等枚举字段不使用 el-tag，改用纯文本或自定义 span class | 破坏同类字段一致性，无法统一配色，偏离 ElementUI 落地原则 |

---

## 显示规范

- 字段、表格单元格、详情项为空时直接显示空白，不使用 `-`、`--` 等占位符；空列表/空表格的 `empty-text` 可继续使用“暂无数据”等文案。

### 表格枚举字段（状态 / 类型 / 方向 / 评级）

表格中**枚举类字段**（证券状态、证券类型、调整方向、审核/步骤状态、评级、市场、报告类型、业务分类等有限可数取值）一律使用 `<el-tag size="mini">` 展示，**禁止**用纯文本 `{{ }}` 或自定义 `span class` 模拟标签。自由文本字段（名称、代码、日期、原因、描述、数值等）不套 tag，保持原样。

**配色原则（复用各页既有 helper，不新造配色）：**

| 字段类别 | 配色（el-tag type） | 说明 |
|---|---|---|
| 状态类（审核/步骤/执行结果） | 通过 `success` / 待审 `warning` / 驳回 `danger` / 其他 `info` | 走 `auditStatusType()` / `stepStatusType()` 等helper |
| 调整类型 | 手工调整 `info` / 联动调整 `warning` / 互斥调整 `danger` | 走 `adjustTypeTagType()`，按语义差异化 |
| 流程类型 | 白名单/简易 `success` / 下调 `warning` / 调出 `danger` / 默认调入 `info` | 走 `flowTypeTagType()`，按值差异化 |
| 报告类型 | 评级/行业 `success` / 研究/宏观 `warning` / 风险 `danger` / 跟踪/其他 `info` | 走 `reportTypeTagType()`，按值差异化 |
| 类型/分类/市场（证券类型、规则分类、市场） | `info`（主色浅底） | 中性分类，统一 info |
| 方向（调入/调出） | 调入 `success` / 调出 `danger` | 项目基准配色 |
| 评级（证券评级/主体评级） | 证券评级 `success` / 主体评级 默认 | 沿用既有写法 |

**约定：**
- 空值不显示 tag，用 `v-if` 守卫：`<el-tag v-if="row.xxx" size="mini" :type="xxxType(row.xxx)">{{ xxxLabel(row.xxx) }}</el-tag>`。
- 标签文案统一走前端字典 helper（`xxxLabel` / `xxxName`），后端只返回 code。
- 同一字段在全站表格中配色必须一致，新增枚举值时同步更新 helper。

```html
<!-- ✅ -->
<el-table-column label="审核状态" min-width="110" align="center">
  <template slot-scope="{ row }">
    <el-tag v-if="row.auditStatus" size="mini" :type="auditStatusType(row.auditStatus)">{{ auditStatusLabel(row.auditStatus) }}</el-tag>
  </template>
</el-table-column>

<!-- ❌ 纯文本或自定义 span -->
<template slot-scope="{ row }">{{ auditStatusLabel(row.auditStatus) }}</template>
<span class="status-badge" :class="'is-' + row.auditStatus">{{ ... }}</span>
```

---

## 编码与乱码防护

- 所有包含中文的 HTML、JavaScript、CSS、Markdown 文件统一按 UTF-8 读取和写入，禁止用不明确编码的脚本批量改写文件。
- Windows PowerShell/终端可能因为 GBK 控制台把 UTF-8 中文显示成乱码；判断文件是否乱码时，必须用 UTF-8 方式读取文件或用浏览器/编辑器确认，不能只依据终端显示。
- 修改页面文案、中文注释、字典中文名称后，必须扫描典型乱码特征，例如 `瀹`、`鐎`、`閰`、`鍙`、`鏉`、`涓`、`�`、`???`。
- 如发现乱码，优先从 Git 中恢复原始可读内容，再重新做最小范围业务修改；不要继续在乱码文本上猜测替换。
- 用脚本处理中文文件时，显式指定 `encoding='utf-8-sig'` 读取、`encoding='utf-8'` 写入，并避免经过会改变编码的控制台管道。
