resource "aws_security_group" "sos_geo_sg" {
  name        = "sos-geo-ec2-sg"
  description = "Permite trafico HTTP (80), HTTPS (443) y SSH (22) para S.O.S. Geo"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP (redireccion y validacion Lets Encrypt)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (Frontend Angular + /api/* Express)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Trafico saliente libre (MongoDB Atlas, npm, apt, Lets Encrypt)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "sos-geo-ec2-sg"
    Project = "S.O.S.-Geo"
  }
}

resource "aws_eip" "sos_geo_eip" {
  domain = "vpc"

  tags = {
    Name    = "sos-geo-eip"
    Project = "S.O.S.-Geo"
  }
}

resource "aws_eip_association" "sos_geo_eip_assoc" {
  instance_id   = aws_instance.sos_geo_server.id
  allocation_id = aws_eip.sos_geo_eip.id
}
