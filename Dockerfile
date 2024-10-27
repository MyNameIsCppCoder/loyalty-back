# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Install Prisma CLI globally
RUN npm install -g prisma

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Copy node_modules and dist from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Start the application
CMD ["sh", "-c", "npx prisma migrate dev && npx prisma migrate deploy && node dist/src/main.js"]
