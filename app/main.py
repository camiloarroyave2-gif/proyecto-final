from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from .database import create_db, get_session
from .models import Usuario, Tarea
from .schemas import UserCreate, TaskCreate
from typing import List

app = FastAPI()

# Configuración de CORS para que el frontend pueda comunicarse con el backend
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

@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, session: Session = Depends(get_session)):
    # Verificar si el usuario ya existe
    statement = select(Usuario).where(Usuario.email == user.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está en uso")
    
    db_user = Usuario(email=user.email, password=user.password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return {"message": "Usuario creado", "user_id": db_user.id}

@app.post("/api/users", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, session: Session = Depends(get_session)):
    statement = select(Usuario).where(Usuario.email == user.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está en uso")
    
    db_user = Usuario(email=user.email, password=user.password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return {"message": "Usuario creado", "user_id": db_user.id}

@app.post("/api/login")
def login(user: UserCreate, session: Session = Depends(get_session)):
    statement = select(Usuario).where(Usuario.email == user.email, Usuario.password == user.password)
    db_user = session.exec(statement).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return {"user_id": db_user.id}

@app.get("/api/tasks/{user_id}", response_model=List[Tarea])
def get_tasks(user_id: int, session: Session = Depends(get_session)):
    statement = select(Tarea).where(Tarea.user_id == user_id)
    return session.exec(statement).all()

@app.post("/api/tasks")
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    # Notar que ignoramos due_date porque el modelo Tarea no lo tiene
    db_task = Tarea(
        title=task.title,
        description=task.description,
        status=task.status,
        user_id=task.user_id
    )
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, task_data: TaskCreate, session: Session = Depends(get_session)):
    db_task = session.get(Tarea, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    db_task.title = task_data.title
    db_task.description = task_data.description
    db_task.status = task_data.status
    
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    db_task = session.get(Tarea, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    session.delete(db_task)
    session.commit()
    return {"ok": True}