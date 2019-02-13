#!/usr/bin/env bash -l

cd "$(dirname "$0")"

rm static/*/bundle.js

for js in static/*/browser.js; do
  echo $js
  # browserify "$js" | uglifyjs > "${js/browser.js/}/bundle.js"
  browserify "$js" > "${js/browser.js/}/bundle.js"
done
