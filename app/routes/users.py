from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import Usuario
from ..schemas import UserCreate

router = APIRouter()

@router.post("/users")
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Usuario).where(Usuario.email == user.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email ya existe")

    new_user = Usuario(email=user.email, password=user.password)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


@router.post("/login")
def login(user: UserCreate, session: Session = Depends(get_session)):
    db_user = session.exec(
        select(Usuario).where(Usuario.email == user.email, Usuario.password == user.password)
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return {"user_id": db_user.id}