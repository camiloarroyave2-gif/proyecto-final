from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str

class TaskCreate(BaseModel):
    title: str = "Actualizado"
    description: str = ""
    due_date: str = ""
    status: str = "pendiente"
    user_id: Optional[int] = None