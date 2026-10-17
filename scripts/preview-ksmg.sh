#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$project_dir/scripts/build-ksmg-preview.py"
exec ksmg preview "$project_dir/dist/ksmg-preview" "$@"
