FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -g 1001 -S dsip && adduser -S dsip -u 1001 -G dsip

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy app source
COPY server.js ./
COPY server/ ./server/
COPY public/ ./public/

# Create data and upload dirs owned by app user
RUN mkdir -p data uploads data/sessions && chown -R dsip:dsip /app

# Security hardening
RUN apk --no-cache add dumb-init && \
    rm -rf /tmp/* /var/cache/apk/*

# Switch to non-root user
USER dsip

# Expose port (will be mapped in docker-compose)
EXPOSE 1978

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1978/ || exit 1

# Use dumb-init to handle signals properly (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
