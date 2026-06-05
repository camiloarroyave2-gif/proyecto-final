#!/bin/sh
echo "=== STARTING TASKFLOW ==="
echo "Python: $(python --version)"
echo "DATABASE_URL: ${DATABASE_URL:+set}"

echo "Waiting for database..."
for i in $(seq 1 30); do
  python -c "
from sqlmodel import create_engine
e = create_engine('${DATABASE_URL}')
e.connect().close()
" 2>/dev/null && echo "Database ready" && break
  echo "Attempt $i/30 - database not ready, retrying in 2s..."
  sleep 2
done

python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --log-level info
