output "elastic_ip" {
  description = "IP pública fija del servidor EC2 (úsala en el registro A de GoDaddy)"
  value       = aws_eip.sos_geo_eip.public_ip
}

output "instance_id" {
  description = "ID de la instancia EC2 creada"
  value       = aws_instance.sos_geo_server.id
}

output "app_url" {
  description = "URL pública HTTPS de la aplicación"
  value       = "https://${var.domain_name}"
}

output "ssh_command" {
  description = "Comando para conectarte por SSH al servidor"
  value       = "ssh ubuntu@${aws_eip.sos_geo_eip.public_ip}"
}
