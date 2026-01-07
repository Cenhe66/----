#!/bin/bash

# 聊天论坛一键部署脚本
# 使用方法：chmod +x deploy.sh && ./deploy.sh

set -e

echo "=========================================="
echo "   聊天论坛 - 一键部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误：请使用 root 用户运行此脚本${NC}"
    echo "使用：sudo ./deploy.sh"
    exit 1
fi

# 获取项目目录
PROJECT_DIR="/var/www/chat-forum"
BACKUP_DIR="/var/backups/chat-forum"

echo -e "${GREEN}[1/10] 检查系统环境...${NC}"

# 检查操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo -e "${RED}无法检测操作系统${NC}"
    exit 1
fi

echo "操作系统: $OS $VER"

# 检查是否已安装 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js 已安装: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}Node.js 未安装，正在安装...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js 安装完成${NC}"
fi

# 检查 Node.js 版本
NODE_MAJOR=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}错误：Node.js 版本必须 >= 18.x${NC}"
    echo "当前版本: $(node --version)"
    exit 1
fi

echo -e "${GREEN}[2/10] 安装必要软件...${NC}"

# 更新系统
apt-get update -qq

# 安装必要软件
apt-get install -y nginx git build-essential

# 安装 PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 安装完成${NC}"
else
    echo -e "${GREEN}✓ PM2 已安装${NC}"
fi

# 安装 serve（用于前端）
if ! command -v serve &> /dev/null; then
    npm install -g serve
    echo -e "${GREEN}✓ serve 安装完成${NC}"
fi

echo -e "${GREEN}[3/10] 配置项目目录...${NC}"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 创建项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}创建项目目录...${NC}"
    mkdir -p $PROJECT_DIR
else
    echo -e "${YELLOW}项目目录已存在，备份旧版本...${NC}"
    if [ -d "$PROJECT_DIR/backend" ]; then
        cp -r $PROJECT_DIR/backend $BACKUP_DIR/backend_$(date +%Y%m%d_%H%M%S)
    fi
    if [ -d "$PROJECT_DIR/frontend" ]; then
        cp -r $PROJECT_DIR/frontend $BACKUP_DIR/frontend_$(date +%Y%m%d_%H%M%S)
    fi
fi

echo -e "${GREEN}[4/10] 上传代码...${NC}"
echo -e "${YELLOW}请选择上传方式：${NC}"
echo "1. Git 克隆（推荐）"
echo "2. 手动上传（使用 SCP/FTP/SFTP）"
read -p "请选择 [1-2]: " upload_method

if [ "$upload_method" = "1" ]; then
    read -p "请输入 Git 仓库地址: " git_repo
    if [ -d "$PROJECT_DIR/.git" ]; then
        echo -e "${YELLOW}更新代码...${NC}"
        cd $PROJECT_DIR
        git pull
    else
        echo -e "${YELLOW}克隆代码...${NC}"
        git clone $git_repo $PROJECT_DIR
    fi
else
    echo -e "${YELLOW}请手动上传代码到 $PROJECT_DIR${NC}"
    echo "可以使用："
    echo "  - SCP: scp -r chat-forum root@服务器IP:/var/www/"
    echo "  - FileZilla: https://filezilla-project.org/"
    echo "  - WinSCP: https://winscp.net/"
    read -p "上传完成后按回车继续..."
fi

echo -e "${GREEN}[5/10] 安装项目依赖...${NC}"

# 安装后端依赖
if [ -f "$PROJECT_DIR/backend/package.json" ]; then
    echo -e "${YELLOW}安装后端依赖...${NC}"
    cd $PROJECT_DIR/backend
    npm install --production
    echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
fi

# 安装前端依赖
if [ -f "$PROJECT_DIR/frontend/package.json" ]; then
    echo -e "${YELLOW}安装前端依赖...${NC}"
    cd $PROJECT_DIR/frontend
    npm install
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
fi

echo -e "${GREEN}[6/10] 配置环境变量...${NC}"

# 检查并创建 .env 文件
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    echo -e "${YELLOW}创建环境变量文件...${NC}"
    cd $PROJECT_DIR/backend

    # 生成随机 JWT_SECRET
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

    cat > .env <<EOF
PORT=3001
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
EOF

    echo -e "${GREEN}✓ .env 文件已创建${NC}"
    echo -e "${RED}⚠️  请记住 JWT_SECRET: $JWT_SECRET${NC}"
    echo -e "${RED}⚠️  请妥善保存此密钥！${NC}"
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi

echo -e "${GREEN}[7/10] 构建前端...${NC}"

cd $PROJECT_DIR/frontend
npm run build
echo -e "${GREEN}✓ 前端构建完成${NC}"

echo -e "${GREEN}[8/10] 配置 Nginx...${NC}"

# 创建 Nginx 配置
read -p "请输入域名或服务器IP: " domain_name

cat > /etc/nginx/sites-available/chat-forum <<EOF
server {
    listen 80;
    server_name $domain_name;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/chat-forum /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ Nginx 配置测试通过${NC}"
else
    echo -e "${RED}✗ Nginx 配置有误${NC}"
    nginx -t
    exit 1
fi

# 重启 Nginx
systemctl restart nginx
echo -e "${GREEN}✓ Nginx 已重启${NC}"

echo -e "${GREEN}[9/10] 启动应用服务...${NC}"

# 停止旧服务
pm2 stop forum-backend 2>/dev/null || true
pm2 stop forum-frontend 2>/dev/null || true

# 启动后端
cd $PROJECT_DIR/backend
pm2 start server.js --name forum-backend
pm2 save
echo -e "${GREEN}✓ 后端服务已启动${NC}"

# 启动前端
cd $PROJECT_DIR/frontend
pm2 start "serve -s dist -l 3000" --name forum-frontend
pm2 save
echo -e "${GREEN}✓ 前端服务已启动${NC}"

# 设置开机自启
pm2 startup
echo -e "${GREEN}✓ PM2 开机自启已配置${NC}"

echo -e "${GREEN}[10/10] 配置防火墙...${NC}"

# 配置防火墙
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo -e "${GREEN}✓ 防火墙已配置（UFW）${NC}"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --reload
    echo -e "${GREEN}✓ 防火墙已配置（firewalld）${NC}"
else
    echo -e "${YELLOW}未检测到防火墙，请手动配置${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址："
echo -e "  HTTP:  ${GREEN}http://$domain_name${NC}"
echo -e "  HTTPS: ${GREEN}https://$domain_name${NC}（需要配置 SSL）"
echo ""
echo "管理命令："
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs forum-backend"
echo "  重启服务: pm2 restart all"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. 访问 http://$domain_name 测试网站"
echo "2. 使用默认管理员账号登录：admin / admin123"
echo "3. 立即修改管理员密码！"
echo "4. 配置 HTTPS（可选但推荐）"
echo ""
echo -e "${RED}重要提示：${NC}"
echo "JWT_SECRET 已保存在 $PROJECT_DIR/backend/.env"
echo "请妥善保存此密钥，丢失后需要重新生成！"
echo ""
