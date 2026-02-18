# ---------------------- BUILD STAGE ----------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build Vite app → dist/
RUN npm run build


# ---------------------- RUNTIME STAGE ----------------------
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy env template manually
COPY env.template.js /usr/share/nginx/html/env.template.js

# Copy entrypoint for runtime env injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint + CMD
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
