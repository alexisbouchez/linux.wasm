#!/bin/bash
# Custom WASM linker for BusyBox

set -e

EXE="$1"
shift

# Collect all object files and archives
OBJS=""
for arg in "$@"; do
    if [[ "$arg" == *.o ]] || [[ "$arg" == *.a ]]; then
        OBJS="$OBJS $arg"
    fi
done

# Link with emcc
emcc -o "$EXE" $OBJS \
    -s STANDALONE_WASM=1 \
    -s EXPORTED_FUNCTIONS='["_main"]' \
    --no-entry \
    -lm

echo "Linked $EXE"
