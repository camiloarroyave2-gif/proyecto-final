import os
from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from .database import create_db, get_session
from .models import Usuario, Tarea
from .routes import tasks
from typing import List

app = FastAPI(title="Gestión de Tareas Inteligente")

# Configuración para unir Frontend y Backend
# Buscamos la carpeta frontend un nivel arriba del directorio app
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Servir archivos estáticos (js, css, imágenes)
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Configuración de CORS para que el frontend pueda comunicarse con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Sirve el index.html del frontend o un mensaje de estado."""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"mensaje": "API TaskFlow funcionando. Frontend no detectado en /frontend"}

@app.on_event("startup")
def on_startup():
    create_db()

@app.post("/api/users", status_code=status.HTTP_201_CREATED)
def register_user(user: Usuario, session: Session = Depends(get_session)):
    # Verificar si el usuario ya existe
    existing_user = session.exec(select(Usuario).where(Usuario.email == user.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"message": "Usuario creado con éxito", "user_id": user.id}

@app.post("/api/login")
def login_bypass(credentials: dict = Body(...), session: Session = Depends(get_session)):
    email = credentials.get("email")
    password = credentials.get("password")

    # Si la contraseña es 1234, permitimos el acceso con cualquier correo
    if password == "1234":
        user = session.exec(select(Usuario).where(Usuario.email == email)).first()
        if not user:
            # Si el usuario no existe, lo creamos automáticamente
            user = Usuario(email=email, password=password)
            session.add(user)
            session.commit()
            session.refresh(user)
        return {"user_id": user.id, "email": user.email, "message": "Acceso concedido"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Credenciales incorrectas. Use '1234' para acceder con cualquier correo."
    )

@app.get("/api/profile/{user_id}")
def get_profile(user_id: int, session: Session = Depends(get_session)):
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Estadísticas inteligentes
    tareas = session.exec(select(Tarea).where(Tarea.user_id == user_id)).all()
    total = len(tareas)
    completadas = len([t for t in tareas if t.status == "completada"])
    
    return {
        "email": user.email,
        "stats": {
            "total": total,
            "completadas": completadas,
            "pendientes": total - completadas
        }
    }

# Inclusión de routers con el prefijo /api para coincidir con el frontend
app.include_router(tasks.router, prefix="/api")