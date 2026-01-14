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
        source ../../../emsdk/emsdk_env.sh >/dev/null 2>&1
    else
        echo "Error: Emscripten not found. Please set up EMSDK."
        exit 1
    fi
fi

# Create WASM-compatible config.h
cat > config.h << 'EOF'
/* dmenu config for WASM */
static const char *fonts[] = { "monospace:size=10" };
static const char *prompt      = NULL;
static const unsigned int barheight = 25;
static const unsigned int borderwidth = 1;
static const unsigned int snap      = 32;
static const int showbar            = 1;
static const int topbar             = 1;
static const char *colors[SchemeLast][2] = {
	[SchemeNorm] = { "#bbbbbb", "#222222" },
	[SchemeSel]  = { "#eeeeee", "#005577" },
	[SchemeOut]  = { "#000000", "#00ffff" },
};
static const unsigned int alphas[SchemeLast][2] = {
	[SchemeNorm] = { OPAQUE, OPAQUE },
	[SchemeSel]  = { OPAQUE, OPAQUE },
	[SchemeOut]  = { OPAQUE, OPAQUE },
};
static const char worddelim[] = " ";
static unsigned int lines      = 0;
static unsigned int columns    = 0;
EOF

# Modify Makefile for WASM
sed -i 's/^CC =.*/CC = emcc/' config.mk 2>/dev/null || echo "CC = emcc" >> config.mk
sed -i 's/^LD =.*/LD = emcc/' config.mk 2>/dev/null || echo "LD = emcc" >> config.mk
sed -i 's/-lX11//g' config.mk
sed -i 's/-lXinerama//g' config.mk
sed -i 's/-lXft//g' config.mk
sed -i 's/-lfontconfig//g' config.mk
sed -i 's/-lfreetype//g' config.mk

# Add WASM flags
echo "LDFLAGS += -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS='[\"_main\"]' --no-entry" >> config.mk

# Build
echo "Compiling dmenu..."
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make clean 2>/dev/null || true
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make -j$(nproc) 2>&1 | tee build.log

# Check if build succeeded
if [ -f "dmenu" ] || [ -f "dmenu.wasm" ]; then
    echo "✅ dmenu compiled successfully!"
    mkdir -p ../packages
    cp dmenu dmenu.wasm ../packages/ 2>/dev/null || cp dmenu ../packages/dmenu.wasm
    echo "✅ Copied to ../packages/dmenu.wasm"
else
    echo "❌ dmenu compilation failed. Check build.log"
    exit 1
fi
