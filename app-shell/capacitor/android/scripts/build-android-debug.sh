#!/usr/bin/env bash
set -e
npm install
npm run android:add || true
npm run android:sync
npm run android:open
