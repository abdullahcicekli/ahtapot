#!/usr/bin/env bash
# Chrome Web Store görsellerini headless Chrome ile PNG'ye basar.
# Kullanım: ./build.sh  →  out/*.png
set -euo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p out

shot() { # file.html WxH out.png
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 \
    --window-size="$2" \
    --screenshot="out/$3" \
    "file://$PWD/$1" 2>/dev/null
  echo "out/$3"
}

shot s1-hero.html      1280,800 screenshot-1-hero.png
shot s2-providers.html 1280,800 screenshot-2-providers.png
shot s3-ai.html        1280,800 screenshot-3-ai.png
shot s4-detection.html 1280,800 screenshot-4-detection.png
shot s5-settings.html  1280,800 screenshot-5-settings.png
shot tile-small.html   440,280  promo-small-440x280.png
shot tile-marquee.html 1400,560 promo-marquee-1400x560.png
