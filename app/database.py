import os
from sqlmodel import create_engine, SQLModel, Session
from alembic.config import Config
from alembic import command

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/taskflow")

engine = create_engine(DATABASE_URL, echo=False)

def run_migrations():
    alembic_cfg = Config(os.path.join(BASE_DIR, "alembic.ini"))
    command.upgrade(alembic_cfg, "head")

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
