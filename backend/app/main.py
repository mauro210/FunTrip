import os
from dotenv import load_dotenv 

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth
from app.api import trips
from app.api import itineraries

load_dotenv()

app = FastAPI(title="FunTrip API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(itineraries.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to FunTrip API"}
