FROM node:20-alpine

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --omit=dev

COPY server ./
COPY web ../web

ENV NODE_ENV=production
ENV PORT=7777
ENV HOST=0.0.0.0

EXPOSE 7777

CMD ["node", "server.js"]
