FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/tests ./tests
COPY backend/openapi.json ./
RUN npm run build && NODE_ENV=test DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=nexou_test DB_USER=test DB_PASSWORD=test-build-only npm test && npm prune --omit=dev
FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
