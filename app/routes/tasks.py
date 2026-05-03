from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..database import get_session
from ..models import Tarea
from ..schemas import TaskCreate, TaskUpdate
from typing import List

router = APIRouter()

@router.post("/tasks", status_code=status.HTTP_201_CREATED)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    new_task = Tarea(**task.model_dump())
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    return new_task

@router.get("/tasks/{user_id}")
def get_tasks(user_id: int, session: Session = Depends(get_session)):
    statement = select(Tarea).where(Tarea.user_id == user_id).order_by(
        Tarea.status.asc(),
        Tarea.created_at.desc()
    )
    tasks = session.exec(statement).all()
    return tasks

@router.put("/tasks/{task_id}")
def update_task(task_id: int, task_update: TaskUpdate, session: Session = Depends(get_session)):
    db_task = session.get(Tarea, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Tarea, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    session.delete(task)
    session.commit()
    return {"message": "Tarea eliminada"}
