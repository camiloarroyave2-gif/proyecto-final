#!/bin/sh
echo "=== INICIANDO TASKFLOW ==="
python -c "
import sys, traceback
try:
    from app.main import app
    print('OK: app imported')
    sys.stdout.flush()
except Exception:
    traceback.print_exc()
    sys.stdout.flush()
    sys.exit(1)
"
echo "=== STARTING UVICORN ==="
python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
