# AWS ECS Fargate & Cloud Infrastructure Deployment Runbook

This guide documents the end-to-end production deployment lifecycle for the **Flash-Sale Ticket Booking System** on AWS ECS Fargate, Amazon RDS PostgreSQL, and Amazon ElastiCache for Redis, managed via Terraform.

---

## 1. Prerequisites & Tooling Setup

Ensure the following command-line utilities are installed and configured:
- **AWS CLI v2** (`aws --version`) with authenticated credentials configured via `aws configure` (requires IAM permissions for VPC, ECS, ECR, RDS, ElastiCache, ALB, IAM, and CloudWatch).
- **Terraform v1.5+** (`terraform -version`).
- **Docker Desktop / Docker CLI** (`docker --version`).
- **curl** or **k6** for live endpoint validation.

Set your target AWS region and account ID environment variables:
```bash
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO_NAME="ticket-booking-api"
export ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"
```

---

## 2. Phase 1: Build & Push Production Docker Image to AWS ECR

Before spinning up ECS Fargate tasks, the production image must exist in your private ECR registry.

### A. Create the ECR Repository (If not already created via Terraform)
```bash
aws ecr create-repository \
  --repository-name ${ECR_REPO_NAME} \
  --image-tag-mutability IMMUTABLE \
  --image-scanning-configuration scanOnPush=true \
  --region ${AWS_REGION}
```

### B. Authenticate Docker to Amazon ECR
```bash
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

### C. Build, Tag, and Push the Multi-Stage Image
```bash
# Build production image targeting linux/amd64 architecture for AWS Fargate
docker build --platform linux/amd64 -t ${ECR_REPO_NAME}:prod .

# Tag with ECR repository URI and timestamped/git release tag
IMAGE_TAG="v1.0.0"
docker tag ${ECR_REPO_NAME}:prod ${ECR_URI}:${IMAGE_TAG}
docker tag ${ECR_REPO_NAME}:prod ${ECR_URI}:latest

# Push to Amazon ECR
docker push ${ECR_URI}:${IMAGE_TAG}
docker push ${ECR_URI}:latest
```

---

## 3. Phase 2: Provision Cloud Infrastructure with Terraform

### A. Configure Terraform Variables
Navigate to the `terraform/` directory and create your `terraform.tfvars`:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` to set your ECR image and a secure RDS database password:
```hcl
aws_region       = "us-east-1"
environment      = "prod"
app_name         = "ticket-booking-api"
container_image  = "${ECR_URI}:latest"  # Replace with your actual ECR URI
db_password      = "YourStrongMasterPassword123!" # Choose a secure random password
ecs_min_capacity = 2
ecs_max_capacity = 10
```

### B. Initialize & Validate Terraform
```bash
terraform init
terraform validate
```

### C. Review Execution Plan
Verify that the 25+ managed resources (VPC, Subnets, NAT Gateway, Security Groups, RDS, ElastiCache, ALB, ECS Cluster, Task Definition, Service, Auto Scaling policies) match expectations:
```bash
terraform plan -out=tfplan
```

### D. Apply and Provision Infrastructure
```bash
terraform apply tfplan
```
*Note: RDS PostgreSQL and ElastiCache Redis initialization typically takes 5 to 10 minutes to complete.*

Once complete, Terraform will display your deployment outputs:
```text
Outputs:
alb_dns_name         = "ticket-booking-api-alb-123456789.us-east-1.elb.amazonaws.com"
api_endpoint         = "http://ticket-booking-api-alb-123456789.us-east-1.elb.amazonaws.com"
ecr_repository_url   = "123456789012.dkr.ecr.us-east-1.amazonaws.com/ticket-booking-api"
elasticache_endpoint = "ticket-booking-api-redis.xxxxxx.0001.use1.cache.amazonaws.com:6379"
rds_endpoint         = "ticket-booking-api-db.xxxxxx.us-east-1.rds.amazonaws.com:5432"
```

Save the ALB DNS name to an environment variable:
```bash
export API_URL=$(terraform output -raw api_endpoint)
echo "API Endpoint: ${API_URL}"
```

---

## 4. Phase 3: Live Verification & Smoke Testing

### A. Verify Health Check Endpoint
Query the dual-service health check through the Application Load Balancer:
```bash
curl -i ${API_URL}/health
```

**Expected HTTP Response (`200 OK`):**
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "ok",
  "services": {
    "postgres": "up",
    "redis": "up"
  }
}
```

### B. Create an Event with Inventory
Create a test flash-sale event with 50 tickets:
```bash
curl -s -X POST "${API_URL}/events" \
  -H "Content-Type: application/json" \
  -d '{"name": "AWS Fargate Launch Event", "total_tickets": 50}'
```

Extract the `id` from the response JSON and save it:
```bash
EVENT_ID="<event-uuid-from-response>"
```

### C. Verify In-Memory Cache Pre-warming
Trigger cache pre-warming ahead of traffic:
```bash
curl -i -X POST "${API_URL}/events/${EVENT_ID}/prewarm"
```

**Expected Response (`200 OK`):**
```json
{
  "message": "Event inventory pre-warmed in Redis successfully.",
  "eventId": "<event-uuid>",
  "available_tickets": 50,
  "cached": true
}
```

### D. Execute Test Checkout
Execute a ticket checkout order:
```bash
curl -i -X POST "${API_URL}/events/${EVENT_ID}/checkout" \
  -H "Content-Type: application/json" \
  -d '{"userId": "aws-cloud-tester-1", "quantity": 2, "idempotencyKey": "aws-key-001"}'
```

**Expected Response (`201 Created`):**
```json
{
  "id": "...",
  "event_id": "<event-uuid>",
  "user_id": "aws-cloud-tester-1",
  "quantity": 2,
  "status": "confirmed",
  "idempotency_key": "aws-key-001",
  "created_at": "..."
}
```

---

## 5. Phase 4: Zero-Downtime Rolling Deployment Workflow

When pushing code updates to production:

1. Build and push the new image to ECR with a new tag:
   ```bash
   IMAGE_TAG="v1.0.1"
   docker build --platform linux/amd64 -t ${ECR_URI}:${IMAGE_TAG} .
   docker push ${ECR_URI}:${IMAGE_TAG}
   ```
2. Update `container_image` in `terraform.tfvars`:
   ```hcl
   container_image = "${ECR_URI}:v1.0.1"
   ```
3. Run Terraform apply:
   ```bash
   terraform apply -auto-approve
   ```
4. ECS Fargate performs a zero-downtime rolling update:
   - Starts new tasks with the new task definition (`deployment_maximum_percent = 200`).
   - Waits for new tasks to pass the ALB `/health` check.
   - Drains connections on old tasks (`deregistration_delay = 30`).
   - Terminates old tasks once traffic is safely routed to new tasks (`deployment_minimum_healthy_percent = 100`).

---

## 6. Phase 5: Complete & Safe Teardown (`terraform destroy`)

To eliminate unexpected AWS infrastructure charges when the environment is no longer required:

### A. Run Terraform Destroy
From the `terraform/` directory:
```bash
terraform destroy
```

Type `yes` when prompted to confirm removal.

### B. Verification of Deleted Resources
Verify that billable components have been decommissioned:
```bash
# Verify ECS Services are removed
aws ecs list-clusters --region ${AWS_REGION}

# Verify RDS Instances are terminated
aws rds describe-db-instances --region ${AWS_REGION}

# Verify ElastiCache Clusters are deleted
aws elasticache describe-replication-groups --region ${AWS_REGION}

# Verify Load Balancers are removed
aws elbv2 describe-load-balancers --region ${AWS_REGION}

# Verify NAT Gateways and EIPs are released
aws ec2 describe-nat-gateways --region ${AWS_REGION}
```

### C. (Optional) Remove ECR Images & Repository
```bash
aws ecr delete-repository --repository-name ${ECR_REPO_NAME} --force --region ${AWS_REGION}
```
