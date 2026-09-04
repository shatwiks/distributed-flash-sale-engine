# ==============================================================================
# Application Auto Scaling: High-Concurrency Target Tracking Policies
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Scalable Target Definition (ECS Service Desired Count)
# ------------------------------------------------------------------------------
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# ------------------------------------------------------------------------------
# 2. Policy 1: ALB Request Count Per Target Tracking
# Scales out rapidly when throughput per container approaches 1,000 req/min
# ------------------------------------------------------------------------------
resource "aws_appautoscaling_policy" "alb_requests" {
  name               = "${var.app_name}-alb-request-count-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.api.arn_suffix}"
    }

    target_value       = var.alb_request_count_target
    scale_out_cooldown = 30  # Scale out rapidly during traffic surges
    scale_in_cooldown  = 300 # Cool down gradually to prevent flapping
  }
}

# ------------------------------------------------------------------------------
# 3. Policy 2: CPU Utilization Tracking
# Scales out if average ECS CPU exceeds 65%
# ------------------------------------------------------------------------------
resource "aws_appautoscaling_policy" "cpu_utilization" {
  name               = "${var.app_name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = var.cpu_utilization_target
    scale_out_cooldown = 30
    scale_in_cooldown  = 300
  }
}
