#!/bin/bash

echo "正在安裝 nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

echo "載入 nvm..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "安裝 Node.js LTS..."
nvm install --lts
nvm use --lts
nvm alias default --lts

echo "驗證安裝..."
node --version
npm --version

echo "進入專案目錄並安裝依賴..."
cd /Users/gin1daai6/maan6si6uk1/-maan6si6uk1
npm install --no-audit

echo "完成！"
