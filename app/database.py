import os
from sqlmodel import create_engine, SQLModel, Session
from alembic.config import Config
from alembic import command

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/taskflow")

engine = create_engine(DATABASE_URL, echo=False)

import time

def run_migrations():
    alembic_cfg = Config(os.path.join(BASE_DIR, "alembic.ini"))
    for attempt in range(3):
        try:
            command.upgrade(alembic_cfg, "head")
            return
        except Exception as e:
            if attempt < 2:
                print(f"=== MIGRATION attempt {attempt+1} failed: {e}, retrying... ===")
                time.sleep(3)
            else:
                raise

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
