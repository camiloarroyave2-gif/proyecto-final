from sqlmodel import SQLModel, Field
from datetime import datetime

class Usuario(SQLModel, table=True):
    __tablename__: str = "usuario"
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password: str

class Tarea(SQLModel, table=True):
    __tablename__: str = "tarea"
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(nullable=False)
    description: str = ""
    status: str = Field(default="pendiente")
    priority: str = Field(default="media")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="usuario.id", index=True)