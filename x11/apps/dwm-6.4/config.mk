# dwm version
VERSION = 6.4

# Customize below to fit your system

# paths
PREFIX = /usr/local
MANPREFIX = ${PREFIX}/share/man

X11INC = /usr/X11R6/include
X11LIB = /usr/X11R6/lib

# Xinerama, comment if you don't want it
LIBS  = 
FLAGS = 

# freetype
FREETYPELIBS =  
FREETYPEINC = /usr/include/freetype2
# OpenBSD (uncomment)
#FREETYPEINC = ${X11INC}/freetype2
#MANPREFIX = ${PREFIX}/man

# includes and libs
INCS = -I${X11INC} -I${FREETYPEINC}
LIBS = -L${X11LIB}  ${LIBS} ${FREETYPELIBS}

# flags
CPPFLAGS = -D_DEFAULT_SOURCE -D_BSD_SOURCE -D_POSIX_C_SOURCE=200809L -DVERSION=\"${VERSION}\" ${FLAGS}
#CFLAGS   = -g -std=c99 -pedantic -Wall -O0 ${INCS} ${CPPFLAGS}
CFLAGS   = -std=c99 -pedantic -Wall -Wno-deprecated-declarations -Os ${INCS} ${CPPFLAGS}
LDFLAGS  = ${LIBS}

# Solaris
#CFLAGS = -fast ${INCS} -DVERSION=\"${VERSION}\"
#LDFLAGS = ${LIBS}

# compiler and linker
CC = emcc
LDFLAGS += -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS='["_main"]' --no-entry
LDFLAGS += -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS='["_main"]' --no-entry
