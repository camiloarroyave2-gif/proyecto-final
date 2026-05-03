from sqlmodel import SQLModel, create_engine

engine = create_engine("sqlite:///database.db")

def create_db():
    from models import Usuario  # 👈 IMPORTANTE
    SQLModel.metadata.create_all(engine)