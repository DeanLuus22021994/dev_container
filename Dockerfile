# Build stage
FROM node:slim AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies with cache optimization
COPY package.json package-lock.json* ./

# Install dependencies with clean cache management
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy application code
COPY src ./src

# Optionally build the app if there's a build step needed
RUN npm run build --if-present

# Production stage
FROM node:slim AS production

# Set up proper environment
ENV NODE_ENV=production
ENV PORT=3000

# Create app directory (for security to avoid container escape exploits)
WORKDIR /app

# Create a non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Copy only production artifacts from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist

# Copy additional required files
COPY package.json ./

# Security hardening
RUN npm i npm@latest -g && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/lib/apt/lists/* /var/tmp/*

# Add security scanning during build (optional)
# RUN npm audit --production

# Expose the port
EXPOSE 3000

# Set user to non-root
USER nodejs

# Start the application
CMD ["node", "src/index.js"]