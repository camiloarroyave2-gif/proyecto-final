import os
from sqlmodel import create_engine, SQLModel, Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DB_DIR, exist_ok=True)

sqlite_file_name = "database.db"
sqlite_path = os.path.join(DB_DIR, sqlite_file_name)
sqlite_url = f"sqlite:///{sqlite_path}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
