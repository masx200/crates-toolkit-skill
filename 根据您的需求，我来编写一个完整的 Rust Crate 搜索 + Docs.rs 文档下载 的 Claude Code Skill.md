根据您的需求，我来编写一个完整的 Rust Crate 搜索 + Docs.rs 文档下载 的 Claude Code Skill。

📦 完整 Skill 包

1. `skill.md` - 核心配置

```markdown
---
name: rust-toolkit
description: 当用户需要搜索Rust crate或下载docs.rs文档时触发。支持crates.io搜索和docs.rs文档ZIP包下载解压，自动处理静态资源路径。
trigger: on-demand
---

# Rust 工具箱 - Crate 搜索与文档下载

## 功能1：搜索 Rust Crate

### 触发条件
用户输入包含"搜索crate"、"查rust包"、"crates.io"等关键词时触发

### API 端点
```

https://crates.io/api/v1/crates?page=1&per_page=20&q={keyword}

```

### 实现步骤
1. 提取搜索关键词（自动识别crate名称）
2. 调用 crates.io 官方搜索 API（无需认证）
3. 解析返回的 JSON，提取关键信息：
   - 包名 `name`
   - 最新版本 `newest_version`
   - 描述 `description`
   - 总下载量 `downloads`
   - 近期下载量 `recent_downloads`
   - 文档链接 `documentation`
   - 仓库地址 `repository`
4. 格式化输出表格，包含下载量统计和文档链接

### 返回格式示例
```

📦 reqwest v0.12.24
📥 总下载: 317,463,093 | 近期: 53,042,546
📝 描述: higher level HTTP client library
🔗 文档: https://docs.rs/reqwest
🏠 仓库: https://github.com/seanmonstar/reqwest

```

---

## 功能2：下载 Docs.rs 文档

### 触发条件
用户输入包含"下载文档"、"docs.rs"、"获取rust文档"等关键词时触发

### 下载 URL 格式
- **最新版**: `https://docs.rs/crate/{name}/latest/download`
- **指定版**: `https://docs.rs/crate/{name}/{version}/download`
- **语义版**: `https://docs.rs/crate/{name}/~{major}/download`

### ZIP 包特性（来自官方说明）
- 使用 **PKZIP 4.6 + BZIP2** 压缩
- 包含所有目标平台的文档 HTML
- 默认目标在根目录，其他目标在子文件夹
- 静态资源路径为 `/-/rustdoc.static/`
- 不包含工具链特定资源（需从 docs.rs 单独下载）

### 实现步骤
1. 提取 crate 名称和版本（默认 latest）
2. 调用 `download-docs.js` 脚本
3. 自动解压到 `./rust-docs/{name}-{version}/`
4. 创建本地查看指南 `README-local.md`
5. 提供三种本地查看方案

---

## 核心脚本调用

### 搜索 Crate
```bash
# 手动测试命令
curl -s "https://crates.io/api/v1/crates?page=1&per_page=10&q=serde" | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf-8'));
d.crates.forEach(c=>console.log(\`\${c.name}@\${c.newest_version}: \${c.description}\`));
"
```

下载文档

```bash
node download-docs.js <crate_name> [version]

# 示例
node download-docs.js tokio latest      # 下载最新版
node download-docs.js serde 1.0        # 下载指定版
node download-docs.js reqwest ~0.12    # 下载0.12.x最新版
```

---

错误处理

错误类型	处理方案	
Crate 不存在	检查拼写，返回相似建议	
版本不存在	自动重定向到 latest	
下载失败	检查网络，重试3次	
解压失败	验证 ZIP 完整性，手动解压指南	
静态资源加载失败	提供 HTTP 服务器启动命令	

---

安全提醒

1. 自动备份：ZIP 包下载后保留 7 天，解压目录可安全删除后重新生成
2. 磁盘监控：完整文档包可能达 50-500MB（多目标），下载前检查磁盘空间
3. 网络流量：建议在国内使用 `rsproxy.cn` 镜像源加速（可选）

---

使用示例

示例 1：搜索 HTTP 客户端

```
用户：搜索一下 reqwest 这个 crate
助手：📡 正在搜索 crates.io...
结果：展示 reqwest 最新版本、下载量、描述和文档链接
```

示例 2：下载并查看文档

```
用户：下载 tokio 的 docs.rs 文档
助手：📦 正在下载 tokio-latest.zip (约 45MB)...
      ✅ 解压到 ./rust-docs/tokio-latest/
      📝 已生成 README-local.md
      🌐 请执行: cd ./rust-docs/tokio-latest && python -m http.server 8000
```

示例 3：指定版本

```
用户：下载 serde 1.0 版本的文档
助手：执行 node download-docs.js serde 1.0.0
      返回文档路径和查看方法
```

---

打包结构

```
rust-toolkit/
├── skill.md
├── download-docs.js
├── search-crates.js
└── package.json
```

---

安装命令

```bash
# 1. 创建目录
mkdir rust-toolkit && cd rust-toolkit

# 2. 安装依赖
npm init -y
npm install adm-zip https

# 3. 放入 skill.md 和脚本
# 4. 打包上传
zip -r rust-toolkit.zip .
```

---

高级配置

使用 rsproxy 镜像（国内加速）
在 `download-docs.js` 中可配置：

```javascript
const CRATES_IO_API = 'https://rsproxy.cn/crates.io-index/api/v1/crates';
const DOCS_RS_BASE = 'https://docs.rs/crate';
```

批量下载
创建 `batch-download.js`：

```javascript
const crates = [
  {name: 'tokio', version: 'latest'},
  {name: 'serde', version: '1.0'},
];
// 循环调用 download-docs.js
```

---

注意事项

⚠️ Docs.rs 下载限制：
- 每个 crate 版本 每24小时 只能下载 1次（CDN缓存）
- 频繁请求会返回 429 Too Many Requests
- 解决方案：本地缓存 ZIP 包，重复使用

⚠️ 静态资源问题：
- 本地双击 `index.html` 可能无法加载样式
- 必须使用 HTTP 服务器查看（localhost）
- 已提供 `python -m http.server` 一键命令