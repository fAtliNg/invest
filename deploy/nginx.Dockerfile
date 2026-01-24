# Build Stage
# Use Node 20 (LTS) to avoid npm deprecation warnings and match backend environment
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build args
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_IS_DEV
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_IS_DEV=$NEXT_PUBLIC_IS_DEV

# Increase memory limit for node
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build and Export
RUN npm run build && npm run export

# Production Stage (Nginx)
FROM nginx:alpine

# Copy static assets from builder stage
COPY --from=builder /app/out /usr/share/nginx/html

# Copy Nginx config
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
