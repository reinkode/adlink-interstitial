# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source files
COPY . .

# Build the frontend
RUN yarn build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production

# Copy built frontend and server from builder
COPY --from=builder /app/dist ./dist
COPY server.ts ./
COPY public ./public
COPY tsconfig.json ./

# Expose port
EXPOSE 3000

# Run the server
CMD ["yarn", "start"]
