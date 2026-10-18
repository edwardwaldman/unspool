# Unspool render worker. Build from the repository root (the worker bundles src/lib/video):
#   docker build -f worker/Dockerfile -t unspool-render .
#   docker run -p 8080:8080 -e RENDER_SECRET=... unspool-render

FROM node:22-bookworm-slim AS build
WORKDIR /app/worker
COPY worker/package.json ./
RUN npm install --no-audit --no-fund
COPY src/lib/video /app/src/lib/video
COPY worker/server.ts ./
RUN npm run build

FROM node:22-bookworm-slim
# Debian's ffmpeg is built with libass/libfreetype/fontconfig (captions), libx264 and AAC.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/worker/dist/server.cjs ./server.cjs
COPY assets/fonts ./assets/fonts
ENV NODE_ENV=production \
    PORT=8080 \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    VIDEO_FONTS_DIR=/app/assets/fonts
EXPOSE 8080
USER node
CMD ["node", "server.cjs"]
