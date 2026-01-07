# 部署指南 - 让互联网用户访问你的论坛

## 📋 部署前准备

### 需要的东西
1. ✅ 云服务器（阿里云、腾讯云、华为云等）
2. ✅ 域名（可选，但推荐）
3. ✅ 服务器配置：1核2G 或以上
4. ✅ 操作系统：Ubuntu 20.04 / CentOS 7+ 推荐

---

## 🚀 部署步骤

### 第一步：购买并配置云服务器

#### 1.1 购买服务器
推荐云服务商：
- **阿里云**: https://www.aliyun.com/
- **腾讯云**: https://cloud.tencent.com/
- **华为云**: https://www.huaweicloud.com/
- **Vultr**: https://www.vultr.com/（国外，便宜）

推荐配置：
- CPU: 1核 或 2核
- 内存: 2GB 或 4GB
- 带宽: 1Mbps 或以上
- 系统: Ubuntu 20.04 LTS

#### 1.2 获取服务器信息
购买后你会得到：
- **公网IP**: 例如 123.45.67.89
- **SSH端口**: 通常是 22
- **root密码** 或 **SSH密钥**

---

### 第二步：连接到服务器

#### Windows 用户（使用 PuTTY）
1. 下载 PuTTY: https://www.putty.org/
2. 输入服务器IP
3. 端口：22
4. 点击"Open"
5. 用户名：root
6. 输入密码

#### Windows/Mac/Linux 用户（使用 SSH）
```bash
ssh root@你的服务器IP
# 例如：ssh root@123.45.67.89
```

---

### 第三步：安装 Node.js 和 Nginx

#### 3.1 安装 Node.js 18.x（Ubuntu）
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
# 应该显示 v18.x.x
```

#### 3.2 安装 Nginx
```bash
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 3.3 安装 PM2（进程管理器）
```bash
sudo npm install -g pm2
```

---

### 第四步：上传代码到服务器

#### 方式一：使用 Git（推荐）
```bash
# 安装 Git
sudo apt install -y git

# 克隆你的代码（需要先推送到 GitHub/GitLab）
cd /var/www
sudo git clone https://github.com/你的用户名/chat-forum.git
```

#### 方式二：使用 SCP 上传
```bash
# 在本地电脑执行（Windows PowerShell）
scp -r "c:\Users\33657\Desktop\临时文件\chat-forum" root@你的服务器IP:/var/www/

# 或使用 WinSCP 图形化工具
# 下载：https://winscp.net/
```

#### 方式三：使用 FTP 工具
- **FileZilla**: https://filezilla-project.org/
- **WinSCP**: https://winscp.net/

---

### 第五步：安装项目依赖

#### 5.1 安装后端依赖
```bash
cd /var/www/chat-forum/backend
npm install --production
```

#### 5.2 配置环境变量
```bash
nano .env
```

编辑 `.env` 文件：
```env
PORT=3001
JWT_SECRET=你的超长随机密码-一定要改这个
NODE_ENV=production
```

**⚠️ 重要：JWT_SECRET 必须是强密码！**

生成强密码：
```bash
# 在本地生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 5.3 安装前端依赖
```bash
cd /var/www/chat-forum/frontend
npm install
```

#### 5.4 构建前端
```bash
npm run build
```

---

### 第六步：使用 PM2 启动服务

#### 6.1 启动后端
```bash
cd /var/www/chat-forum/backend
pm2 start server.js --name forum-backend
pm2 save
pm2 startup
```

#### 6.2 启动前端
```bash
cd /var/www/chat-forum/frontend
pm2 start "serve -s dist -l 3000" --name forum-frontend
pm2 save
pm2 startup
```

#### 6.3 查看运行状态
```bash
pm2 status
```

---

### 第七步：配置 Nginx 反向代理

#### 7.1 创建 Nginx 配置文件
```bash
sudo nano /etc/nginx/sites-available/chat-forum
```

粘贴以下内容：
```nginx
server {
    listen 80;
    server_name 你的域名.com;  # 如果没有域名，使用服务器IP

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

#### 7.2 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/chat-forum /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

### 第八步：配置防火墙

#### 8.1 开放必要端口
```bash
# Ubuntu (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

---

### 第九步：配置域名（可选但推荐）

#### 9.1 购买域名
- 阿里云：https://wanwang.aliyun.com/
- 腾讯云：https://dnspod.cloud.tencent.com/
- Namecheap：https://www.namecheap.com/

#### 9.2 配置 DNS 解析
在域名服务商添加 A 记录：
- **主机记录**: @
- **记录类型**: A
- **记录值**: 你的服务器IP
- **TTL**: 600

#### 9.3 更新 Nginx 配置
```bash
sudo nano /etc/nginx/sites-available/chat-forum
```

修改 `server_name` 为你的域名：
```nginx
server_name your-domain.com www.your-domain.com;
```

重启 Nginx：
```bash
sudo systemctl restart nginx
```

---

### 第十步：配置 HTTPS（强烈推荐）

#### 10.1 安装 Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 10.2 获取 SSL 证书
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### 10.3 自动续期
Certbot 会自动配置续期，验证：
```bash
sudo certbot renew --dry-run
```

---

## 📊 验证部署

### 检查服务状态
```bash
# 检查 PM2
pm2 status

# 检查 Nginx
sudo systemctl status nginx

# 检查端口
sudo netstat -tlnp | grep -E ':(3000|3001|80|443)'
```

### 测试访问
在浏览器中访问：
- **HTTP**: http://你的域名.com 或 http://服务器IP
- **HTTPS**: https://你的域名.com

---

## 🔧 常用管理命令

### PM2 命令
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs forum-backend
pm2 logs forum-frontend

# 重启服务
pm2 restart forum-backend
pm2 restart forum-frontend

# 停止服务
pm2 stop forum-backend
pm2 stop forum-frontend

# 删除服务
pm2 delete forum-backend
pm2 delete forum-frontend
```

### Nginx 命令
```bash
# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 查看应用日志
```bash
# 后端日志
pm2 logs forum-backend --lines 100

# 前端日志
pm2 logs forum-frontend --lines 100
```

---

## 🔒 安全建议

### 1. 修改默认管理员密码
登录后立即修改 admin 账号密码

### 2. 使用强 JWT_SECRET
```bash
# 生成随机密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. 定期备份数据库
```bash
# 创建备份脚本
nano /var/www/chat-forum/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /var/www/chat-forum/backend/forum.db $BACKUP_DIR/forum_$DATE.db
# 保留最近7天的备份
find $BACKUP_DIR -name "forum_*.db" -mtime +7 -delete
```

```bash
# 添加执行权限
chmod +x /var/www/chat-forum/backup.sh

# 添加到 crontab（每天凌晨2点备份）
crontab -e
# 添加：0 2 * * * /var/www/chat-forum/backup.sh
```

### 4. 配置 fail2ban 防止暴力破解
```bash
sudo apt install -y fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

---

## 🐛 故障排查

### 问题1：无法访问网站
```bash
# 检查 Nginx 是否运行
sudo systemctl status nginx

# 检查防火墙
sudo ufw status

# 检查端口
sudo netstat -tlnp | grep :80
```

### 问题2：后端 API 不工作
```bash
# 检查后端服务
pm2 status

# 查看后端日志
pm2 logs forum-backend

# 检查端口 3001
sudo netstat -tlnp | grep :3001
```

### 问题3：前端白屏
```bash
# 检查前端服务
pm2 status

# 查看前端日志
pm2 logs forum-frontend

# 检查构建文件
ls -la /var/www/chat-forum/frontend/dist
```

### 问题4：数据库错误
```bash
# 检查数据库文件权限
ls -la /var/www/chat-forum/backend/forum.db

# 修复权限
chmod 644 /var/www/chat-forum/backend/forum.db
```

---

## 📈 性能优化

### 1. 启用 Nginx Gzip 压缩
```bash
sudo nano /etc/nginx/nginx.conf
```

在 `http` 块添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
```

### 2. 配置缓存
```nginx
# 在 location / 块添加
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 使用 CDN（可选）
将静态资源上传到 CDN（阿里云 OSS、腾讯云 COS 等）

---

## 📞 技术支持

如果遇到问题：
1. 查看日志文件
2. 检查服务状态
3. 搜索错误信息
4. 参考官方文档

---

**祝部署成功！** 🎉
