#!/bin/bash
# Build XFCE desktop environment for WASM
# This is a complex build requiring many dependencies

set -e

BUILD_DIR="$(dirname "$0")"
cd "$BUILD_DIR"

echo "Building XFCE for WASM..."
echo "This will compile:"
echo "  - GLib, GTK+ (dependencies)"
echo "  - XFCE core libraries"
echo "  - xfwm4 (window manager)"
echo "  - xfce4-panel"
echo ""

# Source Emscripten
if [ -z "$EMSDK" ]; then
    if [ -f "../../../emsdk/emsdk_env.sh" ]; then
        . ../../../emsdk/emsdk_env.sh >/dev/null 2>&1
    else
        echo "Error: Emscripten not found"
        exit 1
    fi
fi

# Create build directory
mkdir -p xfce
cd xfce

# Download and build dependencies in order
DEPS=(
    "glib-2.78.0"
    "atk-2.48.4"
    "pango-1.52.2"
    "gdk-pixbuf-2.42.10"
    "gtk+-3.24.41"
)

for dep in "${DEPS[@]}"; do
    name=$(echo $dep | cut -d'-' -f1)
    version=$(echo $dep | cut -d'-' -f2-)
    
    echo "Building $name $version..."
    
    if [ ! -d "$dep" ]; then
        echo "  Downloading..."
        wget -q "https://download.gnome.org/sources/$name/$version/$dep.tar.xz" || {
            echo "  Failed to download $dep"
            continue
        }
        tar -xf "$dep.tar.xz"
        rm "$dep.tar.xz"
    fi
    
    cd "$dep"
    
    # Configure for WASM
    emconfigure ./configure \
        --prefix=$(pwd)/../install \
        --host=wasm32-unknown-emscripten \
        --disable-shared \
        --enable-static \
        --disable-gtk-doc \
        --disable-introspection \
        2>&1 | tee ../${name}_configure.log || {
        echo "  Configure failed for $name"
        cd ..
        continue
    }
    
    # Build
    emmake make -j$(nproc) 2>&1 | tee ../${name}_build.log || {
        echo "  Build failed for $name"
        cd ..
        continue
    }
    
    emmake make install 2>&1 | tee ../${name}_install.log
    
    cd ..
    echo "  ✓ $name built"
done

echo ""
echo "Dependencies built. Next: XFCE core libraries..."
echo "This is a work in progress."
