#!/usr/bin/env bash
# Cài Node.js 20 LTS trên Ubuntu (deb) qua NodeSource — dùng trước khi npm ci + pm2.
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Chạy với sudo, ví dụ: sudo bash scripts/install-node20-ubuntu.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

node -v
npm -v
echo "Xong. Trong thư mục backend: npm ci && npm run build && pm2 restart backend (hoặc ecosystem tương ứng)."
