from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

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