import logging

from fastapi import APIRouter, HTTPException, Header, Request

from .schema import (
    RegisterRequest,
    PhoneRequest,
    OTPVerifyRequest,
    LoginRequest,
    ForgotUsernameRequest,
    ForgotUsernameVerifyRequest,
    ForgotPasswordRequest,
    ForgotPasswordVerifyRequest,
    ResetPasswordRequest,
    LogoutRequest,
)

from .service import (
    register_farmer,
    send_login_otp,
    verify_login_otp,
    login_username,
    send_forgot_username_otp,
    verify_forgot_username_otp,
    send_forgot_password_otp,
    verify_forgot_password_otp,
    reset_password,
    get_user,
    logout,
)

from .rate_limit import check_rate_limit

logger = logging.getLogger("seva.farmer.auth.router")

router = APIRouter(prefix="/farmer/auth", tags=["Farmer Authentication"])


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


# =========================================================
# REGISTRATION
# =========================================================

@router.post("/register")
async def register(request: RegisterRequest, http_request: Request):
    check_rate_limit(f"register:{_client_ip(http_request)}", max_attempts=5, window_seconds=3600)

    try:
        response = register_farmer(
            phone=request.phone,
            username=request.username,
            password=request.password,
            role=request.role,
        )

        if not response or not response.session:
            raise HTTPException(status_code=400, detail="Registration failed")

        return {
            "success": True,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": response.user.id,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except HTTPException:
        raise

    except Exception:
        logger.exception("Unexpected error during registration")
        raise HTTPException(status_code=500, detail="Registration failed, please try again")


# =========================================================
# PHONE OTP LOGIN
# =========================================================

@router.post("/phone/send-otp")
async def phone_send_otp(request: PhoneRequest, http_request: Request):
    check_rate_limit(f"otp:{request.phone}", max_attempts=5, window_seconds=600)
    check_rate_limit(f"otp:{_client_ip(http_request)}", max_attempts=20, window_seconds=600)

    try:
        send_login_otp(request.phone)
        return {"success": True, "message": "OTP sent successfully"}

    except Exception:
        logger.exception("Failed to send OTP to phone")
        raise HTTPException(status_code=400, detail="Unable to send OTP")


@router.post("/phone/verify-otp")
async def phone_verify_otp(request: OTPVerifyRequest, http_request: Request):
    check_rate_limit(f"otp-verify:{request.phone}", max_attempts=8, window_seconds=600)

    try:
        response = verify_login_otp(request.phone, request.token)

        if not response or not response.session:
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")

        return {
            "success": True,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": response.user.id,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("OTP verification failed")
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")


# =========================================================
# USERNAME + PASSWORD LOGIN
# =========================================================

@router.post("/login")
async def username_password_login(request: LoginRequest, http_request: Request):
    check_rate_limit(f"login:{request.username.lower()}", max_attempts=8, window_seconds=600)
    check_rate_limit(f"login:{_client_ip(http_request)}", max_attempts=30, window_seconds=600)

    try:
        response = login_username(request.username, request.password)

        if not response or not response.session:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        return {
            "success": True,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": response.user.id,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Username/password login failed")
        raise HTTPException(status_code=401, detail="Invalid username or password")


# =========================================================
# FORGOT USERNAME
# =========================================================

@router.post("/forgot-username/send-otp")
async def forgot_username_send_otp(request: ForgotUsernameRequest):
    check_rate_limit(f"forgot-username:{request.phone}", max_attempts=5, window_seconds=3600)

    try:
        send_forgot_username_otp(request.phone)
        return {"success": True, "message": "If this phone is registered, an OTP has been sent"}

    except Exception:
        logger.exception("Failed to send forgot-username OTP")
        # Same generic message even on failure — avoids confirming/denying
        # whether the phone number exists in the system.
        return {"success": True, "message": "If this phone is registered, an OTP has been sent"}


@router.post("/forgot-username/verify")
async def forgot_username_verify(request: ForgotUsernameVerifyRequest):
    check_rate_limit(f"forgot-username-verify:{request.phone}", max_attempts=8, window_seconds=600)

    try:
        username = verify_forgot_username_otp(request.phone, request.token)

        if not username:
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")

        return {"success": True, "username": username}

    except HTTPException:
        raise

    except Exception:
        logger.exception("Forgot-username OTP verification failed")
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")


# =========================================================
# FORGOT / RESET PASSWORD
# =========================================================

@router.post("/forgot-password/send-otp")
async def forgot_password_send_otp(request: ForgotPasswordRequest):
    check_rate_limit(f"forgot-password:{request.phone}", max_attempts=5, window_seconds=3600)

    try:
        send_forgot_password_otp(request.phone)
        return {"success": True, "message": "If this phone is registered, an OTP has been sent"}

    except Exception:
        logger.exception("Failed to send forgot-password OTP")
        return {"success": True, "message": "If this phone is registered, an OTP has been sent"}


@router.post("/forgot-password/verify")
async def forgot_password_verify(request: ForgotPasswordVerifyRequest):
    check_rate_limit(f"forgot-password-verify:{request.phone}", max_attempts=8, window_seconds=600)

    try:
        response = verify_forgot_password_otp(request.phone, request.token)

        if not response or not response.session:
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")

        return {
            "success": True,
            # short-lived — client sends this straight to /reset-password
            "access_token": response.session.access_token,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Forgot-password OTP verification failed")
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")


@router.post("/reset-password")
async def reset_password_endpoint(request: ResetPasswordRequest):
    try:
        reset_password(request.access_token, request.new_password)
        return {"success": True, "message": "Password updated successfully"}

    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    except Exception:
        logger.exception("Password reset failed")
        raise HTTPException(status_code=400, detail="Unable to reset password")


# =========================================================
# CURRENT USER
# =========================================================

@router.get("/me")
async def current_user(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise ValueError("Malformed authorization header")

        token = authorization.removeprefix("Bearer ")
        user = get_user(token)

        return {
            "authenticated": True,
            "user_id": user.user.id,
            "phone": user.user.phone,
            "email": user.user.email,
        }

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session")


# =========================================================
# LOGOUT
# =========================================================

@router.post("/logout")
async def logout_endpoint(request: LogoutRequest):
    try:
        logout(request.access_token)
        return {"success": True, "message": "Logged out"}

    except Exception:
        logger.exception("Logout failed")
        # Logout should never hard-fail the client — worst case the
        # token simply expires naturally.
        return {"success": True, "message": "Logged out"}