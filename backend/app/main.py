import os
from dotenv import load_dotenv 

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth
from app.api import trips
from app.api import itineraries

# Check for a production environment variable
IS_PRODUCTION = os.getenv("PRODUCTION", "False") == "True"

if IS_PRODUCTION:
    app = FastAPI(title="FunTrip API", docs_url=None, redoc_url=None)
else:
    app = FastAPI(title="FunTrip API")

FRONTEND_URL = os.getenv("FRONTEND_URL")

if FRONTEND_URL is None:
    raise ValueError("FRONTEND_URL environment variable is not set.")

origins = [
    FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
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
