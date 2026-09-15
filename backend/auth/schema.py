from typing import Literal

from pydantic import BaseModel, Field, field_validator

PUBLIC_ROLES = {"FARMER", "FPO", "BUYER", "LOGISTICS_PARTNER", "STORAGE_PARTNER"}


class RegisterRequest(BaseModel):
    username: str = Field(min_length=4, max_length=30)
    password: str = Field(min_length=8)
    role: Literal["FARMER", "FPO", "BUYER", "LOGISTICS_PARTNER", "STORAGE_PARTNER"]
    @field_validator("username")
    @classmethod
    def normalise_username(cls, value: str) -> str:
        value = value.strip().lower()
        if not value.replace("_", "").isalnum():
            raise ValueError("Username may contain letters, numbers, and underscores only")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one number")
        return value

class LoginRequest(BaseModel):
    username: str
    password: str
