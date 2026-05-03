from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import Usuario
from ..schemas import UserCreate, UserLogin

router = APIRouter()

@router.post("/users")
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Usuario).where(Usuario.correo == user.correo)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Correo ya existe")

    new_user = Usuario(nombre=user.nombre, correo=user.correo)
    new_user.set_password(user.contrasena)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"id": new_user.id, "mensaje": "Usuario creado con éxito"}


@router.post("/login")
def login(user: UserLogin, session: Session = Depends(get_session)):
    db_user = session.exec(
        select(Usuario).where(Usuario.correo == user.correo)
    ).first()

    if not db_user or not db_user.check_password(user.contrasena):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return {"user_id": db_user.id}