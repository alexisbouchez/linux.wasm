#!/bin/bash
# Build dmenu (dynamic menu) for WASM

set -e

DMENU_VERSION="5.2"
DMENU_DIR="dmenu-${DMENU_VERSION}"
BUILD_DIR="$(dirname "$0")"
cd "$BUILD_DIR"

echo "Building dmenu ${DMENU_VERSION} for WASM..."

# Download dmenu if not present
if [ ! -d "$DMENU_DIR" ]; then
    echo "Downloading dmenu ${DMENU_VERSION}..."
    wget -q "https://dl.suckless.org/tools/dmenu-${DMENU_VERSION}.tar.gz" || {
        echo "Failed to download dmenu. Trying alternative source..."
        curl -L "https://dl.suckless.org/tools/dmenu-${DMENU_VERSION}.tar.gz" -o "dmenu-${DMENU_VERSION}.tar.gz" || exit 1
    }
    tar -xzf "dmenu-${DMENU_VERSION}.tar.gz"
    rm "dmenu-${DMENU_VERSION}.tar.gz"
fi

cd "$DMENU_DIR"

# Source Emscripten
if [ -z "$EMSDK" ]; then
    if [ -f "../../../emsdk/emsdk_env.sh" ]; then
        . ../../../emsdk/emsdk_env.sh >/dev/null 2>&1
    else
        echo "Error: Emscripten not found. Please set up EMSDK."
        exit 1
    fi
fi

# Compile X11 stubs
echo "Compiling X11 stubs..."
if [ -f "../include/X11/x11_stubs.c" ]; then
    emcc -c -I../include -o x11_stubs.o ../include/X11/x11_stubs.c 2>&1 || {
        echo "Warning: Could not compile X11 stubs"
    }
else
    echo "Warning: x11_stubs.c not found"
fi

# Modify config.mk for WASM
sed -i 's|^CC =|CC = emcc|' config.mk
sed -i 's|^LD =|LD = emcc|' config.mk
sed -i 's|^AR =|AR = emar|' config.mk
sed -i 's|^STRIP =|STRIP = llvm-strip|' config.mk
sed -i 's|^LIBS =|LIBS = |' config.mk
sed -i 's|-lX11||g' config.mk
sed -i 's|-lXinerama||g' config.mk

# Add include path
sed -i "s|^INCS =|INCS = -I../include |" config.mk

# Build
echo "Compiling dmenu..."
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make clean 2>/dev/null || true
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make -j$(nproc) 2>&1 | tee build.log

# Manual link if needed
if [ ! -f "dmenu" ] && [ ! -f "dmenu.wasm" ]; then
    if [ -f "x11_stubs.o" ]; then
        echo "Build failed, manually linking with x11_stubs.o..."
        WASM_LD=$(which wasm-ld 2>/dev/null || echo "$(dirname $(which emcc))/wasm-ld")
        if "$WASM_LD" dmenu.o x11_stubs.o \
            -o dmenu.wasm \
            --no-entry \
            --export-all \
            --allow-undefined \
            2>&1 | tee -a build.log; then
            echo "✓ dmenu.wasm created successfully!"
            mkdir -p ../packages
            cp dmenu.wasm ../packages/dmenu.wasm 2>/dev/null || mv dmenu.wasm ../packages/dmenu.wasm
        fi
    fi
fi

# Check if build succeeded
if [ -f "dmenu" ] || [ -f "dmenu.wasm" ]; then
    echo "✓ dmenu compiled successfully!"
    mkdir -p ../packages
    cp dmenu dmenu.wasm ../packages/ 2>/dev/null || cp dmenu ../packages/dmenu.wasm
    echo "✓ Copied to ../packages/dmenu.wasm"
else
    echo "❌ dmenu compilation failed. Check build.log"
    exit 1
fi
