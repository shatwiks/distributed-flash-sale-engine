# ==============================================================================
# Variables Configuration
# ==============================================================================

variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name (e.g. prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name used across resource identifiers"
  type        = string
  default     = "ticket-booking-api"
}

# ------------------------------------------------------------------------------
# Networking
# ------------------------------------------------------------------------------
variable "vpc_cidr" {
  description = "CIDR block for the dedicated VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (ALB layer)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (ECS, RDS, ElastiCache layer)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ------------------------------------------------------------------------------
# Container & ECS
# ------------------------------------------------------------------------------
variable "container_image" {
  description = "Full ECR image URI and tag for the containerized service"
  type        = string
  default     = "ticket-booking-api:latest"
}

variable "container_port" {
  description = "Port exposed by the container application"
  type        = number
  default     = 3000
}

variable "ecs_cpu" {
  description = "Fargate CPU units (256 = 0.25 vCPU)"
  type        = string
  default     = "256"
}

variable "ecs_memory" {
  description = "Fargate memory in MiB (512 = 0.5 GB)"
  type        = string
  default     = "512"
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks to maintain"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks under high-load autoscaling"
  type        = number
  default     = 10
}

# ------------------------------------------------------------------------------
# Database (RDS PostgreSQL)
# ------------------------------------------------------------------------------
variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "ticket_booking"
}

variable "db_username" {
  description = "Master username for RDS PostgreSQL"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Master password for RDS PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Database instance compute class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in gigabytes (gp3)"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum autoscaled storage limit in gigabytes"
  type        = number
  default     = 100
}

# ------------------------------------------------------------------------------
# Cache (Amazon ElastiCache Redis)
# ------------------------------------------------------------------------------
variable "redis_node_type" {
  description = "ElastiCache node instance type"
  type        = string
  default     = "cache.t4g.micro"
}

# ------------------------------------------------------------------------------
# Autoscaling Metrics
# ------------------------------------------------------------------------------
variable "alb_request_count_target" {
  description = "Target requests per minute per target for ALB autoscaling"
  type        = number
  default     = 1000
}

variable "cpu_utilization_target" {
  description = "Target average CPU percentage for ECS autoscaling"
  type        = number
  default     = 65
}
