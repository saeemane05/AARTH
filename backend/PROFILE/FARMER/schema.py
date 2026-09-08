from pydantic import BaseModel, field_validator


# =========================================================
# SHARED VALIDATION
# =========================================================

def _validate_phone(v: str) -> str:
    """
    Validate phone number in E.164 format.

    Example:
        +919876543210
    """

    v = v.strip()

    if not v.startswith("+"):
        raise ValueError(
            "Phone must be in E.164 format, e.g. +919876543210"
        )

    digits = v[1:]

    if not digits.isdigit() or not (8 <= len(digits) <= 15):
        raise ValueError(
            "Invalid phone number"
        )

    return v


def _validate_password(v: str) -> str:
    """
    Basic password policy.

    Supabase Auth remains responsible for
    securely storing the password.
    """

    if len(v) < 8:
        raise ValueError(
            "Password must be at least 8 characters"
        )

    if not any(c.isdigit() for c in v):
        raise ValueError(
            "Password must contain at least one digit"
        )

    return v


def _validate_username(v: str) -> str:
    """
    Normalize username so the database stores
    one canonical representation.

    Example:

        Saee123
        SAEE123
        saee123

    all become:

        saee123
    """

    v = v.strip().lower()

    if not (4 <= len(v) <= 30):
        raise ValueError(
            "Username must be 4-30 characters"
        )

    return v


# =========================================================
# REGISTRATION
# =========================================================
#
# IMPORTANT:
#
# The client does NOT provide role.
#
# /farmer/auth/register
#       ↓
# role = FARMER
#
# This prevents a client from attempting:
#
# role = ADMIN
#
# or another privileged role.
# =========================================================

class RegisterRequest(BaseModel):

    phone: str

    username: str

    password: str


    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return _validate_phone(v)


    @field_validator("username")
    @classmethod
    def check_username(cls, v):
        return _validate_username(v)


    @field_validator("password")
    @classmethod
    def check_password(cls, v):
        return _validate_password(v)


# =========================================================
# PHONE OTP
# =========================================================

class PhoneRequest(BaseModel):

    phone: str


    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return _validate_phone(v)


class OTPVerifyRequest(BaseModel):

    phone: str

    token: str


    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return _validate_phone(v)


# =========================================================
# USERNAME + PASSWORD LOGIN
# =========================================================

class LoginRequest(BaseModel):

    username: str

    password: str


    @field_validator("username")
    @classmethod
    def check_username(cls, v):
        return _validate_username(v)


# =========================================================
# FORGOT USERNAME
# =========================================================

class ForgotUsernameRequest(BaseModel):

    phone: str


    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return _validate_phone(v)


class ForgotUsernameVerifyRequest(BaseModel):

    phone: str

    token: str


    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return _validate_phone(v)


# =========================================================
# FORGOT PASSWORD
# =========================================================

class ForgotPasswordRequest(BaseModel):

    phone: str


    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return _validate_phone(v)


class ForgotPasswordVerifyRequest(BaseModel):

    phone: str

    token: str


    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        return _validate_phone(v)


# =========================================================
# RESET PASSWORD
# =========================================================

class ResetPasswordRequest(BaseModel):

    access_token: str

    new_password: str


    @field_validator("new_password")
    @classmethod
    def check_password(cls, v):
        return _validate_password(v)


# =========================================================
# LOGOUT
# =========================================================

class LogoutRequest(BaseModel):

    access_token: str