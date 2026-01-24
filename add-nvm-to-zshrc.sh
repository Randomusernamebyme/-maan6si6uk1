#!/bin/bash

# 添加 nvm 配置到 .zshrc

echo "正在檢查 .zshrc 配置..."

if grep -q "NVM_DIR" ~/.zshrc 2>/dev/null; then
    echo "✓ nvm 配置已存在於 .zshrc"
else
    echo "正在添加 nvm 配置到 .zshrc..."
    
    cat >> ~/.zshrc << 'EOF'

# nvm configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
    
    echo "✓ nvm 配置已添加到 .zshrc"
    echo ""
    echo "請執行以下命令重新載入配置："
    echo "  source ~/.zshrc"
    echo ""
    echo "或重新打開終端窗口"
fi
