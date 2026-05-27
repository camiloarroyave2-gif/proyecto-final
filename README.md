# TaskFlow — Gestión Inteligente de Tareas

Aplicación web full-stack para la gestión de tareas con autenticación segura, categorización y dashboard de productividad.

## Tecnologías

- **Backend**: FastAPI, SQLModel, SQLite, bcrypt
- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **Servidor**: Uvicorn (ASGI)

## Características

- Autenticación con contraseñas hasheadas (bcrypt)
- CRUD completo de tareas
- Categorización (trabajo, personal, estudio, hogar, general)
- Prioridades (alta, media, baja)
- Fecha límite opcional
- Dashboard con estadísticas de productividad
- Filtros por estado, prioridad y categoría
- Tema claro/oscuro
- Notificaciones toast
- Interfaz responsive

## Estructura del Proyecto

```
├── app/                    # Backend (FastAPI)
│   ├── main.py            # Configuración principal de la app
│   ├── database.py        # Configuración de base de datos
│   ├── models.py          # Modelos SQLModel (Usuario, Tarea)
│   ├── schemas.py         # Esquemas Pydantic
│   └── routes/
│       └── tasks.py       # Endpoints de tareas
├── frontend/              # Frontend estático
│   ├── index.html         # Interfaz principal
│   └── app.js             # Lógica del cliente
├── data/                  # Base de datos SQLite (auto-generada)
├── requirements.txt       # Dependencias Python
└── main.py                # Entry point para ejecutar
```

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd proyecto-final

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt
```

## Ejecución

```bash
# Opción 1: Usando el script principal
python main.py

# Opción 2: Directamente con uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La aplicación estará disponible en `http://localhost:8000`

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/register` | Registrar nuevo usuario |
| POST | `/api/login` | Iniciar sesión |
| GET | `/api/profile/{user_id}` | Obtener perfil y estadísticas |
| POST | `/api/tasks` | Crear tarea |
| GET | `/api/tasks/{user_id}` | Obtener tareas del usuario |
| PUT | `/api/tasks/{task_id}` | Actualizar tarea |
| DELETE | `/api/tasks/{task_id}` | Eliminar tarea |

## Documentación API

FastAPI genera documentación automática disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Licencia

MIT
# Hola