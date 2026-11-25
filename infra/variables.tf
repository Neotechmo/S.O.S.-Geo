variable "aws_region" {
  description = "Región de AWS donde se desplegará la infraestructura"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "Tipo de instancia EC2 (t3.small recomendado para compilar Angular; t3.micro funciona con swap)"
  type        = string
  default     = "t3.small"
}

variable "domain_name" {
  description = "Subdominio completo que apuntará al servidor EC2"
  type        = string
  default     = "sosgeo.neotechmo.top"
}

variable "git_branch" {
  description = "Rama del repositorio a desplegar en el EC2"
  type        = string
  default     = "dev"
}

variable "ssh_public_key" {
  description = "Contenido de tu llave pública SSH (ej. ~/.ssh/id_ed25519.pub)"
  type        = string
}

variable "mongodb_uri" {
  description = "Cadena de conexión completa de MongoDB Atlas (con /sos_geo_db)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secreto para firmar los tokens JWT en producción"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "Tiempo de expiración del JWT"
  type        = string
  default     = "8h"
}
