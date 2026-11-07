#!/usr/bin/env bash
# One-time setup for making ads: Python voice tools, the free Kokoro voice model, and Playwright for rendering.
#   bash brand/ads/tools/setup.sh
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
python3 -m venv "$here/.venv" && "$here/.venv/bin/pip" -q install kokoro-onnx soundfile numpy
mkdir -p "$here/.models"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$here/.models/$f" ] || curl -sSL -o "$here/.models/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done
command -v ffmpeg >/dev/null || echo "Install ffmpeg (apt-get install -y ffmpeg / brew install ffmpeg)"
node -e "require('playwright')" 2>/dev/null || echo "Install Playwright: npm i -g playwright && npx playwright install chromium"
echo "Ready. Voice: $here/.venv/bin/python $here/vo.py <ad dir>"
