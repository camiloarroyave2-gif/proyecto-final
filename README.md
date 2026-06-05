# TaskFlow — Gestión Inteligente de Tareas

Aplicación web full-stack para la gestión de tareas con autenticación segura, categorización dinámica, subtareas y dashboard de productividad.

## Tecnologías

- **Backend**: FastAPI, SQLModel, SQLAlchemy, bcrypt, python-multipart
- **Frontend**: HTML5, CSS3 (vanilla con variables CSS y tema claro/oscuro), JavaScript (vanilla)
- **Base de datos**: PostgreSQL
- **Servidor**: Uvicorn (ASGI)
- **Infraestructura**: Render (despliegue), GitHub Actions (CI)

## Características

- Autenticación con contraseñas hasheadas (bcrypt)
- CRUD completo de tareas con 4 categorías: Personal, Hogar, Trabajo, Académico
- Campos dinámicos según la categoría (profesor, materia, año académico, ubicación, etc.)
- Prioridades (alta, media, baja)
- Fecha límite opcional y programación de fecha/hora
- Subtareas por cada tarea
- Dashboard con estadísticas de productividad
- Filtros por estado, prioridad y categoría
- Tema claro/oscuro persistente
- Notificaciones toast animadas
- Interfaz responsive con diseño moderno
- CI/CD con GitHub Actions y despliegue en Render

## Estructura del Proyecto

```
├── app/                        # Backend (FastAPI)
│   ├── __init__.py
│   ├── main.py                 # Configuración principal, auth, profile, lifespan
│   ├── database.py             # Configuración de base de datos (PostgreSQL)
│   ├── models.py               # Modelos SQLModel (Usuario, Tarea, Subtarea)
│   ├── schemas.py              # Esquemas Pydantic (request/response)
│   └── routes/
│       ├── __init__.py
│       ├── tasks.py            # Endpoints CRUD de tareas
│       ├── subtasks.py         # Endpoints CRUD de subtareas
│       └── users.py            # Endpoints de registro/login alternativos
├── frontend/                   # Frontend estático
│   ├── index.html              # Interfaz principal (SPA)
│   └── app.js                  # Lógica del cliente (fetch, render, filtros)
├── data/                       # Base de datos local (auto-generada)
├── tests/
│   └── unit/
│       └── test_basic.py       # Tests unitarios básicos
├── .github/workflows/
│   └── ci.yml                  # Pipeline de integración continua
├── main.py                     # Entry point para ejecución local
├── requirements.txt            # Dependencias Python
├── Procfile                    # Comando de inicio para Render
├── render.yaml                 # Configuración de despliegue en Render
├── .env.example                # Variables de entorno de ejemplo
└── .gitignore
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

## Configuración

Copia `.env.example` a `.env` y ajusta las variables:

```env
HOST=0.0.0.0
PORT=8000

# Base de datos PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskflow
```

La aplicación usa PostgreSQL. Asegúrate de tener PostgreSQL corriendo (local o con Docker).

### Usuarios preconfigurados

El sistema arranca con usuarios predefinidos en `app/main.py`:

Nuevos registros solo se permiten para correos preautorizados definidos en `app/main.py`.

## Ejecución

```bash
# Opción 1: Usando el script principal
python main.py

# Opción 2: Directamente con uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La aplicación estará disponible en `http://localhost:8000`

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/register` | Registrar nuevo usuario (solo correos autorizados) |
| POST | `/api/users` | Ídem (alias) |
| POST | `/api/login` | Iniciar sesión, devuelve `user_id` |

### Perfil
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/profile/{user_id}` | Perfil con estadísticas de productividad |

### Tareas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/tasks` | Crear tarea |
| GET | `/api/tasks` | Mensaje informativo |
| GET | `/api/tasks/{user_id}` | Obtener tareas del usuario (con subtareas) |
| PUT | `/api/tasks/{task_id}` | Actualizar tarea (campos parciales) |
| DELETE | `/api/tasks/{task_id}` | Eliminar tarea y sus subtareas |

### Subtareas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/subtasks` | Crear subtarea |
| GET | `/api/tasks/{task_id}/subtasks` | Obtener subtareas de una tarea |
| PUT | `/api/subtasks/{subtask_id}` | Actualizar subtarea |
| DELETE | `/api/subtasks/{subtask_id}` | Eliminar subtarea |

### Documentación interactiva
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Modelo de datos

### Usuario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int (PK) | Identificador único |
| nombre | str | Nombre del usuario |
| correo | str (unique) | Correo electrónico |
| password_hash | str | Hash bcrypt de la contraseña |

### Tarea
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int (PK) | Identificador único |
| title | str | Título de la tarea |
| description | str | Descripción opcional |
| status | str | pendiente / completada |
| priority | str | baja / media / alta |
| category | str | personal / hogar / trabajo / academico |
| due_date | datetime | Fecha límite opcional |
| teacher | str | Profesor (solo académico) |
| task_date | str | Fecha programada |
| task_time | str | Hora programada |
| academic_year | str | Año académico (solo académico) |
| subject | str | Materia (solo académico) |
| location | str | Ubicación (trabajo/hogar) |
| created_at | datetime | Fecha de creación |
| user_id | int (FK) | Relación con usuario |

### Subtarea
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int (PK) | Identificador único |
| title | str | Título |
| completed | bool | Estado de completado |
| task_id | int (FK) | Relación con tarea padre |

## Despliegue

### Render (automatizado)
El archivo `render.yaml` define un servicio web con base de datos PostgreSQL. Al hacer push a `main`, Render despliega automáticamente.

### CI/CD
GitHub Actions ejecuta `pytest` en cada push/PR a `main` (`.github/workflows/ci.yml`).

## Tests

```bash
pytest tests/unit/ -v
```

## Licencia

MIT
<<<<<<< HEAD
# Hola
# hi
