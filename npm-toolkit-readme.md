# NPM 工具箱 (npm-toolkit-skill)

一个专为 Claude Code 设计的工具包，提供 NPM 包搜索、文档下载和精确文件编辑三大核心功能。

## 🌟 功能特性

### 1. 搜索 NPM 包
- 使用淘宝镜像源 (registry.npmmirror.com) 快速搜索
- 支持中文关键词搜索
- 显示包名、版本、描述、下载量等信息
- 速度快，稳定性高

### 2. 下载 NPM 包文档
- 从 unpkg.com 获取包文档和源码
- 支持下载 README.md、类型定义、源码等
- 自动创建 npm-downloads 目录
- 智能识别常见文档文件

### 3. 精确文件编辑
- 通过 Node.js 脚本精确修改指定行内容
- 解决 Claude Code 自带编辑工具不稳定的问题
- 自动创建 `.bak` 备份文件
- 支持多行文本替换
- 错误时自动恢复

## 📦 安装方法

### 方法一：上传到 Claude Code（推荐）

1. 打包技能文件：
   ```bash
   # 在项目目录下执行
   zip npm-toolkit.zip skill.md file-editor.js
   ```

2. 在 Claude Code 中上传：
   - 打开 Claude → Settings → Skills
   - 点击 "Upload" 选择 `npm-toolkit.zip`
   - 或直接拖动 ZIP 文件到 Skills 区域

3. 启用代码执行：
   - Claude → Settings → Capabilities
   - 勾选 "Code execution & File creation"

### 方法二：本地使用

1. 克隆或下载项目：
   ```bash
   git clone <repository-url>
   cd npm-toolkit-skill
   ```

2. 安装依赖（可选）：
   ```bash
   npm install
   ```

## 🚀 使用方法

### 在 Claude Code 中使用

直接在对话中触发：

```
@npm-toolkit 搜索 express
@npm-toolkit 下载 @types/node README.md
@npm-toolkit 修改 server.js 第15行 "app.listen(3000);"
```

### 本地使用

#### 1. 搜索 NPM 包

```bash
# 通过 Claude Code 触发搜索
@npm-toolkit 搜索 mcp
```

#### 2. 下载包文档

```bash
# 下载指定包的 README
@npm-toolkit 下载 @modelcontextprotocol/sdk README.md

# 下载所有文档到 npm-downloads 目录
```

#### 3. 精确编辑文件

```bash
# 修改指定文件的特定行
node file-editor.js <文件路径> <行号> <"替换文本">

# 示例
node file-editor.js src/app.js 5 "const newValue = 'hello';"

# 多行文本
node file-editor.js README.md 10 "## 新标题\\n\\n这是描述。"
```

## 📁 文件结构

```
npm-toolkit-skill/
├── README.md              # 项目说明文档
├── skill.md               # Claude Code 技能配置（必需）
├── file-editor.js         # 精确文件编辑脚本
├── package.json           # 项目配置（可选）
├── test-file.js           # 测试文件
├── test-file.js.bak       # 自动备份文件（运行后生成）
└── npm-downloads/         # 文档下载目录（运行后生成）
    └── README.md          # 下载的文档
```

## 📋 详细功能说明

### 文件编辑脚本 (file-editor.js)

**特性：**
- ✅ 精确行号定位
- ✅ 自动创建备份文件（.bak）
- ✅ 错误恢复机制
- ✅ 详细的操作日志
- ✅ 支持中文路径和内容

**用法：**
```bash
node file-editor.js <文件路径> <行号> <"替换文本">
```

**示例：**
```bash
# 修改第5行
node file-editor.js src/index.js 5 "import React from 'react';"

# 恢复文件
cp "src/index.js.bak" "src/index.js"
```

### NPM 包搜索

**API 端点：**
```
https://registry.npmmirror.com/-/v1/search?text={keyword}&size=20&from=0
```

**返回信息：**
- 包名 (name)
- 最新版本 (version)
- 描述 (description)
- 关键词 (keywords)
- 下载量 (downloads.all)
- 更新时间 (date)

### 文档下载

**支持的文档类型：**
- README.md - 项目说明
- package.json - 包配置
- index.d.ts - TypeScript 类型定义
- dist/ 或 lib/ - 编译后的代码
- source/ - 源码目录

**下载路径：**
```
./npm-downloads/{包名}/
```

## ⚠️ 注意事项

### 安全提醒
1. **文件备份**：所有文件编辑操作会自动创建 `.bak` 备份，建议使用 Git 管理版本
2. **代码扫描**：下载的 NPM 包文件请进行安全扫描后再使用
3. **权限检查**：确保有文件的读写权限

### 使用建议
1. **Git 仓库**：建议在 Git 仓库中使用，便于版本回退
2. **测试环境**：在生产环境使用前，先在测试环境验证
3. **批量修改**：多行修改建议分多次执行，每次查看结果

### 常见问题

**Q: 搜索结果为空？**
A: 检查关键词是否正确，或尝试使用英文关键词

**Q: 下载失败？**
A: 确认包名正确，检查网络连接，unpkg.com 可能需要科学上网

**Q: 文件编辑失败？**
A: 检查文件是否存在、行号是否在有效范围内、是否有写入权限

**Q: 如何恢复文件？**
A: 使用备份文件：`cp "文件名.bak" "文件名"`

## 🔧 高级用法

### 批量编辑脚本

创建 `batch-edit.sh`：
```bash
#!/bin/bash
node file-editor.js src/app.js 5 "const x = 10;"
node file-editor.js src/app.js 8 "function init() {"
node file-editor.js src/app.js 12 "}"
```

### 配合 Claude Code 使用

在对话中直接使用：
```
请帮我：
1. 搜索 react 相关的 NPM 包
2. 下载 react 的 README.md
3. 修改当前项目的 app.js 第10行，添加 console.log
```

## 📝 更新日志

### v1.0.0
- ✅ 初始版本发布
- ✅ 支持 NPM 包搜索
- ✅ 支持文档下载
- ✅ 支持精确文件编辑
- ✅ 自动备份和恢复机制

## 📜 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请通过以下方式联系：
- 提交 GitHub Issue
- 参与讨论

---

**Made with ❤️ for Claude Code users**
