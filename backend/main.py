import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth.router import router as auth_router


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


app.include_router(
    auth_router
)


@app.get("/")
async def root():
    return {
        "status":
            "AARTH API running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "AARTH API",
    }