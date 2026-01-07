# 聊天论坛 - 前后端分离项目

一个简单的前后端分离聊天论坛网站，支持用户注册、登录、发帖、评论和管理员功能。

## 技术栈

### 后端
- Node.js + Express
- SQLite（轻量级数据库）
- JWT 认证
- bcryptjs 密码加密

### 前端
- React 18
- Vite
- React Router
- Axios
- CSS

## 项目结构

```
chat-forum/
├── backend/          # 后端项目
│   ├── database.js   # 数据库配置
│   ├── server.js     # 服务器入口
│   ├── .env          # 环境变量
│   ├── middleware/   # 中间件
│   └── routes/       # 路由
└── frontend/         # 前端项目
    ├── src/
    │   ├── pages/    # 页面组件
    │   ├── context/  # Context
    │   └── services/ # API服务
    └── vite.config.js
```

## 快速开始

### 1. 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 2. 启动项目

#### 启动后端（端口 3001）
```bash
cd backend
npm start
```

开发模式（自动重启）：
```bash
npm run dev
```

#### 启动前端（端口 3000）
```bash
cd frontend
npm run dev
```

### 3. 访问应用

- 前端地址: http://localhost:3000
- 后端API: http://localhost:3001/api

## 默认管理员账号

系统会自动创建一个管理员账号：
- 用户名: `admin`
- 密码: `admin123`

**⚠️ 重要：生产环境请立即修改默认密码！**

## 功能特性

### 用户功能
- ✅ 用户注册
- ✅ 用户登录（JWT认证）
- ✅ 创建帖子
- ✅ 编辑自己的帖子
- ✅ 删除自己的帖子
- ✅ 查看帖子详情
- ✅ 发表评论
- ✅ 删除自己的评论

### 管理员功能
- ✅ 查看所有用户
- ✅ 修改用户角色（普通用户/管理员）
- ✅ 删除用户
- ✅ 删除任何帖子
- ✅ 删除任何评论

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 帖子接口
- `GET /api/posts` - 获取所有帖子
- `GET /api/posts/:id` - 获取帖子详情
- `POST /api/posts` - 创建帖子（需要登录）
- `PUT /api/posts/:id` - 更新帖子（需要登录）
- `DELETE /api/posts/:id` - 删除帖子（需要登录）
- `POST /api/posts/:id/comments` - 添加评论（需要登录）
- `DELETE /api/posts/:postId/comments/:commentId` - 删除评论（需要登录）

### 管理员接口
- `GET /api/admin/users` - 获取所有用户（需要管理员权限）
- `PUT /api/admin/users/:id/role` - 修改用户角色（需要管理员权限）
- `DELETE /api/admin/users/:id` - 删除用户（需要管理员权限）

## 部署到生产环境

### 1. 服务器准备

你需要一台云服务器（阿里云、腾讯云、华为云等），推荐配置：
- CPU: 1核或以上
- 内存: 1GB或以上
- 操作系统: Ubuntu 20.04 或 CentOS 7+

### 2. 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 3. 上传代码到服务器

使用 git 或 scp 上传代码到服务器：

```bash
# 使用 git
git clone <your-repo-url> /var/www/chat-forum

# 或使用 scp
scp -r chat-forum user@your-server:/var/www/
```

### 4. 配置后端环境变量

编辑 `backend/.env` 文件：

```env
PORT=3001
JWT_SECRET=your-very-secure-random-secret-key-change-this
NODE_ENV=production
```

**⚠️ 重要：生产环境必须修改 JWT_SECRET！**

### 5. 安装依赖并启动

```bash
cd /var/www/chat-forum/backend
npm install --production
npm start
```

### 6. 构建前端

```bash
cd /var/www/chat-forum/frontend
npm install
npm run build
```

### 7. 使用 PM2 管理进程（推荐）

安装 PM2：
```bash
npm install -g pm2
```

启动后端：
```bash
cd /var/www/chat-forum/backend
pm2 start server.js --name forum-backend
```

启动前端（使用 serve）：
```bash
cd /var/www/chat-forum/frontend
npm install -g serve
pm2 start "serve -s dist -l 3000" --name forum-frontend
```

设置开机自启：
```bash
pm2 startup
pm2 save
```

### 8. 配置 Nginx 反向代理

安装 Nginx：
```bash
sudo apt-get install nginx  # Ubuntu/Debian
sudo yum install nginx      # CentOS/RHEL
```

创建配置文件 `/etc/nginx/sites-available/chat-forum`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/chat-forum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. 配置 HTTPS（使用 Let's Encrypt）

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 10. 配置防火墙

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 数据库说明

本项目使用 SQLite 数据库，数据库文件位于 `backend/forum.db`。

### 数据库表结构

#### users 表
- id: 用户ID（主键）
- username: 用户名（唯一）
- email: 邮箱（唯一）
- password: 密码（加密）
- role: 角色（user/admin）
- created_at: 创建时间

#### posts 表
- id: 帖子ID（主键）
- title: 标题
- content: 内容
- user_id: 作者ID（外键）
- created_at: 创建时间
- updated_at: 更新时间

#### comments 表
- id: 评论ID（主键）
- content: 评论内容
- post_id: 帖子ID（外键）
- user_id: 用户ID（外键）
- created_at: 创建时间

### 数据库备份

定期备份数据库文件：
```bash
cp backend/forum.db backup/forum-$(date +%Y%m%d).db
```

## 常见问题

### 1. 端口被占用
修改 `backend/.env` 中的 PORT 值

### 2. CORS 错误
确保后端的 CORS 配置正确，前端 API 地址正确

### 3. 数据库权限问题
确保 `backend/forum.db` 文件有正确的读写权限

### 4. 前端无法连接后端
检查后端是否正常运行，检查 API 地址配置

## 安全建议

1. **修改默认管理员密码**
2. **使用强 JWT_SECRET**
3. **启用 HTTPS**
4. **定期备份数据库**
5. **限制 API 请求频率**
6. **添加输入验证和清理**
7. **设置适当的 CORS 策略**

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或 Pull Request。
