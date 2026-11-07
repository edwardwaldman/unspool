#!/usr/bin/env bash
# Encode an ad: frames + mix.wav -> brand/social/full-frame/unspool-ad-<name>.mp4 (full frame) and
# brand/social/unspool-ad-<name>.mp4 (zoomed to 86% over a blurred copy, inside the TikTok/Reels safe zone, rule 3).
#   bash brand/ads/tools/encode.sh <dir> <name>
set -euo pipefail
dir=$1; name=$2; root=$(cd "$(dirname "$0")/../../.." && pwd)
SAFE="[0:v]split[a][b];[a]scale=90:160,boxblur=6:2,scale=720:1280,eq=brightness=-0.13:saturation=0.85[bg];[b]scale=618:1100[fg];[bg][fg]overlay=51:58,format=yuv420p"
mkdir -p "$root/brand/social/full-frame"
ffmpeg -v error -y -framerate 30 -i "$dir/frames/f%05d.jpg" -i "$dir/mix.wav" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$root/brand/social/full-frame/unspool-ad-$name.mp4"
ffmpeg -v error -y -i "$root/brand/social/full-frame/unspool-ad-$name.mp4" -filter_complex "$SAFE" -c:v libx264 -preset medium -crf 19 -c:a copy -movflags +faststart "$root/brand/social/unspool-ad-$name.mp4"
echo "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$root/brand/social/unspool-ad-$name.mp4")s  brand/social/unspool-ad-$name.mp4"
