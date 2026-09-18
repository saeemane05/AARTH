import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth.router import router as auth_router
from backend.fpo.router import router as fpo_router
from backend.location_services.router import router as location_router
from backend.lot_aggregation.router import router as lot_router
from backend.identity.router import router as identity_router


logging.basicConfig(
    level=logging.INFO
)


app = FastAPI(
    title="AARTH API"
)


frontend_url = os.getenv(
    "FRONTEND_URL",
    "",
).strip()


allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


if frontend_url:
    allowed_origins.append(
        frontend_url.rstrip("/")
    )


app.add_middleware(
    CORSMiddleware,

    allow_origins=allowed_origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# AUTHENTICATION ROUTES
# =========================================================
#
# Authentication remains registered directly on the main
# FastAPI application.
#
# Existing /api/auth/* routes are NOT changed.
#

app.include_router(
    auth_router
)


# =========================================================
# FPO ROUTES
# =========================================================
#
# IMPORTANT:
#
# The FPO router itself has no prefix. FastAPI adds the
# shared /api prefix when registering its endpoints.
#

app.include_router(
    fpo_router,
    prefix="/api",
)

app.include_router(location_router)
app.include_router(lot_router)
app.include_router(identity_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
async def root():
    return {
        "status": "AARTH API running"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "AARTH API",
    }