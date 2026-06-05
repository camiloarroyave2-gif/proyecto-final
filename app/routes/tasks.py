from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from ..database import get_session
from ..models import Tarea, Subtarea
from ..schemas import TaskCreate, TaskUpdate, TareaOut
from typing import List

router = APIRouter()

@router.post("/tasks", status_code=status.HTTP_201_CREATED, response_model=TareaOut)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    new_task = Tarea(**task.model_dump())
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    return new_task

@router.get("/tasks")
def tasks_root():
    return {"message": "Para obtener tareas, debes proporcionar un ID de usuario: /api/tasks/{user_id}"}


@router.get("/tasks/{user_id}", response_model=List[TareaOut])
def get_tasks(user_id: int, session: Session = Depends(get_session)):
    statement = select(Tarea).where(Tarea.user_id == user_id).options(
        selectinload(Tarea.subtareas)
    ).order_by(
        Tarea.status.desc(),
        Tarea.created_at.desc()
    )
    tasks = session.exec(statement).all()
    return tasks

@router.put("/tasks/{task_id}", response_model=TareaOut)
def update_task(task_id: int, task_update: TaskUpdate, session: Session = Depends(get_session)):
    db_task = session.exec(
        select(Tarea).where(Tarea.id == task_id).options(selectinload(Tarea.subtareas))
    ).first()
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

    for st in task.subtareas:
        session.delete(st)
    session.delete(task)
    session.commit()
    return {"message": "Tarea eliminada"}
