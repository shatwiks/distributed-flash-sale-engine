# ==============================================================================
# Security Groups & Least-Privilege Network Access Controls
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Application Load Balancer Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Controls inbound public HTTP traffic to the Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow inbound HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic to ECS targets"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}

# ------------------------------------------------------------------------------
# 2. ECS Fargate Tasks Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "ecs" {
  name        = "${var.app_name}-ecs-tasks-sg"
  description = "Allows inbound traffic strictly from ALB and permits outbound connections"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Inbound container traffic strictly from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow outbound to NAT GW (image pull) and data tier (RDS/Redis)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ecs-tasks-sg"
  }
}

# ------------------------------------------------------------------------------
# 3. Amazon RDS PostgreSQL Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "Allows PostgreSQL traffic strictly from ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL port 5432 strictly from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name = "${var.app_name}-rds-sg"
  }
}

# ------------------------------------------------------------------------------
# 4. Amazon ElastiCache Redis Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "redis" {
  name        = "${var.app_name}-redis-sg"
  description = "Allows Redis traffic strictly from ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis port 6379 strictly from ECS tasks"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name = "${var.app_name}-redis-sg"
  }
}
