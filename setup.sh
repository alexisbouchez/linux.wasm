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
echo "[1/5] Setting up Emscripten..."
if [ -f "emsdk/emsdk_env.sh" ]; then
    . emsdk/emsdk_env.sh >/dev/null 2>&1 || true
    export PATH="$PATH:$(pwd)/emsdk:$(pwd)/emsdk/upstream/emscripten"
    echo "✓ Emscripten ready"
else
    echo "Warning: emsdk_env.sh not found, continuing..."
fi

# Build X11 apps
echo "[2/5] Building X11 applications..."
cd x11/apps

# Build dwm
if [ ! -f "packages/dwm.wasm" ]; then
    if [ -f "build_dwm.sh" ]; then
        echo "  Building dwm..."
        ./build_dwm.sh || echo "  Warning: dwm build failed, continuing..."
    fi
else
    echo "  ✓ dwm.wasm already exists"
fi

# Build dmenu
if [ ! -f "packages/dmenu.wasm" ]; then
    if [ -f "build_dmenu.sh" ]; then
        echo "  Building dmenu..."
        ./build_dmenu.sh || echo "  Warning: dmenu build failed, continuing..."
    fi
else
    echo "  ✓ dmenu.wasm already exists"
fi

# Build st
if [ ! -f "packages/st.wasm" ]; then
    if [ -f "build_st.sh" ]; then
        echo "  Building st..."
        ./build_st.sh || echo "  Warning: st build failed, continuing..."
    fi
else
    echo "  ✓ st.wasm already exists"
fi

cd ../..

# Setup webapp
echo "[3/5] Setting up webapp..."
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

# Copy WASM files to webapp
echo "[4/5] Copying assets..."
mkdir -p webapp/public
if [ -f "x11/apps/packages/dwm.wasm" ]; then
    cp x11/apps/packages/dwm.wasm webapp/public/ 2>/dev/null || true
    echo "  ✓ dwm.wasm copied"
fi
if [ -f "x11/apps/packages/dmenu.wasm" ]; then
    cp x11/apps/packages/dmenu.wasm webapp/public/ 2>/dev/null || true
    echo "  ✓ dmenu.wasm copied"
fi
if [ -f "x11/apps/packages/st.wasm" ]; then
    cp x11/apps/packages/st.wasm webapp/public/ 2>/dev/null || true
    echo "  ✓ st.wasm copied"
fi

# Ensure X11 server exists
echo "[5/5] Checking X11 server..."
if [ ! -f "webapp/app/x11_server.ts" ]; then
    echo "  Warning: x11_server.ts not found"
fi

echo ""
echo "Setup complete!"
echo ""
echo "To run:"
echo "  cd webapp && npm run dev"
echo ""
echo "Then open http://localhost:3000"
