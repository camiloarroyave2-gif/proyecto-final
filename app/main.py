import os
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from .database import create_db, get_session
from .models import Usuario, Tarea
from .schemas import UserCreate
from .routes import tasks
from typing import List

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    yield

app = FastAPI(title="Gestión de Tareas Inteligente", lifespan=lifespan)

# Configuración para unir Frontend y Backend
# Buscamos la carpeta frontend un nivel arriba del directorio app
# Configuración de rutas de archivos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Servir archivos estáticos (js, css, imágenes)
if not os.path.exists(FRONTEND_DIR):
    print(f"ERROR: No se encontró la carpeta frontend en: {FRONTEND_DIR}")
else:
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

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(os.path.join(FRONTEND_DIR, "favicon.ico")) if os.path.exists(os.path.join(FRONTEND_DIR, "favicon.ico")) else None

@app.post("/api/users", status_code=status.HTTP_201_CREATED, tags=["Auth"])
@app.post("/api/register", status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register_user(user: UserCreate, session: Session = Depends(get_session)):
    # Verificar si el usuario ya existe
    existing_user = session.exec(select(Usuario).where(Usuario.email == user.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    # Creamos el objeto de la base de datos a partir del esquema
    new_user = Usuario(email=user.email, password=user.password or "1234")
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": "Usuario creado con éxito", "user_id": new_user.id}

@app.post("/api/login", tags=["Auth"])
def login_bypass(credentials: dict = Body(...), session: Session = Depends(get_session)):
    email = credentials.get("email")
    raw_password = credentials.get("password")
    password = str(raw_password) if raw_password else ""
    
    # Buscar al usuario en la base de datos
    user = session.exec(select(Usuario).where(Usuario.email == email)).first()

    # Bypass de seguridad para desarrollo
    if password == "1234" or password == "admin" or password == "":
        if not user:
            user = Usuario(email=email, password=password)
            session.add(user)
            session.commit()
            session.refresh(user)
        return {"user_id": user.id, "email": user.email, "message": "Acceso concedido"}

    # Verificación normal si no se usa el bypass
    if user and user.password == password:
        return {"user_id": user.id, "email": user.email, "message": "Acceso concedido"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Credenciales incorrectas. Use '1234' para acceder con cualquier correo."
    )

@app.get("/api/profile/{user_id}", tags=["Perfil"])
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
app.include_router(tasks.router, prefix="/api", tags=["Tareas"])