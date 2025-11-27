---
name: npm-toolkit
description: 当用户需要搜索npm包、下载npm包文档或精确修改文件时触发。支持通过registry.npmmirror.com搜索包，通过unpkg.com获取包文档，并使用Node.js脚本精确替换指定行内容，解决Claude Code自带编辑工具不稳定的问题。
trigger: on-demand
---

# NPM 工具箱 - 搜索、下载与精确文件编辑

## 功能概述
本技能提供三个核心功能：
1. **搜索NPM包**：使用淘宝镜像源快速搜索NPM包信息
2. **下载包文档**：从unpkg.com获取包的README、类型定义或源码
3. **精确文件编辑**：通过Node.js脚本指定行号和替换文本，稳定修改文件

## 功能1：搜索NPM包

### 触发条件
用户输入包含"搜索npm包"、"查找npm"、"npm搜索"等关键词

### 实现步骤
1. 提取用户提供的搜索关键词
2. 调用 registry.npmmirror.com 的搜索API：`https://registry.npmmirror.com/-/v1/search?text={keyword}&size=20&from=0`
3. 解析返回的JSON数据，提取包名、版本、描述、下载量等关键信息
4. 格式化输出结果，包含包名、最新版本、描述和下载量

### API响应格式
```json
{
  "objects": [
    {
      "package": {
        "name": "包名",
        "version": "最新版本",
        "description": "描述",
        "keywords": ["关键词"],
        "date": "最后更新时间"
      },
      "downloads": {"all": "总下载量"}
    }
  ]
}
```

## 功能2：下载NPM包文档

### 触发条件
用户输入包含"下载npm文档"、"获取unpkg"、"查看包内容"等关键词

### 实现步骤

1. 提取包名和版本（默认为latest）
2. 提供三种下载方式：
   - 主文件：`https://unpkg.com/{package}@{version}`
   - 浏览包结构：`https://unpkg.com/browse/{package}@{version}/`
   - 特定文件：`https://unpkg.com/{package}@{version}/{file path}`
3. 使用curl或wget下载到本地`./npm-downloads/`目录
4. 对于README.md、index.d.ts等文档文件自动识别并展示

### 常用文件路径

- README.md: 文档说明
- package.json: 包信息
- index.d.ts: TypeScript类型定义
- dist/ 或 lib/: 编译后的代码

## 功能3：精确文件编辑（解决编辑工具问题）

### 触发条件
用户需要修改文件的特定行，或抱怨Claude Code自带编辑工具不稳定时触发

### 实现步骤

1. 调用Node.js脚本 `file-editor.js` 进行精确行替换
2. 脚本参数格式：`node file-editor.js <文件路径> <行号> <"替换文本">`
3. 脚本会先备份原文件为 `.bak`，然后执行替换操作
4. 返回操作结果和备份信息

### 脚本调用示例

```bash
# 将文件第5行替换为新内容
node file-editor.js src/app.js 5 "const newValue = 'hello world';"

# 替换第10行为多行文本（使用\n转义）
node file-editor.js README.md 10 "## 新标题\n\n这是新的描述内容。"
```

## 错误处理

1. 搜索失败：检查网络连接，确认关键词不为空
2. 下载失败：确认包名和版本号正确，检查unpkg.com可访问性
3. 编辑失败：确认文件存在且有写入权限，行号在有效范围内
4. 所有操作：失败时返回具体错误信息，并尝试提供替代方案

## 安全提醒

- 文件编辑操作会自动创建 `.bak` 备份文件
- 建议在Git仓库中使用，以便随时回滚
- 下载的npm包文件请进行安全扫描后再使用

## 使用示例

### 示例1：搜索MCP相关包
用户：搜索npm包，关键词mcp
助手：调用搜索API，返回前10个相关包的名称、版本和描述

### 示例2：下载包的README
用户：下载@modelcontextprotocol/sdk的README文档
助手：从 `https://unpkg.com/@modelcontextprotocol/sdk/README.md` 下载到本地

### 示例3：精确修改文件
用户：将server.js第15行修改为app.listen(3000)
助手：调用 `node file-editor.js server.js 15 "app.listen(3000);"`
