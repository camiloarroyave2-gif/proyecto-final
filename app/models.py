from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
import bcrypt

class Usuario(SQLModel, table=True):
    __tablename__: str = "usuario"
    id: int | None = Field(default=None, primary_key=True)
    nombre: str
    correo: str = Field(unique=True, index=True)
    password_hash: str

    def set_password(self, password: str):
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))

class Tarea(SQLModel, table=True):
    __tablename__: str = "tarea"
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(nullable=False)
    description: str = ""
    status: str = Field(default="pendiente")
    priority: str = Field(default="media")
    category: str = Field(default="general")
    due_date: datetime | None = Field(default=None)
    task_date: str = Field(default="")
    task_time: str = Field(default="")
    academic_year: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="usuario.id", index=True)
    subtareas: list["Subtarea"] = Relationship(back_populates="tarea")


class Subtarea(SQLModel, table=True):
    __tablename__: str = "subtarea"
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(nullable=False)
    completed: bool = Field(default=False)
    task_id: int = Field(foreign_key="tarea.id", index=True)
    tarea: Tarea = Relationship(back_populates="subtareas")