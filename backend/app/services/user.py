import os
from datetime import datetime, timedelta, timezone 
from typing import Optional, cast

from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy.sql import func 

from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.auth import TokenData 


# --- Password Hashing Configuration ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- JWT Token Configuration ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-fallback-for-testing-only")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, username_or_email: str, password: str) -> Optional[User]:
    # Assign the query result to a temporary variable first
    user_from_db: Optional[User] = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if user_from_db is None: # Explicitly check for None
        return None
    
    # Cast the hashed_password attribute to str to satisfy Pylance
    hashed_password_value: str = cast(str, user_from_db.hashed_password)
    
    if not verify_password(password, hashed_password_value):
        return None
    
    # Return the user object (which is now guaranteed not to be None)
    return user_from_db

def create_user(db: Session, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        is_active=True,
        is_verified=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_current_user_from_token(token: str, db: Session) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[int] = payload.get("user_id")
        if user_id is None:
            return None # Token does not contain a user_id
    except JWTError:
        return None # Invalid token (e.g., malformed, expired, invalid signature)
    
    user_result = db.query(User).filter(User.id == user_id).first()
    return user_result