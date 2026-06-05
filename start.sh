#!/usr/bin/env bash
set -e

echo "=== Verificando imports ==="
python -c "
import sys
try:
    from app.main import app
    print('✓ App imported successfully')
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
"

echo "=== Iniciando servidor ==="
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
