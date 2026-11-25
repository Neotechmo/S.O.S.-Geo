#!/bin/bash
set -euxo pipefail

exec > >(tee /var/log/sos-geo-bootstrap.log) 2>&1

# 1. Swap de 2 GB para evitar falta de memoria al compilar Angular
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 2. Actualizar paquetes e instalar utilidades
apt-get update -y
apt-get install -y curl git debian-keyring debian-archive-keyring apt-transport-https

# 3. Instalar Node.js 22 LTS y PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2

# 4. Instalar Caddy (HTTPS automático con Let's Encrypt)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update -y
apt-get install -y caddy

# 5. Clonar repositorio S.O.S. Geo
mkdir -p /opt/sos-geo
git clone -b "${git_branch}" https://github.com/Neotechmo/S.O.S.-Geo.git /opt/sos-geo

# 6. Configurar backend/.env y levantar API Express con PM2
cat <<EOF > /opt/sos-geo/backend/.env
PORT=3000
FRONTEND_ORIGINS=https://${domain_name}
MONGODB_URI="${mongodb_uri}"
JWT_SECRET="${jwt_secret}"
JWT_EXPIRES_IN="${jwt_expires_in}"
EOF

cd /opt/sos-geo/backend
npm ci --omit=dev
pm2 start src/index.js --name sos-geo-backend
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# 7. Compilar Frontend Angular para producción
cd /opt/sos-geo/frontend
npm ci
npx ng build

# 8. Configurar Caddyfile (Frontend + Reverse Proxy /api/*)
cat <<EOF > /etc/caddy/Caddyfile
${domain_name} {
    encode gzip

    handle /api/* {
        reverse_proxy 127.0.0.1:3000
    }

    handle {
        root * /opt/sos-geo/frontend/dist/sos-geo/browser
        try_files {path} /index.html
        file_server
    }
}
EOF

systemctl enable caddy
systemctl restart caddy

# 9. Script rápido para actualizar el servidor tras nuevos merges en GitHub
cat <<'EOF' > /opt/sos-geo/deploy.sh
#!/bin/bash
set -euo pipefail
cd /opt/sos-geo
git pull origin "${git_branch}"
cd /opt/sos-geo/backend
npm ci --omit=dev
pm2 restart sos-geo-backend
cd /opt/sos-geo/frontend
npm ci
npx ng build
systemctl reload caddy
echo "Actualización completada."
EOF
chmod +x /opt/sos-geo/deploy.sh
