#!/usr/bin/env bash
set -e

echo "SAND iOS TestFlight preparation"
echo "=============================="

npm install
npm run ios:doctor

if [ ! -d "ios" ]; then
  echo "Adding iOS platform..."
  npm run ios:add
fi

npm run ios:sync
npm run ios:open

echo ""
echo "Xcode opened. Complete signing, run on iPhone, then Product → Archive → Distribute App."
