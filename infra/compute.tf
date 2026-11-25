data "aws_ami" "ubuntu_24_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "sos_geo_key" {
  key_name   = "sos-geo-deploy-key"
  public_key = var.ssh_public_key
}

resource "aws_instance" "sos_geo_server" {
  ami                    = data.aws_ami.ubuntu_24_04.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.sos_geo_key.key_name
  vpc_security_group_ids = [aws_security_group.sos_geo_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/templates/user_data.sh.tpl", {
    domain_name    = var.domain_name
    git_branch     = var.git_branch
    mongodb_uri    = var.mongodb_uri
    jwt_secret     = var.jwt_secret
    jwt_expires_in = var.jwt_expires_in
  })

  tags = {
    Name    = "sos-geo-server"
    Project = "S.O.S.-Geo"
  }
}
