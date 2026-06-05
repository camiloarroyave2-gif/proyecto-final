#!/bin/sh
echo "=== STARTING TASKFLOW ==="
echo "Python: $(python --version)"
echo "DATABASE_URL: ${DATABASE_URL:+set}"

echo "Waiting for database..."
DB_URL=$(echo "${DATABASE_URL}" | sed 's/^postgres:\/\//postgresql:\/\//')
DB_READY=0
for i in $(seq 1 30); do
  if python -c "
from sqlmodel import create_engine
try:
    e = create_engine('${DB_URL}')
    e.connect().close()
    print('ok')
except Exception:
    pass
" 2>/dev/null | grep -q '^ok'; then
    echo "Database ready"
    DB_READY=1
    break
  fi
  echo "Attempt $i/30 - database not ready, retrying in 2s..."
  sleep 2
done

if [ "$DB_READY" != "1" ]; then
  echo "ERROR: Could not connect to database after 30 attempts"
  exit 1
fi

python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --log-level info
