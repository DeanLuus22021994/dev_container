# Implement multi-stage builds for optimization

# Stage 1: Build dependencies
FROM node:slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Final image
FROM node:slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Optimize package installation to reduce layers
RUN npm prune --production

# Expose ports
EXPOSE 3000 11434

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "start"]