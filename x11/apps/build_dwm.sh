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

# Create WASM-compatible config.h with all required definitions
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
static const float mfact             = 0.55;

static const Layout layouts[] = {
	{ "[]=",      tile },
	{ "><>",      NULL },
	{ "[M]",      monocle },
};

static const char *termcmd[]  = { "st", NULL };
static const char *dmenucmd[] = { "dmenu_run", NULL };

static const Rule rules[] = {
	/* xprop(1):
	 *	WM_CLASS(STRING) = instance, class
	 *	WM_NAME(STRING) = title
	 */
	/* class      instance    title       tags mask     isfloating   monitor */
	{ NULL,       NULL,       NULL,       0,            0,           -1 },
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

static Button buttons[] = {
	/* click                event mask      button          function        argument */
	{ ClkLtSymbol,          0,              Button1,        setlayout,      {.v = &layouts[0]} },
	{ ClkLtSymbol,          0,              Button3,        setlayout,      {.v = &layouts[2]} },
	{ ClkWinTitle,          0,              Button2,        zoom,           {0} },
	{ ClkStatusText,        0,              Button2,        spawn,          {.v = termcmd } },
	{ ClkClientWin,         MODKEY,         Button1,        movemouse,      {0} },
	{ ClkClientWin,         MODKEY,         Button2,        togglefloating, {0} },
	{ ClkClientWin,         MODKEY,         Button3,        resizemouse,    {0} },
	{ ClkTagBar,            0,              Button1,        view,           {0} },
	{ ClkTagBar,            0,              Button3,        toggleview,     {0} },
	{ ClkTagBar,            MODKEY,         Button1,        tag,            {0} },
	{ ClkTagBar,            MODKEY,         Button3,        toggletag,      {0} },
};
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

# Patch source files to remove Xft/Xinerama dependencies
# Comment out Xft includes and related code
sed -i 's/#include <X11\/Xft\/Xft.h>/\/\/ #include <X11\/Xft\/Xft.h> \/\/ Disabled for WASM/g' drw.c 2>/dev/null || true
sed -i 's/#include <X11\/Xft\/Xft.h>/\/\/ #include <X11\/Xft\/Xft.h> \/\/ Disabled for WASM/g' dwm.c 2>/dev/null || true
sed -i 's/#include <X11\/extensions\/Xinerama.h>/\/\/ #include <X11\/extensions\/Xinerama.h> \/\/ Disabled for WASM/g' dwm.c 2>/dev/null || true
sed -i 's/#include <fontconfig\/fontconfig.h>/\/\/ #include <fontconfig\/fontconfig.h> \/\/ Disabled for WASM/g' drw.c 2>/dev/null || true
sed -i 's/#include <X11\/Xft\/Xft.h>/\/\/ #include <X11\/Xft\/Xft.h> \/\/ Disabled for WASM/g' drw.h 2>/dev/null || true
sed -i 's/#include <fontconfig\/fontconfig.h>/\/\/ #include <fontconfig\/fontconfig.h> \/\/ Disabled for WASM/g' drw.h 2>/dev/null || true

# Add stub types to drw.h
python3 << 'PYEOF'
import re

# Read drw.h
with open('drw.h', 'r') as f:
    content = f.read()

# Add stub types before struct definitions
stub_types = '''
// WASM stubs for Xft
typedef struct { int ascent; int descent; } XftFont;
typedef struct {} FcPattern;
typedef struct { unsigned long pixel; } XftColor;
typedef unsigned char FcChar8;
typedef int FcResult;
#define FcResultMatch 0
#define FcResultNoMatch 1
'''

# Insert after includes
content = re.sub(r'(//.*Xft.*\n)', r'\1' + stub_types, content, count=1)
if stub_types not in content:
    # Find first struct or typedef and insert before
    match = re.search(r'(typedef struct|struct \w+)', content)
    if match:
        content = content[:match.start()] + stub_types + '\n' + content[match.start():]

# Replace XftFont *xfont with void *xfont
content = re.sub(r'XftFont \*xfont', 'void *xfont', content)
content = re.sub(r'FcPattern \*pattern', 'void *pattern', content)

# Write back
with open('drw.h', 'w') as f:
    f.write(content)
PYEOF

# Disable Xft/FontConfig functions in drw.c - replace with stubs
python3 << 'PYEOF'
import re

# Read drw.c
with open('drw.c', 'r') as f:
    content = f.read()

# Add FontConfig stub definitions at top
fc_stubs = '''
// FontConfig stubs for WASM
#define FC_CHARSET "charset"
#define FC_SCALABLE "scalable"
#define FcTrue 1
#define FcFalse 0
typedef void* FcCharSet;
typedef void* FcPattern;
void* FcCharSetCreate() { return NULL; }
void FcCharSetAddChar(void* cs, unsigned int ucs4) {}
void* FcPatternDuplicate(void* p) { return NULL; }
void FcPatternAddCharSet(void* p, const char* object, void* c) {}
void FcPatternAddBool(void* p, const char* object, int b) {}
void FcPatternDestroy(void* p) {}
void FcCharSetDestroy(void* cs) {}
'''

# Insert after includes
if 'FcCharSetCreate' not in content:
    # Find first function and insert before
    match = re.search(r'^(static |void |int |Fnt)', content, re.MULTILINE)
    if match:
        content = content[:match.start()] + fc_stubs + '\n' + content[match.start():]

# Replace all FontConfig function calls with stubs
fc_functions = [
    'FcCharSetCreate', 'FcCharSetAddChar', 'FcCharSetDestroy',
    'FcPatternDuplicate', 'FcPatternAddCharSet', 'FcPatternAddBool',
    'FcPatternDestroy', 'FcNameParse', 'FcConfigSubstitute',
    'FcDefaultSubstitute', 'FcFontMatch', 'FcPatternGet'
]

for func in fc_functions:
    # Replace function calls
    content = re.sub(rf'{func}\s*\([^)]*\)', f'/* {func} disabled */ NULL', content)

# Add XGlyphInfo stub to drw.h
with open('drw.h', 'r') as f:
    drw_h_content = f.read()
if 'XGlyphInfo' not in drw_h_content:
    drw_h_content = drw_h_content.replace('typedef struct {} FcPattern;', 
        'typedef struct {} FcPattern;\ntypedef struct { int x, y, width, height, xOff, yOff; } XGlyphInfo;')
    with open('drw.h', 'w') as f:
        f.write(drw_h_content)

# Replace Xft function calls more carefully - handle multi-line
# XftDrawStringUtf8 - comment out entire statement
content = re.sub(r'XftDrawStringUtf8\s*\([^;]*\);', r'/* XftDrawStringUtf8 disabled */', content)

# XftTextExtentsUtf8 - replace entire call and set ext manually
def replace_xft_text_extents(match):
    return '/* XftTextExtentsUtf8 disabled */ (void)0; ext.xOff = len * 6; ext.yOff = 0'
content = re.sub(r'XftTextExtentsUtf8\s*\([^)]+\)', replace_xft_text_extents, content)

# Ensure XGlyphInfo ext is declared
if 'XGlyphInfo ext' in content and 'XGlyphInfo ext =' not in content:
    content = re.sub(r'XGlyphInfo ext;', r'XGlyphInfo ext = {0};', content)

# Other Xft functions
xft_replace = {
    'XftFontOpenName': 'NULL',
    'XftFontClose': '/* XftFontClose disabled */',
    'XftFontOpenPattern': 'NULL',
    'XftDrawCreate': 'NULL',
    'XftDrawDestroy': '/* XftDrawDestroy disabled */'
}

for func, replacement in xft_replace.items():
    if 'disabled' in replacement:
        # For void functions, comment out the call
        content = re.sub(rf'^\s*{func}\s*\([^;]*\);', f'        /* {func} disabled */', content, flags=re.MULTILINE)
    else:
        # For functions returning values
        content = re.sub(rf'{func}\s*\([^)]+\)', replacement, content)

# Write back
with open('drw.c', 'w') as f:
    f.write(content)
PYEOF

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
