from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Security
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse 
from app.schemas.auth import Token 
from app.services import user as user_service


router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check for existing username or email
    existing_user_by_username = user_service.get_user_by_username(db, username=user_in.username)
    if existing_user_by_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    
    existing_user_by_email = user_service.get_user_by_email(db, email=user_in.email)
    if existing_user_by_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Create the user (assuming confirm_password is handled on frontend or via Pydantic validator)
    new_user = user_service.create_user(db, user_in)
    return new_user # Return the newly created user's public data

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = user_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=user_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = user_service.create_access_token(
        data={"user_id": user.id, "username": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "expires_in": user_service.ACCESS_TOKEN_EXPIRE_MINUTES}


# --- Dependency to get Current Authenticated User ---
# This function is a dependency that is used for protected routes
# It requires the token from the request and a database session
async def get_current_user(token: str = Security(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = user_service.get_current_user_from_token(token, db)
    if user is None:
        raise credentials_exception
    return user # Returns the SQLAlchemy User model instance


@router.get("/me", response_model=UserResponse) 
def read_users_me(current_user: User = Depends(get_current_user)): # Dependency provides SQLAlchemy User object
    # Return the Pydantic schema representation of the SQLAlchemy model
    return UserResponse.model_validate(current_user)