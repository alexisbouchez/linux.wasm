#!/bin/bash
# Build st (simple terminal) for WASM

set -e

ST_VERSION="0.9"
ST_DIR="st-${ST_VERSION}"
BUILD_DIR="$(dirname "$0")"
cd "$BUILD_DIR"

echo "Building st ${ST_VERSION} for WASM..."

# Download st if not present
if [ ! -d "$ST_DIR" ]; then
    echo "Downloading st ${ST_VERSION}..."
    wget -q "https://dl.suckless.org/st/st-${ST_VERSION}.tar.gz" || {
        echo "Failed to download st. Trying alternative source..."
        curl -L "https://dl.suckless.org/st/st-${ST_VERSION}.tar.gz" -o "st-${ST_VERSION}.tar.gz" || exit 1
    }
    tar -xzf "st-${ST_VERSION}.tar.gz"
    rm "st-${ST_VERSION}.tar.gz"
fi

cd "$ST_DIR"

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
sed -i 's|-lXft||g' config.mk
sed -i 's|-lfontconfig||g' config.mk

# Add include path
sed -i "s|^INCS =|INCS = -I../include |" config.mk

# Patch st.c to remove Xft dependencies (similar to dwm)
if [ -f "st.c" ]; then
    python3 << 'PYEOF'
import re
with open('st.c', 'r') as f:
    content = f.read()

# Comment out Xft includes
content = re.sub(r'#include\s+<X11/Xft/Xft\.h>', r'// #include <X11/Xft/Xft.h>', content)
content = re.sub(r'#include\s+<fontconfig/fontconfig\.h>', r'// #include <fontconfig/fontconfig.h>', content)

# Replace Xft calls with stubs
content = re.sub(r'XftFont\s+\*', r'void *', content)
content = re.sub(r'XftDraw\s+\*', r'void *', content)

with open('st.c', 'w') as f:
    f.write(content)
PYEOF
fi

# Build
echo "Compiling st..."
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make clean 2>/dev/null || true
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make -j$(nproc) 2>&1 | tee build.log

# Manual link if needed
if [ ! -f "st" ] && [ ! -f "st.wasm" ]; then
    if [ -f "x11_stubs.o" ]; then
        echo "Build failed, manually linking with x11_stubs.o..."
        WASM_LD=$(which wasm-ld 2>/dev/null || echo "$(dirname $(which emcc))/wasm-ld")
        if "$WASM_LD" st.o x11_stubs.o \
            -o st.wasm \
            --no-entry \
            --export-all \
            --allow-undefined \
            2>&1 | tee -a build.log; then
            echo "✓ st.wasm created successfully!"
            mkdir -p ../packages
            cp st.wasm ../packages/st.wasm 2>/dev/null || mv st.wasm ../packages/st.wasm
        fi
    fi
fi

# Check if build succeeded
if [ -f "st" ] || [ -f "st.wasm" ]; then
    echo "✓ st compiled successfully!"
    mkdir -p ../packages
    cp st st.wasm ../packages/ 2>/dev/null || cp st ../packages/st.wasm
    echo "✓ Copied to ../packages/st.wasm"
else
    echo "❌ st compilation failed. Check build.log"
    exit 1
fi
