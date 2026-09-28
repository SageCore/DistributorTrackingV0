# Stage 1: Build React Production Assets
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build Vite production bundle
COPY . .
RUN npm run build

# Stage 2: Serve Production Assets via Nginx Reverse Proxy
FROM nginx:alpine AS production-stage

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
