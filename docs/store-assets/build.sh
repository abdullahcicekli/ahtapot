#!/usr/bin/env bash
# Chrome Web Store görsellerini headless Chrome ile PNG'ye basar.
# 2x render edip hedef boyuta indiriyoruz — metin kenarları belirgin çıksın diye.
# Kullanım: ./build.sh  →  out/*.png
set -euo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p out

shot() { # file.html W H out.png
  local src="$1" w="$2" h="$3" name="$4"
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 \
    --window-size="$w,$h" \
    --screenshot="out/$name" \
    "file://$PWD/$src" 2>/dev/null
  # 2x -> 1x süper örnekleme
  sips --resampleHeightWidth "$h" "$w" "out/$name" >/dev/null
  echo "out/$name  (${w}x${h})"
}

shot s1-hero.html      1280 800 screenshot-1-hero.png
shot s2-providers.html 1280 800 screenshot-2-providers.png
shot s3-ai.html        1280 800 screenshot-3-ai.png
shot s4-detection.html 1280 800 screenshot-4-detection.png
shot s5-settings.html  1280 800 screenshot-5-settings.png
shot tile-small.html   440  280 promo-small-440x280.png
shot tile-marquee.html 1400 560 promo-marquee-1400x560.png
