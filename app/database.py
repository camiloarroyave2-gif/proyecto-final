import os
from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/taskflow"
)

engine = create_engine(DATABASE_URL, echo=False)

def create_db():
    SQLModel.metadata.create_all(engine)
    if "sqlite" in DATABASE_URL:
        return
    with engine.connect() as conn:
        existing = [row[0] for row in conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='tarea'")).fetchall()]
        for col, col_type in [("subject", "VARCHAR(255) DEFAULT ''"), ("location", "VARCHAR(255) DEFAULT ''"), ("teacher", "VARCHAR DEFAULT ''")]:
            if col not in existing:
                try:
                    conn.execute(text(f"ALTER TABLE tarea ADD COLUMN {col} {col_type}"))
                    conn.commit()
                except Exception:
                    conn.rollback()
            elif col == "teacher":
                try:
                    conn.execute(text("ALTER TABLE tarea ALTER COLUMN teacher SET DEFAULT ''"))
                    conn.commit()
                except Exception:
                    conn.rollback()

def get_session():
    with Session(engine) as session:
        yield session
