# Unspool render worker. Build from the repository root (the worker bundles src/lib/video):
#   docker build -f worker/Dockerfile -t unspool-render .
#   docker run -p 8080:8080 -e RENDER_SECRET=... unspool-render
# Serves /render (ffmpeg slideshow renders) and /record (exact-copy reel downloads, headless Chromium).

FROM node:22-bookworm-slim AS build
WORKDIR /app/worker
COPY worker/package.json ./
RUN npm install --no-audit --no-fund
COPY src/lib/video /app/src/lib/video
COPY worker/server.ts worker/record.ts ./
RUN npm run build

# Playwright's image: Node, Chromium and its system libraries, pinned to the playwright version in package.json.
FROM mcr.microsoft.com/playwright:v1.56.1-noble
# ffmpeg with libass/libfreetype/fontconfig (captions), libx264 and AAC.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY worker/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/worker/dist/server.cjs ./server.cjs
COPY assets/fonts ./assets/fonts
ENV NODE_ENV=production \
    PORT=8080 \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    VIDEO_FONTS_DIR=/app/assets/fonts \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
EXPOSE 8080
USER pwuser
CMD ["node", "server.cjs"]
