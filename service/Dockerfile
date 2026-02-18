FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Use JSON array format for CMD
CMD ["npm", "run", "start"]