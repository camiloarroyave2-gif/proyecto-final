from sqlmodel import SQLModel, create_engine, Session
from contextlib import contextmanager

import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
engine = create_engine(f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}")


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


@contextmanager
def get_session_context():
    with Session(engine) as session:
        yield session


def get_session():
    with Session(engine) as session:
        yield session
