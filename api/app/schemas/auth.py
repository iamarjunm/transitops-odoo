from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models.user import UserRole


class UserCreate(BaseModel):
    """Payload for registering a new user."""

    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.FLEET_MANAGER


class UserOut(BaseModel):
    """Public representation of a user (never includes the password hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    """Response returned on successful login."""

    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user: UserOut
