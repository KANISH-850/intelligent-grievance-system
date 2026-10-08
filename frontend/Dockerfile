# Multi-stage Dockerfile for React + Vite Frontend

# Stage 1: Build static distribution
FROM node:20-alpine AS builder

WORKDIR /app

# Arguments for Vite environment variables at build time
ARG VITE_API_BASE_URL=http://localhost:5000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Nginx Web Server for Production Serving
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
