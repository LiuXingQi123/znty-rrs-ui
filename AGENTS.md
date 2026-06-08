# CLAUDE.md — 前端开发规范

> 适用项目：Vue 2.x 管理系统类前端项目  
> 版本：v1.0 | 更新：2026-05

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 2.5.16 | 核心框架 |
| Element UI | 2.15.0 | UI 组件库 |
| Axios | latest | HTTP 请求 |
| ECharts | latest | 图表可视化 |
| Moment.js | latest | 日期时间处理 |
| JavaScript | ES6+ | 业务逻辑 |
| HTML5 | — | 页面结构 |

> 引入上述以外的第三方库前，必须先询问用户并获得确认。

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
      page: 1,            // 当前页码
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

### 标准页面模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>页面标题</title>
  <link rel="stylesheet" href="element-ui/index.css" />
  <script src="vue/vue.min.js"></script>
  <script src="element-ui/index.js"></script>
  <script src="axios/axios.min.js"></script>
</head>
<body>

<div id="app">
  <!-- 搜索区 -->
  <div class="toolbar">
    <el-input v-model="queryParam.name" placeholder="请输入姓名" style="width: 200px;"></el-input>
    <el-button type="primary" @click="loadList">查询</el-button>
    <el-button @click="handleReset">重置</el-button>
  </div>

  <!-- 表格区 -->
  <el-table :data="dataSource" v-loading="loading" border stripe>
    <el-table-column prop="name" label="名称"></el-table-column>
    <el-table-column label="操作" width="160">
      <template slot-scope="{ row }">
        <el-button type="text" @click="handleEdit(row)">编辑</el-button>
        <el-button type="text" @click="handleDelete(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 分页区 -->
  <el-pagination
    :total="pagination.total"
    :current-page="pagination.page"
    :page-size="pagination.pageSize"
    layout="total, prev, pager, next"
    @current-change="handlePageChange">
  </el-pagination>

  <!-- 编辑弹窗 -->
  <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </span>
  </el-dialog>
</div>

<script>
new Vue({
  el: '#app',
  data() {
    return {
      dataSource: [],       // 列表数据
      loading: false,       // 加载状态
      dialogVisible: false, // 弹窗显示状态
      dialogTitle: '',      // 弹窗标题
      form: {},             // 表单数据（新增/编辑）
      queryParam: {
        name: '',           // 姓名
      },
      pagination: {
        page: 1,            // 当前页码
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
      const data = await this.apiPost('/api/list', { ...this.queryParam, ...this.pagination })
      this.loading = false
      this.dataSource = data.list
      this.pagination.total = data.total
    },

    // 搜索重置
    handleReset() {
      this.queryParam = { name: '' }
      this.pagination.page = 1
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
      await this.apiPost('/api/save', this.form)
      this.$message.success('操作成功')
      this.dialogVisible = false
      this.loadList()
    },

    // 删除确认
    handleDelete(row) {
      this.$confirm('确认删除？', '提示', { type: 'warning' }).then(async () => {
        await this.apiPost('/api/delete', { id: row.id })
        this.$message.success('删除成功')
        this.loadList()
      })
    },

    // 分页切换
    handlePageChange(page) {
      this.pagination.page = page
      this.loadList()
    }
  }
})
</script>

<style>
/* 页面容器 */
#app { padding: 16px; }

/* 顶部操作栏 */
.toolbar { margin-bottom: 16px; display: flex; gap: 8px; align-items: center; }
</style>
</body>
</html>
```

---

## Axios 请求规范

### 封装方式

所有请求通过 `this.apiPost()` 发起，**禁止**在业务代码中直接调用 `axios`。

`apiPost` 挂载在 Vue 原型上，后端返回结构为 `{ success: true/false, data, message }`：

```js
// 接口根地址
Vue.prototype.apiBase = 'https://your-api-domain.com'

// 统一请求封装，后端返回结构：{ success: true/false, data, message }
Vue.prototype.apiPost = async function(path, body) {
  const resp = await axios.post(this.apiBase + path, body || {})
  const json = resp.data
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

---

## 显示规范

- 字段、表格单元格、详情项为空时直接显示空白，不使用 `-`、`--` 等占位符；空列表/空表格的 `empty-text` 可继续使用“暂无数据”等文案。

---

## 编码与乱码防护

- 所有包含中文的 HTML、JavaScript、CSS、Markdown 文件统一按 UTF-8 读取和写入，禁止用不明确编码的脚本批量改写文件。
- Windows PowerShell/终端可能因为 GBK 控制台把 UTF-8 中文显示成乱码；判断文件是否乱码时，必须用 UTF-8 方式读取文件或用浏览器/编辑器确认，不能只依据终端显示。
- 修改页面文案、中文注释、字典中文名称后，必须扫描典型乱码特征，例如 `瀹`、`鐎`、`閰`、`鍙`、`鏉`、`涓`、`�`、`???`。
- 如发现乱码，优先从 Git 中恢复原始可读内容，再重新做最小范围业务修改；不要继续在乱码文本上猜测替换。
- 用脚本处理中文文件时，显式指定 `encoding='utf-8-sig'` 读取、`encoding='utf-8'` 写入，并避免经过会改变编码的控制台管道。
