# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend ./

# Build the application
RUN npm run build

# Production stage - Serve with a lightweight HTTP server
FROM node:20-alpine

WORKDIR /app

# Install serve to run the production build
RUN npm install -g serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set environment variable for serve
ENV SERVE_SINGLE_PAGE_APPLICATION=true

# Run the app
CMD ["serve", "-s", "dist", "-l", "3000"]
