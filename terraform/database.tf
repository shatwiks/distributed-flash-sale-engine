# ==============================================================================
# Managed Data Tier: Amazon RDS PostgreSQL 16 & Amazon ElastiCache Redis 7
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Amazon RDS PostgreSQL
# ------------------------------------------------------------------------------

resource "aws_db_subnet_group" "postgres" {
  name        = "${var.app_name}-db-subnet-group"
  description = "Private subnet group for RDS PostgreSQL instance"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.app_name}-db"
  engine            = "postgres"
  engine_version    = "16.1"
  instance_class    = var.db_instance_class

  # Storage Configuration (gp3 with storage autoscaling)
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"

  # Database Credentials & Attributes
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Network & Access Control
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup & Maintenance
  backup_retention_period     = 7
  auto_minor_version_upgrade = true
  skip_final_snapshot        = true
  deletion_protection        = false

  tags = {
    Name = "${var.app_name}-postgres"
  }
}

# ------------------------------------------------------------------------------
# 2. Amazon ElastiCache for Redis
# ------------------------------------------------------------------------------

resource "aws_elasticache_subnet_group" "redis" {
  name        = "${var.app_name}-redis-subnet-group"
  description = "Private subnet group for ElastiCache Redis"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "${var.app_name}-redis-subnet-group"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.app_name}-redis"
  description          = "Redis 7 replication group for in-memory stock counters and Redlock"

  node_type                  = var.redis_node_type
  num_cache_clusters         = 1
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = false
  auto_minor_version_upgrade = true
  apply_immediately          = true

  tags = {
    Name = "${var.app_name}-redis"
  }
}
