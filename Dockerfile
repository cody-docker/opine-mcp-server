# Multi-stage build using the developer variant of the hardened image for building
FROM demonstrationorg/dhi-node:24.7-alpine3.22-dev AS builder

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Use the hardened Node.js runtime for the final image
FROM demonstrationorg/dhi-node:24.7-alpine3.22

# Set the working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "build/index.js"]