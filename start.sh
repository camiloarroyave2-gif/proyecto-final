#!/bin/sh
echo "=== STARTING TASKFLOW ==="
echo "Python: $(python --version)"
echo "DATABASE_URL: ${DATABASE_URL:+set}"
python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --log-level info
