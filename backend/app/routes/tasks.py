from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
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
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    return new_task


@router.get("/tasks/{user_id}")
def get_tasks(user_id: int, session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
    return tasks


@router.put("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate, session: Session = Depends(get_session)):
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    task_data = task.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        setattr(db_task, key, value)

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
