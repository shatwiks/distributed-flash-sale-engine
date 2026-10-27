# 🚀 Production Deployment Guide

This project is fully prepared for zero-friction production deployment. Follow whichever option best fits your goal:

---

## ⚡ Option 1: 5-Minute 1-Click Deployment (Render + Vercel)
*Recommended for live portfolio demos, recruiter showcases, and quick cloud hosting.*

### Step 1: Deploy Backend, PostgreSQL & Redis on Render
1. Push your repository to **GitHub**.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Blueprint**.
3. Select this repository.
4. Render will automatically read [`render.yaml`](./render.yaml) and declare 3 services:
   * **`ticket-booking-api`**: Express Node.js Web Service (runs migrations and boots API).
   * **`ticket-booking-db`**: Managed PostgreSQL 16 database.
   * **`ticket-booking-redis`**: Managed Redis 7 cache with private network isolation.
5. Click **Apply**. Wait ~2 minutes for all 3 services to turn **Live (Green)**.
6. Copy your public Render API URL (e.g. `https://ticket-booking-api-xxxx.onrender.com`).

---

### Step 2: Deploy Frontend on Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/) and click **Add New...** → **Project**.
2. Import this repository.
3. In project settings:
   * **Root Directory**: `frontend` *(or leave default root, [`vercel.json`](./vercel.json) handles building automatically)*.
   * **Environment Variables**:
     * Add `NEXT_PUBLIC_API_URL` = `https://ticket-booking-api-xxxx.onrender.com` *(your Render API URL from Step 1, without trailing slash)*.
4. Click **Deploy**.
5. Within 60 seconds, your interactive Next.js 16 UI is live on `https://your-project.vercel.app`!

---

## ☁️ Option 2: Enterprise Cloud Deployment (AWS ECS Fargate + Terraform)
*Recommended for technical interviews, high-traffic production, and demonstration of Staff-level Cloud IaC.*

Full step-by-step instructions with diagrams are located in [`docs/deployment-runbook.md`](./docs/deployment-runbook.md).

### Quick Summary:
```bash
# 1. Build and push production image to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
docker build --platform linux/amd64 -t ticket-booking-api:prod .
docker tag ticket-booking-api:prod <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/ticket-booking-api:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/ticket-booking-api:latest

# 2. Provision AWS VPC, RDS, ElastiCache, ALB, and ECS Fargate with Terraform
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Update db_password and container_image in terraform.tfvars
terraform init
terraform apply -auto-approve

# 3. Connect Vercel to your Application Load Balancer DNS output
NEXT_PUBLIC_API_URL=http://<ALB_DNS_NAME>
```

---

## 🖥️ Option 3: Single VPS Deployment (Docker Compose on EC2 / DigitalOcean)
*Recommended for a self-hosted $5/mo VM on any Linux provider.*

1. **SSH into your Ubuntu VM:**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   ```
2. **Clone & Boot Production Containers:**
   ```bash
   git clone <your-repo-url>
   cd "Distributed Flash Sale Engine"
   cp .env.example .env
   docker compose -f docker-compose.prod.yml up -d --build
   ```
3. **Build & Start Frontend:**
   ```bash
   cd frontend
   npm ci
   npm run build
   npx pm2 start npm --name "frontend" -- start -- -p 3001
   ```

---

## 🩺 Verification & Health Checks
Once deployed, verify that both engines are reporting healthy:

```bash
# 1. Ping the dual-engine health check
curl -i https://<YOUR_API_URL>/health

# Expected HTTP 200 response:
# {
#   "status": "ok",
#   "services": {
#     "postgres": "up",
#     "redis": "up"
#   }
# }

# 2. Test cache pre-warming
curl -i -X POST https://<YOUR_API_URL>/events/<EVENT_ID>/prewarm
```
