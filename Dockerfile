FROM node:20-alpine

WORKDIR /app/server

RUN apk add --no-cache su-exec

COPY server/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY server ./
COPY web ../web
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /data && chown -R node:node /data /app && chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=7777
ENV HOST=0.0.0.0
ENV DATA_DIR=/data

EXPOSE 7777

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["node", "server.js"]
