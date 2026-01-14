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
        source ../../../emsdk/emsdk_env.sh >/dev/null 2>&1
    else
        echo "Error: Emscripten not found. Please set up EMSDK."
        exit 1
    fi
fi

# Create WASM-compatible config.h
cat > config.h << 'EOF'
/* st config for WASM */
static const char *font = "monospace:size=10:antialias=true:autohint=true";
static const char *fontalt[] = { "monospace" };
static const unsigned int borderpx = 2;
static const float bgalpha = 0.0;
static const float fgalpha = 1.0;
static const char *shell = "/bin/sh";
static const char *utmp = NULL;
static const char *scroll = NULL;
static const char *stty_args = "stty raw pass8 nl -echo -iexten -cstopb 38400";
static const unsigned int tabspaces = 8;
static const unsigned int defaultfg = 7;
static const unsigned int defaultbg = 0;
static const unsigned int defaultcs = 256;
static const unsigned int defaultrcs = 257;
static const int bellvolume = 0;
static const unsigned int defaultattr = 11;
static const MouseShortcut mshortcuts[] = {
	{ Button4, XK_ANY_MOD,       "\031" },
	{ Button5, XK_ANY_MOD,       "\005" },
};
static MouseKey mkeys[] = {
	{ Button4,       kscrollup,      {.i =  1} },
	{ Button5,       kscrolldown,    {.i =  1} },
};
static const char *worddelimiters = " ";
static unsigned int defaultcols = 80;
static unsigned int defaultrows = 24;
static const unsigned int mousefg = 7;
static const unsigned int mousebg = 0;
static const unsigned int cursorfg = 7;
static const unsigned int cursorbg = 0;
static const unsigned int cols = 80;
static const unsigned int rows = 24;
static const char *colors[][3]      = {
	[SchemeNorm] = { "#bbbbbb", "#222222", "#222222" },
	[SchemeSel]  = { "#eeeeee", "#005577", "#005577" },
};
static const unsigned int alphas[][3]      = {
	[SchemeNorm] = { OPAQUE, 0xff, OPAQUE },
	[SchemeSel]  = { OPAQUE, 0xff, OPAQUE },
};
static const Key keys[] = {
	{ XK_Return,        Mod1Mask,       "\033[13;3~",     0,  0 },
	{ XK_Return,        Mod1Mask|ShiftMask, "\033[13;5~", 0,  0 },
	{ XK_ISO_Left_Tab,  ShiftMask,      "\033[Z",        0,  0 },
	{ XK_BackSpace,     Mod1Mask,       "\033[127D",     0,  0 },
	{ XK_BackSpace,     Mod1Mask|ShiftMask, "\033[127D",  0,  0 },
	{ XK_Up,            Mod1Mask,       "\033[1;3A",     0,  0 },
	{ XK_Down,          Mod1Mask,       "\033[1;3B",     0,  0 },
	{ XK_Left,          Mod1Mask,       "\033[1;3D",     0,  0 },
	{ XK_Right,         Mod1Mask,       "\033[1;3C",     0,  0 },
	{ XK_Up,            Mod1Mask|ShiftMask, "\033[1;4A", 0,  0 },
	{ XK_Down,          Mod1Mask|ShiftMask, "\033[1;4B", 0,  0 },
	{ XK_Left,          Mod1Mask|ShiftMask, "\033[1;4D", 0,  0 },
	{ XK_Right,         Mod1Mask|ShiftMask, "\033[1;4C", 0,  0 },
	{ XK_Up,            ShiftMask,      "\033[1;2A",     0,  0 },
	{ XK_Down,          ShiftMask,      "\033[1;2B",     0,  0 },
	{ XK_Left,          ShiftMask,      "\033[1;2D",     0,  0 },
	{ XK_Right,         ShiftMask,      "\033[1;2C",     0,  0 },
	{ XK_Up,            XK_ANY_MOD,     "\033[A",        0, -1 },
	{ XK_Up,            XK_ANY_MOD,     "\033OA",        0, +1 },
	{ XK_Down,          XK_ANY_MOD,     "\033[B",        0, -1 },
	{ XK_Down,          XK_ANY_MOD,     "\033OB",        0, +1 },
	{ XK_Left,          XK_ANY_MOD,     "\033[D",        0, -1 },
	{ XK_Left,          XK_ANY_MOD,     "\033OD",        0, +1 },
	{ XK_Right,         XK_ANY_MOD,     "\033[C",        0, -1 },
	{ XK_Right,         XK_ANY_MOD,     "\033OC",        0, +1 },
	{ XK_ISO_Left_Tab,  XK_ANY_MOD,     "\033[Z",        0,  0 },
	{ XK_Return,        XK_ANY_MOD,     "\r",             0,  0 },
	{ XK_BackSpace,     XK_ANY_MOD,     "\177",           0,  0 },
	{ XK_BackSpace,     Mod1Mask,       "\033\177",       0,  0 },
	{ XK_Delete,        XK_ANY_MOD,     "\033[3~",        0,  0 },
	{ XK_Delete,        Mod1Mask,       "\033[3;3~",      0,  0 },
	{ XK_Delete,        Mod1Mask|ShiftMask, "\033[3;5~",  0,  0 },
	{ XK_Home,          ShiftMask,      "\033[1;2H",      0,  0 },
	{ XK_Home,          XK_ANY_MOD,     "\033[H",         0,  0 },
	{ XK_End,           ShiftMask,      "\033[1;2F",      0,  0 },
	{ XK_End,           XK_ANY_MOD,     "\033[F",         0,  0 },
	{ XK_Prior,         ControlMask,    "\033[5;5~",     0,  0 },
	{ XK_Prior,         ShiftMask,      "\033[5;2~",      0,  0 },
	{ XK_Prior,         XK_ANY_MOD,     "\033[5~",        0,  0 },
	{ XK_Next,          ControlMask,    "\033[6;5~",     0,  0 },
	{ XK_Next,          ShiftMask,      "\033[6;2~",      0,  0 },
	{ XK_Next,          XK_ANY_MOD,     "\033[6~",        0,  0 },
	{ XK_F1,            XK_ANY_MOD,     "\033OP" ,        0,  0 },
	{ XK_F1,            XK_ANY_MOD,     "\033[11~",       0,  0 },
	{ XK_F2,            XK_ANY_MOD,     "\033OQ" ,        0,  0 },
	{ XK_F2,            XK_ANY_MOD,     "\033[12~",       0,  0 },
	{ XK_F3,            XK_ANY_MOD,     "\033OR" ,        0,  0 },
	{ XK_F3,            XK_ANY_MOD,     "\033[13~",       0,  0 },
	{ XK_F4,            XK_ANY_MOD,     "\033OS" ,        0,  0 },
	{ XK_F4,            XK_ANY_MOD,     "\033[14~",       0,  0 },
	{ XK_F5,            XK_ANY_MOD,     "\033[15~",       0,  0 },
	{ XK_F6,            XK_ANY_MOD,     "\033[17~",       0,  0 },
	{ XK_F7,            XK_ANY_MOD,     "\033[18~",       0,  0 },
	{ XK_F8,            XK_ANY_MOD,     "\033[19~",       0,  0 },
	{ XK_F9,            XK_ANY_MOD,     "\033[20~",       0,  0 },
	{ XK_F10,           XK_ANY_MOD,     "\033[21~",       0,  0 },
	{ XK_F11,           XK_ANY_MOD,     "\033[23~",       0,  0 },
	{ XK_F12,           XK_ANY_MOD,     "\033[24~",       0,  0 },
	{ XK_F13,           XK_ANY_MOD,     "\033[1;2P",      0,  0 },
	{ XK_F14,           XK_ANY_MOD,     "\033[1;2Q",      0,  0 },
	{ XK_F15,           XK_ANY_MOD,     "\033[1;2R",      0,  0 },
	{ XK_F16,           XK_ANY_MOD,     "\033[1;2S",      0,  0 },
	{ XK_F17,           XK_ANY_MOD,     "\033[15;2~",     0,  0 },
	{ XK_F18,           XK_ANY_MOD,     "\033[17;2~",     0,  0 },
	{ XK_F19,           XK_ANY_MOD,     "\033[18;2~",     0,  0 },
	{ XK_F20,           XK_ANY_MOD,     "\033[19;2~",     0,  0 },
	{ XK_F21,           XK_ANY_MOD,     "\033[20;2~",     0,  0 },
	{ XK_F22,           XK_ANY_MOD,     "\033[21;2~",     0,  0 },
	{ XK_F23,           XK_ANY_MOD,     "\033[23;2~",     0,  0 },
	{ XK_F24,           XK_ANY_MOD,     "\033[24;2~",     0,  0 },
	{ XK_F25,           XK_ANY_MOD,     "\033[1;5P",      0,  0 },
	{ XK_F26,           XK_ANY_MOD,     "\033[1;5Q",      0,  0 },
	{ XK_F27,           XK_ANY_MOD,     "\033[1;5R",      0,  0 },
	{ XK_F28,           XK_ANY_MOD,     "\033[1;5S",      0,  0 },
	{ XK_F29,           XK_ANY_MOD,     "\033[15;5~",     0,  0 },
	{ XK_F30,           XK_ANY_MOD,     "\033[17;5~",     0,  0 },
	{ XK_F31,           XK_ANY_MOD,     "\033[18;5~",     0,  0 },
	{ XK_F32,           XK_ANY_MOD,     "\033[19;5~",     0,  0 },
	{ XK_F33,           XK_ANY_MOD,     "\033[20;5~",     0,  0 },
	{ XK_F34,           XK_ANY_MOD,     "\033[21;5~",     0,  0 },
	{ XK_F35,           XK_ANY_MOD,     "\033[23;5~",     0,  0 },
	{ XK_KP_Home,       XK_ANY_MOD,     "\033OH",         0,  0 },
	{ XK_KP_Left,       XK_ANY_MOD,     "\033OD",         0,  0 },
	{ XK_KP_Up,         XK_ANY_MOD,     "\033OA",         0,  0 },
	{ XK_KP_Right,      XK_ANY_MOD,     "\033OC",         0,  0 },
	{ XK_KP_Down,       XK_ANY_MOD,     "\033OB",         0,  0 },
	{ XK_KP_Prior,      ShiftMask,      "\033[5;2~",      0,  0 },
	{ XK_KP_Prior,      XK_ANY_MOD,     "\033[5~",        0,  0 },
	{ XK_KP_Begin,      XK_ANY_MOD,     "\033[E",         0,  0 },
	{ XK_KP_End,        ControlMask,    "\033[1;5F",     0,  0 },
	{ XK_KP_End,        ShiftMask,      "\033[1;2F",      0,  0 },
	{ XK_KP_End,        XK_ANY_MOD,     "\033[F",         0,  0 },
	{ XK_KP_Next,       ShiftMask,      "\033[6;2~",      0,  0 },
	{ XK_KP_Next,       XK_ANY_MOD,     "\033[6~",         0,  0 },
	{ XK_KP_Insert,     ShiftMask,      "\033[2;2~",      0,  0 },
	{ XK_KP_Insert,     XK_ANY_MOD,     "\033[2~",        0,  0 },
	{ XK_KP_Delete,     ControlMask,    "\033[3;5~",      0,  0 },
	{ XK_KP_Delete,     ShiftMask,      "\033[3;2~",      0,  0 },
	{ XK_KP_Delete,     XK_ANY_MOD,     "\033[3~",         0,  0 },
	{ XK_KP_Multiply,   XK_ANY_MOD,     "\033Oj",         0,  0 },
	{ XK_KP_Add,        XK_ANY_MOD,     "\033Ok",         0,  0 },
	{ XK_KP_Enter,      XK_ANY_MOD,     "\033OM",         0,  0 },
	{ XK_KP_Enter,      XK_ANY_MOD,     "\r",             0,  0 },
	{ XK_KP_Subtract,   XK_ANY_MOD,     "\033Om",         0,  0 },
	{ XK_KP_Decimal,    XK_ANY_MOD,     "\033On",         0,  0 },
	{ XK_KP_Divide,     XK_ANY_MOD,     "\033Oo",         0,  0 },
	{ XK_KP_0,          XK_ANY_MOD,     "\033Op",         0,  0 },
	{ XK_KP_1,          XK_ANY_MOD,     "\033Oq",         0,  0 },
	{ XK_KP_2,          XK_ANY_MOD,     "\033Or",         0,  0 },
	{ XK_KP_3,          XK_ANY_MOD,     "\033Os",         0,  0 },
	{ XK_KP_4,          XK_ANY_MOD,     "\033Ot",         0,  0 },
	{ XK_KP_5,          XK_ANY_MOD,     "\033Ou",         0,  0 },
	{ XK_KP_6,          XK_ANY_MOD,     "\033Ov",         0,  0 },
	{ XK_KP_7,          XK_ANY_MOD,     "\033Ow",         0,  0 },
	{ XK_KP_8,          XK_ANY_MOD,     "\033Ox",         0,  0 },
	{ XK_KP_9,          XK_ANY_MOD,     "\033Oy",         0,  0 },
};
EOF

# Modify Makefile for WASM
sed -i 's/^CC =.*/CC = emcc/' config.mk 2>/dev/null || echo "CC = emcc" >> config.mk
sed -i 's/^LD =.*/LD = emcc/' config.mk 2>/dev/null || echo "LD = emcc" >> config.mk
sed -i 's/-lX11//g' config.mk
sed -i 's/-lXft//g' config.mk
sed -i 's/-lfontconfig//g' config.mk
sed -i 's/-lfreetype//g' config.mk

# Add WASM flags
echo "LDFLAGS += -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS='[\"_main\"]' --no-entry" >> config.mk

# Build
echo "Compiling st..."
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make clean 2>/dev/null || true
CC=emcc CXX=em++ AR=emar LD=emcc STRIP=llvm-strip make -j$(nproc) 2>&1 | tee build.log

# Check if build succeeded
if [ -f "st" ] || [ -f "st.wasm" ]; then
    echo "✅ st compiled successfully!"
    mkdir -p ../packages
    cp st st.wasm ../packages/ 2>/dev/null || cp st ../packages/st.wasm
    echo "✅ Copied to ../packages/st.wasm"
else
    echo "❌ st compilation failed. Check build.log"
    exit 1
fi
