import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Body

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from .database import create_db, get_session
from .models import Usuario, Tarea
from .schemas import UserCreate, UserLogin
from .routes import tasks
from typing import List

USUARIOS_VALIDOS = {
    "camilo.arroyave2@utp.edu.co": "camilo2006_RZ",
    "ca9126864@gmail.com": "54321",
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    from sqlmodel import Session as DBSession, select
    from .database import engine
    with DBSession(engine) as session:
        for correo, password in USUARIOS_VALIDOS.items():
            user = session.exec(select(Usuario).where(Usuario.correo == correo)).first()
            if not user:
                nombre = correo.split("@")[0]
                user = Usuario(nombre=nombre, correo=correo)
                user.set_password(password)
                session.add(user)
        otros = session.exec(select(Usuario).where(Usuario.correo.notin_(USUARIOS_VALIDOS.keys()))).all()
        for u in otros:
            tareas = session.exec(select(Tarea).where(Tarea.user_id == u.id)).all()
            for t in tareas:
                session.delete(t)
            session.delete(u)
        session.commit()
    yield

app = FastAPI(title="TaskFlow — Gestión Inteligente de Tareas", lifespan=lifespan)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"mensaje": "TaskFlow API funcionando"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(os.path.join(FRONTEND_DIR, "favicon.ico")) if os.path.exists(os.path.join(FRONTEND_DIR, "favicon.ico")) else None

@app.post("/api/users", status_code=status.HTTP_201_CREATED, tags=["Auth"])
@app.post("/api/register", status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register_user(user: UserCreate, session: Session = Depends(get_session)):
    if user.correo not in USUARIOS_VALIDOS:
        raise HTTPException(status_code=403, detail="No tienes permiso para registrarte")
    if user.contrasena != USUARIOS_VALIDOS[user.correo]:
        raise HTTPException(status_code=403, detail="Contraseña incorrecta para este usuario")
    
    existing_user = session.exec(select(Usuario).where(Usuario.correo == user.correo)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    nombre = user.nombre or user.email.split("@")[0]
    new_user = Usuario(nombre=nombre, correo=user.correo)
    new_user.set_password(user.contrasena)
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"id": new_user.id, "mensaje": "Usuario creado con éxito"}

@app.post("/api/login", tags=["Auth"])
def login(credentials: UserLogin, session: Session = Depends(get_session)):
    if credentials.correo not in USUARIOS_VALIDOS:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    user = session.exec(select(Usuario).where(Usuario.correo == credentials.correo)).first()
    if not user or not user.check_password(credentials.contrasena):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    return {"user_id": user.id, "correo": user.correo, "message": "Acceso concedido"}

@app.get("/api/profile/{user_id}", tags=["Perfil"])
def get_profile(user_id: int, session: Session = Depends(get_session)):
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    tareas = session.exec(select(Tarea).where(Tarea.user_id == user_id)).all()
    total = len(tareas)
    completadas = len([t for t in tareas if t.status == "completada"])
    por_categoria = {}
    for t in tareas:
        cat = t.category or "general"
        if cat not in por_categoria:
            por_categoria[cat] = {"total": 0, "completadas": 0}
        por_categoria[cat]["total"] += 1
        if t.status == "completada":
            por_categoria[cat]["completadas"] += 1
    
    return {
        "nombre": user.nombre,
        "correo": user.correo,
        "stats": {
            "total": total,
            "completadas": completadas,
            "pendientes": total - completadas,
            "por_categoria": por_categoria
        }
    }

app.include_router(tasks.router, prefix="/api", tags=["Tareas"])
