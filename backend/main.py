from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from database import create_db
from models import Usuario
from db import get_session

app = FastAPI()

# ✅ RUTA PRINCIPAL
@app.get("/")
def home():
    return {"mensaje": "API funcionando"}

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db()

# 🔥 REGISTRO
@app.post("/api/register")
def register(user: Usuario, session: Session = Depends(get_session)):
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

# 🔥 LOGIN
@app.post("/api/login")
def login(data: Usuario, session: Session = Depends(get_session)):
    user = session.exec(
        select(Usuario).where(Usuario.email == data.email)
    ).first()

    if not user or user.password != data.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    return {"mensaje": "Login exitoso", "usuario": user.email}