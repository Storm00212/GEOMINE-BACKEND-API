FROM node:20-alpine

WORKDIR /usr/src/app

# Install dumb-init to handle proper signal forwarding
RUN apk add --no-cache dumb-init

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy configuration and source files
COPY tsconfig.json .eslintrc.json .prettierrc ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client (DATABASE_URL must be set at runtime or build time)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove development dependencies from the build
RUN npm ci --only=production

# Set environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
