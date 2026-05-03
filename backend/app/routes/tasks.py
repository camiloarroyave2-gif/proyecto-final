from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from app.database import get_session
<<<<<<< HEAD
from app.models import Task
from app.schemas import TaskCreate, TaskUpdate

router = APIRouter()


@router.post("/tasks", status_code=201)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    new_task = Task(
        title=task.title,
        description=task.description,
        due_date=task.due_date if task.due_date else None,
        status=task.status,
        user_id=task.user_id,
    )
=======
from app.models import Tarea as Task
from typing import Dict, Any

router = APIRouter()

@router.post("/tasks")
def create_task(task_data: Dict[str, Any], session: Session = Depends(get_session)):
    new_task = Task(**task_data)
>>>>>>> b617440 (error en logica en puerto)
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    return new_task


@router.get("/tasks/{user_id}")
def get_tasks(user_id: int, session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
    return tasks


@router.put("/tasks/{task_id}")
<<<<<<< HEAD
def update_task(task_id: int, task: TaskUpdate, session: Session = Depends(get_session)):
=======
def update_task(task_id: int, task_data: Dict[str, Any], session: Session = Depends(get_session)):
>>>>>>> b617440 (error en logica en puerto)
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

<<<<<<< HEAD
    task_data = task.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        setattr(db_task, key, value)
=======
    # Actualización flexible: solo actualiza los campos presentes en el JSON enviado
    for key, value in task_data.items():
        if hasattr(db_task, key):
            setattr(db_task, key, value)
>>>>>>> b617440 (error en logica en puerto)

    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    session.delete(task)
    session.commit()
    return {"message": "Tarea eliminada"}
