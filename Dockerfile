FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-fund

FROM dependencies AS build
WORKDIR /app
COPY . .
# Build-time placeholder only. Production receives its own secret at runtime.
RUN PAYLOAD_SECRET=build-only-placeholder-32-characters-long npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
# Retain CLI dependencies and source so migrations run in the same image.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/next.config.mjs /app/tsconfig.json ./
RUN mkdir -p /data/media && chown -R node:node /data /app
USER node
EXPOSE 3000
CMD ["npm", "start"]
