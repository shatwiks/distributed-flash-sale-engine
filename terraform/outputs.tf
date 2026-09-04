# ==============================================================================
# Terraform Outputs
# ==============================================================================

output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "api_endpoint" {
  description = "Public HTTP endpoint to access the ticket booking API"
  value       = "http://${aws_lb.main.dns_name}"
}

output "rds_endpoint" {
  description = "Connection endpoint hostname for Amazon RDS PostgreSQL"
  value       = aws_db_instance.postgres.endpoint
}

output "elasticache_endpoint" {
  description = "Primary connection endpoint for Amazon ElastiCache Redis"
  value       = "${aws_elasticache_replication_group.redis.primary_endpoint_address}:${aws_elasticache_replication_group.redis.port}"
}

output "ecr_repository_url" {
  description = "AWS ECR Docker repository URL for image deployment"
  value       = aws_ecr_repository.app.repository_url
}

output "vpc_id" {
  description = "Identifier of the created VPC"
  value       = aws_vpc.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS Fargate cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS Fargate service"
  value       = aws_ecs_service.main.name
}
