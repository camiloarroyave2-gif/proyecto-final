from sqlmodel import SQLModel, Field

class Usuario(SQLModel, table=True):
    __tablename__: str = "usuario"
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password: str
