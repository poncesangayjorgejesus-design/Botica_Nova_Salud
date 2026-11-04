FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
COPY client ./client
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production PORT=3000 NOVA_HOST=0.0.0.0
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY server ./server
COPY scripts ./scripts
COPY data ./data
RUN chown -R node:node /app/data
COPY package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "server/index.js"]