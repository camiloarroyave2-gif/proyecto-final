from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    password: str
    nombre: Optional[str] = None

    @property
    def correo(self) -> str:
        return self.email

    @property
    def contrasena(self) -> str:
        return self.password

class UserLogin(BaseModel):
    email: str
    password: str

    @property
    def correo(self) -> str:
        return self.email

    @property
    def contrasena(self) -> str:
        return self.password

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "pendiente"
    priority: Optional[str] = "media"
    category: Optional[str] = "general"
    due_date: Optional[datetime] = None
    teacher: Optional[str] = ""
    task_date: Optional[str] = ""
    task_time: Optional[str] = ""
    academic_year: Optional[str] = ""
    user_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
