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

# Setup Emscripten - use . instead of source for compatibility
echo "[1/4] Setting up Emscripten..."
if [ -f "emsdk/emsdk_env.sh" ]; then
    . emsdk/emsdk_env.sh >/dev/null 2>&1 || true
    export PATH="$PATH:$(pwd)/emsdk:$(pwd)/emsdk/upstream/emscripten"
    echo "✓ Emscripten ready"
else
    echo "Warning: emsdk_env.sh not found, continuing..."
fi

# Build X11 apps
echo "[2/4] Building X11 applications..."
cd x11/apps
if [ ! -f "packages/dwm.wasm" ]; then
    if [ -f "build_dwm.sh" ]; then
        ./build_dwm.sh || echo "Warning: dwm build failed, continuing..."
    else
        echo "Warning: build_dwm.sh not found, skipping..."
    fi
else
    echo "✓ dwm.wasm already exists"
fi
cd ../..

# Setup webapp
echo "[3/4] Setting up webapp..."
cd webapp
if [ ! -d "node_modules" ]; then
    npm install || {
        echo "Error: npm install failed"
        exit 1
    }
else
    echo "✓ node_modules already exists"
fi
cd ..

# Copy dwm.wasm to webapp
echo "[4/4] Copying assets..."
mkdir -p webapp/public
if [ -f "x11/apps/packages/dwm.wasm" ]; then
    cp x11/apps/packages/dwm.wasm webapp/public/ 2>/dev/null || true
    echo "✓ dwm.wasm copied"
else
    echo "Warning: dwm.wasm not found"
fi

# Ensure X11 server exists
mkdir -p webapp/public/server
if [ ! -f "webapp/public/server/x11_server.js" ]; then
    echo "Warning: x11_server.js not found"
fi

echo ""
echo "Setup complete!"
echo ""
echo "To run:"
echo "  cd webapp && npm run dev"
echo ""
echo "Then open http://localhost:3000"
