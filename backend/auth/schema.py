from typing import Any, Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


# =========================================================
# AARTH PUBLIC ROLES
# =========================================================
#
# These are the roles allowed to register through the
# public AARTH application.
#
# ADMIN is intentionally excluded from public registration.
# =========================================================

PUBLIC_ROLES = {
    "FARMER",
    "FPO",
    "BUYER",
    "LOGISTICS_PARTNER",
    "STORAGE_PARTNER",
}


AARTHRole = Literal[
    "FARMER",
    "FPO",
    "BUYER",
    "LOGISTICS_PARTNER",
    "STORAGE_PARTNER",
]


# =========================================================
# REGISTER
# =========================================================

class RegisterRequest(BaseModel):

    username: str = Field(
        min_length=4,
        max_length=30,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: AARTHRole

    @field_validator("username")
    @classmethod
    def validate_username(
        cls,
        value: str,
    ) -> str:

        value = value.strip().lower()

        if not value:
            raise ValueError(
                "Username is required."
            )

        if not value.replace(
            "_",
            "",
        ).isalnum():

            raise ValueError(
                "Username may contain only letters, numbers and underscores."
            )

        return value

    @field_validator("password")
    @classmethod
    def validate_password(
        cls,
        value: str,
    ) -> str:

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


# =========================================================
# LOGIN
# =========================================================

class LoginRequest(BaseModel):

    username: str = Field(
        min_length=1,
        max_length=30,
    )

    password: str = Field(
        min_length=1,
        max_length=128,
    )

    @field_validator("username")
    @classmethod
    def validate_username(
        cls,
        value: str,
    ) -> str:

        value = value.strip().lower()

        if not value:
            raise ValueError(
                "Username is required."
            )

        return value


# =========================================================
# REFRESH TOKEN
# =========================================================

class RefreshRequest(BaseModel):

    refresh_token: str = Field(
        min_length=1,
    )


# =========================================================
# PROFILE UPDATE
# =========================================================
#
# Identity values are NOT accepted here.
# The backend derives user_id and role from the authenticated
# Supabase session.
#
# The service layer further restricts profile_data to the
# fields allowed for that user's role.
# =========================================================

class ProfileUpdateRequest(BaseModel):

    profile_data: dict[str, Any] = Field(
        default_factory=dict,
    )
