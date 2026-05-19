from sqlmodel import SQLModel, create_engine

engine = create_engine("sqlite:///database.db")

def create_db():
    from backend.models import Usuario
    SQLModel.metadata.create_all(engine)