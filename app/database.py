import os
from sqlmodel import create_engine, Session
from alembic.config import Config
from alembic import command

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/taskflow")

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

def run_migrations():
    alembic_cfg = Config(os.path.join(BASE_DIR, "alembic.ini"))
    command.upgrade(alembic_cfg, "head")

def get_session():
    with Session(engine) as session:
        yield session
