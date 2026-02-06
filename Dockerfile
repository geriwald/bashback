# Stage 1: Build client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine
WORKDIR /app

# Install jq for the hook help parsing (exec commands use --help)
RUN apk add --no-cache jq git coreutils

# Copy server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy built artifacts
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./client/dist

# Copy hook script (for reference/install endpoint)
COPY hook/ ./hook/

# Ensure log file exists
RUN touch /tmp/bashback.log

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
