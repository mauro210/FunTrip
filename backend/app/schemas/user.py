from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=2, max_length=30, description="Username must be 2-30 characters")
    email: EmailStr = Field(..., description="Valid email address")
    first_name: str = Field(..., min_length=1, max_length=50, description="First name")
    last_name: str = Field(..., min_length=1, max_length=50, description="Last name")


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8, max_length=100, description="Password must be at least 8 characters")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "johndoe",
                "email": "john.doe@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "password": "securepassword123",
                "confirm_password": "securepassword123"
            }
        }
    )


class UserLogin(BaseModel):
    """Schema for user login"""
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., description="User password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username_or_email": "johndoe",
                "password": "securepassword123"
            }
        }
    )


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    username: Optional[str] = Field(None, min_length=2, max_length=30)
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "first_name": "John",
                "last_name": "Smith"
            }
        }
    )


class PasswordChange(BaseModel):
    """Schema for changing password"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "current_password": "oldpassword123",
                "new_password": "newpassword123",
                "confirm_new_password": "newpassword123"
            }
        }
    )


class PasswordReset(BaseModel):
    """Schema for password reset request"""
    email: EmailStr = Field(..., description="Email address for password reset")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "john.doe@example.com"
            }
        }
    )


class PasswordResetConfirm(BaseModel):
    """Schema for confirming password reset"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "token": "reset-token-here",
                "new_password": "newpassword123",
                "confirm_new_password": "newpassword123"
            }
        }
    )


class UserResponse(UserBase):
    """Schema for user response (without sensitive data)"""
    id: int
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "johndoe",
                "email": "john.doe@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "is_active": True,
                "is_verified": True,
                "created_at": "2025-07-15T10:30:00Z",
                "updated_at": "2025-07-15T12:00:00Z"
            }
        }
    )


class UserProfile(UserResponse):
    """Extended user profile schema"""
    total_trips: int = 0
    last_login: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "johndoe",
                "email": "john.doe@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "is_active": True,
                "is_verified": True,
                "created_at": "2025-07-15T10:30:00Z",
                "updated_at": "2025-07-15T12:00:00Z",
                "total_trips": 5,
                "last_login": "2025-07-15T12:00:00Z"
            }
        }
    )


class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Token expiration time in seconds")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }
    )


class TokenData(BaseModel):
    """Schema for token data"""
    user_id: Optional[int] = None
    username: Optional[str] = None


class EmailVerification(BaseModel):
    """Schema for email verification"""
    token: str = Field(..., description="Email verification token")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "token": "verification-token-here"
            }
        }
    )


