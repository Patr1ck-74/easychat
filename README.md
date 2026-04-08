# EasyChat

简洁的聊天前端 + Node.js 代理服务，默认端口 `7777`。

## 快速开始（Docker，固定镜像）

固定使用：

`ghcr.io/patr1ck-74/easychat:latest`

### 1) 启动容器

```bash
docker pull ghcr.io/patr1ck-74/easychat:latest
docker run -d \
  --name easychat \
  -p 7777:7777 \
  -e EASYCHAT_ADMIN_PASSWORD=change-this-password \
  -v /opt/easychat/presets.json:/app/server/presets.json \
  --restart unless-stopped \
  ghcr.io/patr1ck-74/easychat:latest
```

### 2) 打开页面

访问：`http://你的服务器IP:7777`

### 3) 首次配置

1. 打开设置（齿轮）
2. 输入 `Admin Password`（即 `EASYCHAT_ADMIN_PASSWORD`）
3. 点击“加载配置”
4. 填写 `Base URL / Model / API Key`
5. 保存并测试

---

## Docker Compose（固定镜像）

```bash
docker compose up -d
```

默认读取项目里的 `docker-compose.yml`，已固定为：

`ghcr.io/patr1ck-74/easychat:latest`

使用前请修改：

- `EASYCHAT_ADMIN_PASSWORD`
- 配置文件挂载路径（建议改成你自己的路径）

---

## 本地开发（可选）

```powershell
cd D:\github\easychat\server
npm install
$env:EASYCHAT_ADMIN_PASSWORD="change-this-password"
node server.js
```

---

## 安全提示

- 不要提交真实配置文件（`server/presets.json`）
- API Key 只保存在服务端
- 前端不会直接暴露第三方 API Key
