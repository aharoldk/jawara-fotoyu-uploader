# ---------------------- BUILD STAGE ----------------------
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy full project source
COPY . .

# Build TypeScript → dist/
RUN npm run build


# ---------------------- PRODUCTION STAGE ----------------------
FROM node:20

WORKDIR /app

COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy built output
COPY --from=builder /app/dist ./dist

# Expose service port
EXPOSE 3000

CMD npm run start