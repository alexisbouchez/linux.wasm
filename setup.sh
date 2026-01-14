#!/bin/bash
set -e

echo "Linux WASM - Setup Script"
echo "========================"
echo ""

# Check Emscripten
if [ ! -d "emsdk" ]; then
    echo "Error: emsdk not found"
    exit 1
fi

# Setup Emscripten
echo "[1/4] Setting up Emscripten..."
source emsdk/emsdk_env.sh >/dev/null 2>&1
echo "✓ Emscripten ready"

# Build X11 apps
echo "[2/4] Building X11 applications..."
cd x11/apps
if [ ! -f "packages/dwm.wasm" ]; then
    ./build_dwm.sh
fi
cd ../..
echo "✓ X11 apps built"

# Setup webapp
echo "[3/4] Setting up webapp..."
cd webapp
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..
echo "✓ Webapp ready"

# Copy dwm.wasm to webapp
echo "[4/4] Copying assets..."
mkdir -p webapp/public
cp x11/apps/packages/dwm.wasm webapp/public/ 2>/dev/null || true
echo "✓ Assets copied"

echo ""
echo "Setup complete!"
echo ""
echo "To run:"
echo "  cd webapp && npm run dev"
echo ""
echo "Then open http://localhost:3000"
