from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str

class TaskCreate(BaseModel):
    title: str
    description: str
    due_date: str
    status: str
    user_id: int