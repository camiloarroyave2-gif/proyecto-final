from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db
from app.routes.users import router as users_router
from app.routes.tasks import router as tasks_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(tasks_router, prefix="/api", tags=["tasks"])

@app.on_event("startup")
def on_startup():
    create_db()

@app.get("/")
def home():
    return {"mensaje": "API TaskFlow funcionando"}
