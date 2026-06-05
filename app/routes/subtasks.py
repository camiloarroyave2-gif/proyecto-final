from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..database import get_session
from ..models import Subtarea
from ..schemas import SubtaskCreate, SubtaskUpdate, SubtareaOut
from typing import List

router = APIRouter()

@router.post("/subtasks", status_code=status.HTTP_201_CREATED, response_model=SubtareaOut)
def create_subtask(subtask: SubtaskCreate, session: Session = Depends(get_session)):
    new_subtask = Subtarea(**subtask.model_dump())
    session.add(new_subtask)
    session.commit()
    session.refresh(new_subtask)
    return new_subtask

@router.get("/tasks/{task_id}/subtasks", response_model=List[SubtareaOut])
def get_subtasks(task_id: int, session: Session = Depends(get_session)):
    statement = select(Subtarea).where(Subtarea.task_id == task_id)
    subtasks = session.exec(statement).all()
    return subtasks

@router.put("/subtasks/{subtask_id}", response_model=SubtareaOut)
def update_subtask(subtask_id: int, subtask_update: SubtaskUpdate, session: Session = Depends(get_session)):
    db_subtask = session.get(Subtarea, subtask_id)
    if not db_subtask:
        raise HTTPException(status_code=404, detail="Subtarea no encontrada")

    update_data = subtask_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subtask, key, value)

    session.add(db_subtask)
    session.commit()
    session.refresh(db_subtask)
    return db_subtask

@router.delete("/subtasks/{subtask_id}")
def delete_subtask(subtask_id: int, session: Session = Depends(get_session)):
    subtask = session.get(Subtarea, subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtarea no encontrada")

    session.delete(subtask)
    session.commit()
    return {"message": "Subtarea eliminada"}
