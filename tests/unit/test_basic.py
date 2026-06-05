from app.models import Usuario, Tarea, Subtarea
from app.schemas import UserCreate, TaskCreate, SubtaskCreate
from app.database import engine
from sqlmodel import Session, SQLModel


def test_models_exist():
    assert Usuario.__tablename__ == "usuario"
    assert Tarea.__tablename__ == "tarea"
    assert Subtarea.__tablename__ == "subtarea"


def test_task_has_subtareas_relationship():
    assert "subtareas" in Tarea.__sqlmodel_relationships__


def test_user_create_schema():
    data = {"email": "a@b.com", "password": "123", "nombre": "Test"}
    u = UserCreate(**data)
    assert u.correo == "a@b.com"
    assert u.contrasena == "123"
    assert u.nombre == "Test"


def test_task_create_schema():
    data = {"title": "Task", "user_id": 1, "category": "personal", "priority": "alta"}
    t = TaskCreate(**data)
    assert t.title == "Task"
    assert t.user_id == 1


def test_subtask_create_schema():
    data = {"title": "Sub", "task_id": 1}
    s = SubtaskCreate(**data)
    assert s.title == "Sub"
    assert s.task_id == 1
