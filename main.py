<<<<<<< HEAD
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "API funcionando 🔥"}

@app.get("/xd")
def xd():
    return {"message": "viva el vicio"}
=======
>>>>>>> b617440 (error en logica en puerto)
