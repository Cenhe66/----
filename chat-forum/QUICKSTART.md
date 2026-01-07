# 聊天论坛 - 快速开始指南

## ⚠️ 重要提示

你的当前 Node.js 版本是 **14.15.4**，这个版本太旧，无法运行前端开发服务器。

### 解决方案：升级 Node.js

#### Windows 用户
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载并安装 **LTS 版本**（推荐 18.x 或 20.x）
3. 安装完成后，重启终端并验证：
   ```bash
   node --version
   ```
   应该显示 18.x 或更高版本

#### 使用 nvm（推荐）
如果你安装了 nvm-windows：
```bash
nvm install 18
nvm use 18
```

---

## 项目已创建完成！

项目位置：`c:\Users\33657\Desktop\临时文件\chat-forum`

### 项目结构
```
chat-forum/
├── backend/          # 后端（Node.js + Express + SQLite）
│   ├── database.js   # 数据库配置
│   ├── server.js     # 服务器入口
│   ├── .env          # 环境变量
│   ├── middleware/   # 中间件
│   └── routes/       # 路由
└── frontend/         # 前端（React + Vite）
    ├── src/
    │   ├── pages/    # 页面组件
    │   ├── context/  # Context
    │   └── services/ # API服务
    └── vite.config.js
```

---

## 后端已成功启动 ✅

后端服务器已经在运行：
- **地址**: http://localhost:3001
- **API**: http://localhost:3001/api
- **数据库**: SQLite（自动创建 forum.db）
- **默认管理员**: admin / admin123

### 测试后端 API

你可以使用 Postman 或 curl 测试 API：

```bash
# 健康检查
curl http://localhost:3001/api/health

# 注册用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"123456"}'

# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 前端启动（需要升级 Node.js）

升级 Node.js 后，执行以下步骤：

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问：http://localhost:3000

---

## 功能特性

### ✅ 用户功能
- 用户注册和登录
- JWT 认证
- 创建、编辑、删除帖子
- 发表和删除评论
- 查看帖子列表和详情

### ✅ 管理员功能
- 查看所有用户
- 修改用户角色（普通用户/管理员）
- 删除用户
- 管理所有帖子和评论

---

## 数据库说明

### 数据库文件
- 位置：`backend/forum.db`
- 类型：SQLite（无需额外安装）
- 自动创建表：users, posts, comments

### 表结构

**users 表**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME
)
```

**posts 表**
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  title TEXT,
  content TEXT,
  user_id INTEGER,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

**comments 表**
```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY,
  content TEXT,
  post_id INTEGER,
  user_id INTEGER,
  created_at DATETIME,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

---

## 部署到服务器

### 准备工作
1. 购买云服务器（阿里云、腾讯云等）
2. 安装 Node.js 18+ 和 Nginx
3. 上传代码到服务器

### 快速部署步骤

```bash
# 1. 安装 Node.js（Ubuntu）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 上传代码后，进入项目目录
cd /var/www/chat-forum

# 3. 安装后端依赖
cd backend
npm install --production

# 4. 配置环境变量
nano .env
# 修改 JWT_SECRET 为强密码

# 5. 安装 PM2
npm install -g pm2

# 6. 启动后端
pm2 start server.js --name forum-backend

# 7. 构建前端
cd ../frontend
npm install
npm run build

# 8. 安装 serve
npm install -g serve

# 9. 启动前端
pm2 start "serve -s dist -l 3000" --name forum-frontend

# 10. 配置 Nginx 反向代理
sudo nano /etc/nginx/sites-available/chat-forum
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 安全建议

1. **修改默认管理员密码**
2. **使用强 JWT_SECRET**（生产环境）
3. **启用 HTTPS**（使用 Let's Encrypt）
4. **定期备份数据库**
5. **配置防火墙**
6. **限制 API 请求频率**

---

## 常见问题

### Q: 后端启动失败？
A: 检查端口 3001 是否被占用，修改 `backend/.env` 中的 PORT

### Q: 前端无法连接后端？
A: 确保后端正在运行，检查 API 地址配置

### Q: 数据库文件在哪里？
A: `backend/forum.db`，可以直接用 SQLite 工具查看

### Q: 如何重置数据库？
A: 删除 `backend/forum.db` 文件，重启后端会自动重建

---

## 下一步

1. 升级 Node.js 到 18+ 版本
2. 启动前端开发服务器
3. 测试所有功能
4. 部署到云服务器
5. 配置域名和 HTTPS

---

## 技术支持

如有问题，请查看：
- [README.md](./README.md) - 完整文档
- 后端日志：终端输出
- 前端日志：浏览器控制台

---

**祝使用愉快！** 🎉
