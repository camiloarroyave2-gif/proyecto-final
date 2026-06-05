import os
from sqlmodel import create_engine, Session
from alembic.config import Config
from alembic import command

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/taskflow"
    print("=" * 60)
    print("⚠ ADVERTENCIA: DATABASE_URL no está configurada.")
    print("  Usando valor por defecto local. En Render esto NO funcionará.")
    print("  Configúrala en: Render Dashboard → Web Service → Environment")
    print("=" * 60)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

host_part = DATABASE_URL.split("@")[-1].split("?")[0] if "@" in DATABASE_URL else DATABASE_URL
print(f"Conectando a base de datos: {host_part}")

connect_args = {}
if "sslmode" not in DATABASE_URL:
    connect_args["sslmode"] = "require"

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True, connect_args=connect_args)

def run_migrations():
    alembic_cfg = Config(os.path.join(BASE_DIR, "alembic.ini"))
    command.upgrade(alembic_cfg, "head")

def get_session():
    with Session(engine) as session:
        yield session
