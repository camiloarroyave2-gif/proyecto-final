from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import User
from app.schemas import UserCreate
import hashlib

router = APIRouter()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/users", status_code=201)
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == user.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email ya existe")

    new_user = User(email=user.email, password=hash_password(user.password))
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email}


@router.post("/login")
def login(user: UserCreate, session: Session = Depends(get_session)):
    db_user = session.exec(
        select(User).where(
            User.email == user.email,
            User.password == hash_password(user.password)
        )
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return {"user_id": db_user.id, "email": db_user.email}
