from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Tarea
from app.schemas import TaskCreate

router = APIRouter()

@router.post("/tasks")
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    new_task = Tarea(title=task.title, description=task.description, status=task.status, user_id=task.user_id)
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    return new_task


@router.get("/tasks/{user_id}")
def get_tasks(user_id: int, session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
    return tasks


@router.put("/tasks/{task_id}")
def update_task(task_id: int, task: TaskCreate, session: Session = Depends(get_session)):
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="No encontrada")

    db_task.title = task.title
    db_task.description = task.description
    db_task.status = task.status

    session.add(db_task)
    session.commit()
    return {"message": "Actualizada"}


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="No encontrada")

    session.delete(task)
    session.commit()
    return {"message": "Eliminada"}