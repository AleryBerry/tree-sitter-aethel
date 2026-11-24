#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/3] Generating C parser from tree-sitter-aethel/grammar.js..."
tree-sitter generate

PARSER_DIR="${HOME}/.local/share/nvim/site/parser"
QUERY_DIR="${HOME}/.config/nvim/queries/aethel"
SITE_QUERY_DIR="${HOME}/.local/share/nvim/site/queries/aethel"

mkdir -p "$PARSER_DIR" "$QUERY_DIR" "$SITE_QUERY_DIR"

echo "[2/3] Compiling aethel.so -> ${PARSER_DIR}/aethel.so..."
gcc -shared -fPIC -O2 -Isrc src/parser.c -o "${PARSER_DIR}/aethel.so"

echo "[3/3] Installing queries -> ${QUERY_DIR}/ and ${SITE_QUERY_DIR}/..."
cp -f queries/*.scm "$QUERY_DIR/"
cp -f queries/*.scm "$SITE_QUERY_DIR/"

echo "Done! tree-sitter-aethel installed successfully."
