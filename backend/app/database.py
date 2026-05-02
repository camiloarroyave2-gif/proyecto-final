from sqlmodel import SQLModel, create_engine, Session

engine = create_engine("sqlite:///database.db", echo=True)

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()