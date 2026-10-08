# Production Dockerfile for Node.js Backend API
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy Prisma schema & generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source code
COPY src ./src

# Expose backend port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start Express server
CMD ["node", "src/server.js"]
