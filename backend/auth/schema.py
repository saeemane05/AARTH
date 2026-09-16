from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


PUBLIC_ROLES = {
    "FARMER",
    "FPO",
    "BUYER",
    "LOGISTICS_PARTNER",
    "STORAGE_PARTNER",
}


class RegisterRequest(BaseModel):
    username: str = Field(
        min_length=4,
        max_length=30,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: Literal[
        "FARMER",
        "FPO",
        "BUYER",
        "LOGISTICS_PARTNER",
        "STORAGE_PARTNER",
    ]

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip().lower()

        if not value:
            raise ValueError(
                "Username is required."
            )

        if not value.replace(
            "_", ""
        ).isalnum():
            raise ValueError(
                "Username may contain only letters, numbers and underscores."
            )

        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError(
                "Password must be at least 8 characters."
            )

        if not any(
            character.isdigit()
            for character in value
        ):
            raise ValueError(
                "Password must contain at least one number."
            )

        return value


class LoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return value.strip().lower()


class RefreshRequest(BaseModel):
    refresh_token: str = Field(
        min_length=1
    )


class ProfileUpdateRequest(BaseModel):
    profile_data: dict[str, Any] = Field(
        default_factory=dict
    )