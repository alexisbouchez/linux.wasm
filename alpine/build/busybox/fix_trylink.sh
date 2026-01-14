#!/bin/bash
# Fix trylink script for WASM compilation

cd "$(dirname "$0")/busybox-1.36.1"

# Backup original
cp scripts/trylink scripts/trylink.orig

# Fix LDLIBS filtering - remove WASM-incompatible libraries
sed -i '131s|.*|LDLIBS=`echo "$LDLIBS" | xargs -n1 | grep -v "^crypt$" | grep -v "^resolv$" | grep -v "^rt$" | sort | uniq | xargs`|' scripts/trylink

# Fix the link command - remove problematic flags and fix syntax
sed -i '137,144d' scripts/trylink
sed -i '136a\
test x"$l_list" != x"" && l_list="$START_GROUP $l_list $END_GROUP"\
try emcc $CFLAGS $LDFLAGS -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS='\''["_main"]'\'' --no-entry \\\
	-o $EXE \\\
	$START_GROUP $O_FILES $A_FILES $END_GROUP \\\
	$l_list \\' scripts/trylink

echo "Fixed trylink script"
