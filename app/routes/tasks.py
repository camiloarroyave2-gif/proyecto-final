from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from ..database import get_session
from ..models import Tarea
from typing import Dict, Any

router = APIRouter()

@router.post("/tasks")
def create_task(task_data: Dict[str, Any] = Body(...), session: Session = Depends(get_session)):
    # Asegurar que el status inicial sea pendiente si no viene en el body
    if "status" not in task_data:
        task_data["status"] = "pendiente"
    
    # Filtramos solo los campos que pertenecen al modelo Tarea
    valid_data = {k: v for k, v in task_data.items() if hasattr(Tarea, k)}
    new_task = Tarea(**valid_data)
    
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    return new_task

@router.get("/tasks")
def tasks_root():
    return {"message": "Para obtener tareas, debes proporcionar un ID de usuario: /api/tasks/{user_id}"}


@router.get("/tasks/{user_id}")
def get_tasks(user_id: int, session: Session = Depends(get_session)):
    statement = select(Tarea).where(Tarea.user_id == user_id).order_by(
        Tarea.status.desc(),  # Pendientes arriba (alfabéticamente 'pendiente' > 'completada')
        Tarea.created_at.desc()
    )
    tasks = session.exec(statement).all()
    return tasks

@router.put("/tasks/{task_id}")
def update_task(task_id: int, task_data: Dict[str, Any] = Body(...), session: Session = Depends(get_session)):
    db_task = session.get(Tarea, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="No encontrada")
    for key, value in task_data.items():
        if hasattr(db_task, key):
            setattr(db_task, key, value)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Tarea, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="No encontrada")

    session.delete(task)
    session.commit()
    return {"message": "Eliminada"}