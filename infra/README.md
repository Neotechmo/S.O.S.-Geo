# Infraestructura AWS con Terraform — S.O.S. Geo

Despliega **Frontend Angular + Backend Express** en un mismo **EC2 (Ubuntu 24.04)** en `us-east-1` con **Caddy** (HTTPS automático vía Let's Encrypt) bajo el subdominio `sosgeo.neotechmo.top`.

## Pasos manuales para desplegar

### 1. Generar o ubicar tu llave SSH pública
En PowerShell:
```powershell
# Si no tienes una llave SSH todavía:
ssh-keygen -t ed25519 -C "sosgeo-aws"
# Ver tu llave pública para copiarla:
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

### 2. Crear `infra/terraform.tfvars` (no se sube a Git)
Copia `infra/terraform.tfvars.example` a `infra/terraform.tfvars` y llena:
- `ssh_public_key`: el contenido de tu `.pub`
- `mongodb_uri`: tu cadena de MongoDB Atlas con `/sos_geo_db`
- `jwt_secret`: un secreto seguro

### 3. Aplicar Terraform
```powershell
cd infra
terraform init
terraform plan
terraform apply
```
Al terminar, Terraform imprimirá `elastic_ip` (la IP pública fija del servidor).

### 4. Configurar el DNS en GoDaddy
1. Entra a **GoDaddy → Dominios → `neotechmo.top` → DNS**.
2. Agrega un registro **Tipo `A`**:
   - **Nombre / Host:** `sosgeo`
   - **Valor / Apunta a:** `<elastic_ip que dio Terraform>`
   - **TTL:** `600 segundos` (o el mínimo permitido)
3. Espera 2–5 minutos a que propague el DNS; Caddy generará automáticamente el certificado HTTPS para `https://sosgeo.neotechmo.top`.

### 5. Cargar los datos de prueba (Seeds)
Conéctate por SSH al servidor y ejecuta el seed una vez:
```bash
ssh ubuntu@<elastic_ip>
sudo tail -n 30 /var/log/sos-geo-bootstrap.log  # verificar que terminó el setup
cd /opt/sos-geo/backend && sudo npm run seed
```

### 6. Actualizar el servidor cuando suban nuevos cambios a GitHub
```bash
ssh ubuntu@<elastic_ip>
sudo /opt/sos-geo/deploy.sh
```
