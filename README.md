# EasyChat

轻量的 AI 聊天项目，支持：

- 前端聊天 UI
- Express 代理 OpenAI 兼容接口
- 默认端口 `7777`
- Docker / Docker Compose 部署
- GitHub Actions 自动构建 Docker 镜像
- 在线管理员配置：可在网页中填写和保存 `API Key`、`Base URL`、`Model`
- 配置模板：仓库提供 `server/presets.example.json`

## 目录结构

```text
easychat/
  .github/
    workflows/
      docker-image.yml
  server/
    package.json
    server.js
    presets.example.json
    presets.json               # 本地/服务器实际配置，不建议提交
  web/
    index.html
    app.js
  Dockerfile
  .dockerignore
  .gitignore
  docker-compose.yml
  easychat.service.example
```

## 配置说明

### 1. 配置模板

仓库内提供模板：

```text
server/presets.example.json
```

首次运行时：

- 如果 `server/presets.json` 不存在
- 后端会自动从 `server/presets.example.json` 复制出一份 `server/presets.json`

### 2. 实际配置文件

实际运行配置使用：

```text
server/presets.json
```

该文件已加入 `.gitignore`，不建议提交到公开仓库。

### 3. 管理员密码

在线配置功能依赖环境变量：

```text
EASYCHAT_ADMIN_PASSWORD
```

只有输入正确管理密码后，前端设置面板才能加载和保存完整配置。

---

## 本地启动

### 1. 安装依赖

```powershell
cd D:\github\easychat\server
npm install
```

### 2. 设置管理员密码

PowerShell 临时设置：

```powershell
$env:EASYCHAT_ADMIN_PASSWORD="change-this-password"
```

### 3. 启动后端

```powershell
cd D:\github\easychat\server
node server.js
```

默认访问地址：

```text
http://127.0.0.1:7777
```

---

## 部署后怎么使用

部署完成后，直接访问：

```text
http://你的服务器IP:7777
```

如果你后续用了反向代理或域名，也只是把这个端口代理出去即可。

### 首次使用步骤

1. 打开网页
2. 点击左上角齿轮进入 Settings
3. 在 `Admin Password` 中输入你部署时设置的管理密码
4. 点击 `加载配置`
5. 在管理面板中填写：
   - `App Name`
   - `Background Image URL`
   - 每个 preset 的：
     - `Preset Name`
     - `Base URL`
     - `Model`
     - `API Key`
6. 选择一个默认 preset
7. 点击 `保存配置`
8. 再点击 `测试当前预设`
9. 成功后直接聊天

### 聊天使用说明

保存配置后：

- 左侧会显示你已保存的 preset
- 切换 preset 即可切换模型/服务商
- 前端不会暴露第三方真实 API Key
- 浏览器 F12 只能看到你自己的后端请求

---

## Debian 部署

### 1. 上传项目

建议目录：

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

### 3. 安装依赖

```bash
cd /opt/easychat/server
sudo npm install
```

### 4. 准备配置文件

如果你想手动准备，可以执行：

```bash
cp /opt/easychat/server/presets.example.json /opt/easychat/server/presets.json
```

也可以不手动复制，首次启动时程序会自动生成。

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

请记得修改：

```text
/etc/systemd/system/easychat.service
```

中的：

```text
Environment=EASYCHAT_ADMIN_PASSWORD=change-this-password
```

改成你自己的管理密码，然后重启：

```bash
sudo systemctl restart easychat
```

---

## Docker 部署

### 方式 1：直接构建并运行

```bash
cd /opt/easychat
cp server/presets.example.json server/presets.json
docker build -t easychat:latest .
docker run -d \
  --name easychat \
  -p 7777:7777 \
  -e EASYCHAT_ADMIN_PASSWORD=change-this-password \
  -v /opt/easychat/server/presets.json:/app/server/presets.json \
  easychat:latest
```

### 方式 2：使用 Docker Compose

先准备配置文件：

```bash
cd /opt/easychat
cp server/presets.example.json server/presets.json
```

然后修改：

```text
docker-compose.yml
```

把：

```text
EASYCHAT_ADMIN_PASSWORD: change-this-password
```

改成你自己的密码。

启动：

```bash
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

---

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

---

## 安全说明

- 真实 API Key 保存于服务端 `server/presets.json`
- 在线配置需要管理密码
- 前端不会直接请求第三方模型接口
- 浏览器 F12 看不到第三方真实密钥
- 不要把 `server/presets.json` 提交到公开仓库

---

## 建议

如果要正式公网使用，建议额外加：

- 访问鉴权
- IP 限制
- 请求频率限制
- 后端日志与备份
