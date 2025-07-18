import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api import auth
from app.api import trips

load_dotenv()

app = FastAPI(title="AI Trip Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trips.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Trip Planner API"}
