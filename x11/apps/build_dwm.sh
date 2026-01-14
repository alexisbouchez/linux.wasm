#!/bin/bash
# Build dwm (Dynamic Window Manager) for WASM

set -e

DWM_VERSION="6.4"
DWM_DIR="dwm-${DWM_VERSION}"
BUILD_DIR="$(dirname "$0")"
cd "$BUILD_DIR"

echo "Building dwm ${DWM_VERSION} for WASM..."

# Download dwm if not present
if [ ! -d "$DWM_DIR" ]; then
    echo "Downloading dwm ${DWM_VERSION}..."
    wget -q "https://dl.suckless.org/dwm/dwm-${DWM_VERSION}.tar.gz" || {
        echo "Failed to download dwm. Trying alternative source..."
        curl -L "https://dl.suckless.org/dwm/dwm-${DWM_VERSION}.tar.gz" -o "dwm-${DWM_VERSION}.tar.gz" || exit 1
    }
    tar -xzf "dwm-${DWM_VERSION}.tar.gz"
    rm "dwm-${DWM_VERSION}.tar.gz"
fi

cd "$DWM_DIR"

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
/* dwm config for WASM */
#define MODKEY Mod1Mask
#define TAGKEYS(KEY,TAG) \
	{ MODKEY,                       KEY,      view,           {.ui = 1 << TAG} }, \
	{ MODKEY|ControlMask,           KEY,      toggleview,     {.ui = 1 << TAG} }, \
	{ MODKEY|ShiftMask,             KEY,      tag,            {.ui = 1 << TAG} }, \
	{ MODKEY|ControlMask|ShiftMask, KEY,      toggletag,      {.ui = 1 << TAG} },

static const char *fonts[]          = { "monospace:size=10" };
static const char dmenufont[]       = "monospace:size=10";
static const char *colors[][3]      = {
	/*               fg         bg         border   */
	[SchemeNorm] = { "#bbbbbb", "#222222", "#222222" },
	[SchemeSel]  = { "#eeeeee", "#005577", "#005577" },
};

static const unsigned int borderpx  = 1;
static const unsigned int snap      = 32;
static const unsigned int systraypinning = 0;
static const unsigned int systrayspacing = 2;
static const unsigned int systraypinningfailfirst = 1;
static const int showbar            = 1;
static const int topbar             = 1;
static const char *tags[]           = { "1", "2", "3", "4", "5", "6", "7", "8", "9" };
static const int nmaster            = 1;
static const int resizehints         = 1;
static const int lockfullscreen     = 1;

static const Layout layouts[] = {
	{ "[]=",      tile },
	{ "><>",      NULL },
	{ "[M]",      monocle },
};

static const Key keys[] = {
	{ MODKEY,                       XK_p,      spawn,          {.v = dmenucmd } },
	{ MODKEY|ShiftMask,             XK_Return, spawn,          {.v = termcmd } },
	{ MODKEY,                       XK_b,      togglebar,      {0} },
	{ MODKEY,                       XK_j,      focusstack,     {.i = +1 } },
	{ MODKEY,                       XK_k,      focusstack,     {.i = -1 } },
	{ MODKEY,                       XK_i,      incnmaster,     {.i = +1 } },
	{ MODKEY,                       XK_d,      incnmaster,     {.i = -1 } },
	{ MODKEY,                       XK_h,      setmfact,       {.f = -0.05} },
	{ MODKEY,                       XK_l,      setmfact,       {.f = +0.05} },
	{ MODKEY,                       XK_Return, zoom,           {0} },
	{ MODKEY,                       XK_Tab,    view,           {0} },
	{ MODKEY|ShiftMask,             XK_c,      killclient,     {0} },
	{ MODKEY,                       XK_t,      setlayout,      {.v = &layouts[0]} },
	{ MODKEY,                       XK_f,      setlayout,      {.v = &layouts[2]} },
	{ MODKEY,                       XK_m,      setlayout,      {.v = &layouts[1]} },
	{ MODKEY,                       XK_space,  setlayout,      {0} },
	{ MODKEY|ShiftMask,             XK_space,  togglefloating, {0} },
	{ MODKEY,                       XK_0,      view,           {.ui = ~0 } },
	{ MODKEY|ShiftMask,             XK_0,      tag,            {.ui = ~0 } },
	{ MODKEY,                       XK_comma,  focusmon,       {.i = -1 } },
	{ MODKEY,                       XK_period, focusmon,       {.i = +1 } },
	{ MODKEY|ShiftMask,             XK_comma,  tagmon,         {.i = -1 } },
	{ MODKEY|ShiftMask,             XK_period, tagmon,         {.i = +1 } },
	TAGKEYS(                        XK_1,                      0)
	TAGKEYS(                        XK_2,                      1)
	TAGKEYS(                        XK_3,                      2)
	TAGKEYS(                        XK_4,                      3)
	TAGKEYS(                        XK_5,                      4)
	TAGKEYS(                        XK_6,                      5)
	TAGKEYS(                        XK_7,                      6)
	TAGKEYS(                        XK_8,                      7)
	TAGKEYS(                        XK_9,                      8)
	{ MODKEY|ShiftMask,             XK_q,      quit,           {0} },
};

static const char *termcmd[]  = { "st", NULL };
static const char *dmenucmd[] = { "dmenu_run", NULL };
EOF

# Modify Makefile for WASM
sed -i 's/^CC =.*/CC = emcc/' config.mk 2>/dev/null || echo "CC = emcc" >> config.mk
sed -i 's/^LD =.*/LD = emcc/' config.mk 2>/dev/null || echo "LD = emcc" >> config.mk

# Fix LIBS variable to avoid recursion
sed -i 's/^LIBS =.*/LIBS =/' config.mk
sed -i 's/\$(LIBS)/$(LIBS)/g' config.mk || true

# Remove X11 libraries
sed -i 's/-lX11//g' config.mk
sed -i 's/-lXinerama//g' config.mk
sed -i 's/-lXft//g' config.mk
sed -i 's/-lfontconfig//g' config.mk
sed -i 's/-lfreetype//g' config.mk

# Add stub header include path
sed -i "s|-I/usr/X11R6/include|-I../include|g" config.mk
sed -i "s|-I/usr/include/freetype2||g" config.mk

# Disable Xinerama and Xft features for WASM
sed -i 's/-DXINERAMA//g' config.mk
sed -i 's/XINERAMA//g' config.mk

# Comment out Xft includes in source
sed -i 's/#include <X11\/Xft\/Xft.h>/\/\/ #include <X11\/Xft\/Xft.h> \/\/ Disabled for WASM/g' drw.c 2>/dev/null || true
sed -i 's/#include <X11\/extensions\/Xinerama.h>/\/\/ #include <X11\/extensions\/Xinerama.h> \/\/ Disabled for WASM/g' dwm.c 2>/dev/null || true

# Add WASM flags to LDFLAGS
sed -i 's|^LDFLAGS =|LDFLAGS = -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS='\''["_main"]'\'' --no-entry |' config.mk || echo "LDFLAGS += -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS='[\"_main\"]' --no-entry" >> config.mk

# Build
echo "Compiling dwm..."
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make clean 2>/dev/null || true
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make -j$(nproc) 2>&1 | tee build.log

# Check if build succeeded
if [ -f "dwm" ] || [ -f "dwm.wasm" ]; then
    echo "✅ dwm compiled successfully!"
    mkdir -p ../packages
    cp dwm dwm.wasm ../packages/ 2>/dev/null || cp dwm ../packages/dwm.wasm
    echo "✅ Copied to ../packages/dwm.wasm"
else
    echo "❌ dwm compilation failed. Check build.log"
    exit 1
fi
