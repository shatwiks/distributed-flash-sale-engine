# ==============================================================================
# Stage 1: Dependencies Builder
# Installs production dependencies with strict lockfile parity and prunes dev tools
# ==============================================================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build dependencies if needed (e.g. python/make for native addons)
RUN apk add --no-cache libc6-compat

# Copy package descriptors
COPY package.json package-lock.json ./

# Clean install of all dependencies followed by production-only prune
RUN npm ci && npm prune --omit=dev

# ==============================================================================
# Stage 2: Lean Production Runner
# Minimal runtime environment tailored for AWS ECS Fargate & ALB deployment
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment flags
ENV NODE_ENV=production \
    PORT=3000

# Install runtime dependencies required for health checks & container operation
RUN apk add --no-cache tzdata

# Create application directory with non-root user permissions
RUN mkdir -p /app && chown -R node:node /app

# Copy production node_modules from dependencies stage
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules

# Copy application source code and runtime descriptors
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node docker-entrypoint.sh ./

# Ensure entrypoint script is executable
RUN chmod +x /app/docker-entrypoint.sh

# Drop root privileges: execute container as unprivileged 'node' user (UID 1000)
USER node

# Expose HTTP traffic port
EXPOSE 3000

# Container Healthcheck using Node 20's native fetch API (zero external curl/wget dependencies)
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Entrypoint automatically executes database migrations before starting the web process
ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]

# Default server command
CMD ["node", "src/index.js"]
