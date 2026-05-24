import os
from sqlmodel import create_engine, SQLModel, Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DB_DIR, exist_ok=True)

sqlite_path = os.path.join(DB_DIR, "database.db")
sqlite_url = f"sqlite:///{sqlite_path}"

DATABASE_URL = os.getenv("DATABASE_URL", sqlite_url)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
