# Multi-stage build using the developer variant of the hardened image for building
FROM dhi.io/node:25-alpine3.23-dev AS builder

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

# Production dependencies stage - installs ONLY updated production dependencies
FROM dhi.io/node:25-alpine3.23-dev AS prod-deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Update vulnerable packages before installing
RUN npm install @modelcontextprotocol/sdk@^1.25.2 qs@^6.14.1 --save && \
    npm ci --only=production

# Use the hardened Node.js runtime for the final image
FROM dhi.io/node:25-alpine3.23

# Set the working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy ONLY the updated production dependencies from prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "build/index.js"]