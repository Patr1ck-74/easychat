# EasyChat

一个可直接部署的轻量 AI 聊天项目：

- 前端：纯静态 HTML + Tailwind + marked + highlight.js
- 后端：Express 代理 OpenAI 兼容接口
- 默认端口：`7777`
- 安全：真实 API Key 仅保存在后端 `server/presets.json`
- 背景图：全局统一
- 支持 Docker 部署
- 支持 GitHub Actions 自动构建 Docker 镜像

## 目录结构

```text
easychat/
  .github/
    workflows/
      docker-image.yml
  server/
    package.json
    server.js
    presets.json
  web/
    index.html
    app.js
  Dockerfile
  .dockerignore
  .gitignore
  docker-compose.yml
  easychat.service.example
```

## 本地启动

### 1. 安装依赖

```powershell
cd D:\github\easychat\server
npm install
```

### 2. 修改后端配置

编辑：

```text
D:\github\easychat\server\presets.json
```

把里面的：

- `apiKey`
- `baseUrl`
- `model`
- `backgroundImage`

改成你自己的。

### 3. 启动后端

```powershell
cd D:\github\easychat\server
node server.js
```

默认监听：

```text
http://127.0.0.1:7777
```

## Debian 服务器部署

### 1. 上传项目到服务器

建议路径：

```text
/opt/easychat
```

### 2. 安装 Node.js

```bash
sudo apt update
sudo apt install -y curl gnupg
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. 安装后端依赖

```bash
cd /opt/easychat/server
sudo npm install
```

### 4. 修改后端配置

编辑：

```text
/opt/easychat/server/presets.json
```

### 5. 安装 systemd 服务

```bash
sudo cp /opt/easychat/easychat.service.example /etc/systemd/system/easychat.service
sudo systemctl daemon-reload
sudo systemctl enable --now easychat
sudo systemctl status easychat
```

查看日志：

```bash
journalctl -u easychat -f
```

服务默认监听：

```text
127.0.0.1:7777
```

## Docker 部署

### 方式 1：直接构建并运行

```bash
cd /opt/easychat
docker build -t easychat:latest .
docker run -d \
  --name easychat \
  -p 7777:7777 \
  -v /opt/easychat/server/presets.json:/app/server/presets.json:ro \
  easychat:latest
```

### 方式 2：使用 Docker Compose

先确认服务器上的配置文件存在：

```text
/opt/easychat/server/presets.json
```

然后执行：

```bash
cd /opt/easychat
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f
```

停止容器：

```bash
docker compose down
```

## GitHub Actions 自动打包镜像

仓库内已提供：

```text
.github/workflows/docker-image.yml
```

### 触发方式

- push 到 `main`
- 创建 tag，例如 `v1.0.0`
- 手动触发 workflow

### 说明

该 workflow：

- 自动登录 GHCR
- 使用 `${{ github.repository_owner }}` 作为镜像 owner
- 自动将 owner 转成小写，避免 GitHub 用户名中包含大写时导致镜像名不合法
- 默认推送镜像到：

```text
ghcr.io/<repository-owner-lowercase>/easychat
```

### 需要配置的内容

默认情况下，不需要额外配置 `GHCR_USERNAME` 或 `GHCR_TOKEN`。

只要仓库启用了 GitHub Actions，并允许 `GITHUB_TOKEN` 写入 packages，即可推送到 GHCR。

如果你的仓库或组织限制了包写入权限，请确认：

- Actions 权限允许 `Read and write permissions`
- Packages 权限允许写入

生成后镜像名类似：

```text
ghcr.io/<your-username-lowercase>/easychat:latest
```

## 安全说明

- 前端不会存真实 API Key
- 浏览器 F12 看不到第三方密钥
- 真正的密钥只在 `server/presets.json`
- 不要把 `presets.json` 提交到公开仓库

## 后续建议

- 给站点加访问鉴权
- 给 `/api/chat` 加登录或访问限制
- 用数据库替代 `presets.json`
