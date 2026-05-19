from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "pendiente"
    priority: Optional[str] = "media"
    teacher: Optional[str] = ""
    task_date: Optional[str] = ""
    task_time: Optional[str] = ""
    academic_year: Optional[str] = ""
    user_id: int