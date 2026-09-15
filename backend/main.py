import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth.router import router as auth_router

# =========================================================
# MODULE: FARMER PROFILE
# Location: PROFILE/FARMER/
#   router.py   -> all /farmer/auth/... HTTP endpoints
#   service.py  -> Supabase auth + profile logic
#   schema.py   -> request/response models
#   rate_limit.py -> shared in-memory throttling
#
# Every route registered by this router lives under the
# "/farmer/auth" prefix (set inside router.py itself), so all
# Farmer endpoints are grouped together automatically in the
# /docs Swagger UI under the "Farmer Authentication" tag.
# =========================================================

# When you build the next profile type (Buyer, FPO, PACS, etc.),
# follow the same pattern and import it here, e.g.:
#   from PROFILE.BUYER.router import router as buyer_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AARTH API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Common username/password authentication endpoints.
app.include_router(auth_router)

# ---------------------------------------------------------
# FARMER PROFILE ROUTES
# ---------------------------------------------------------

# ---------------------------------------------------------
# Add future profile-type routers below, each on its own line,
# so this section stays a one-glance map of every module wired
# into the API:
#
# app.include_router(buyer_router)
# app.include_router(fpo_router)
# app.include_router(pacs_router)
# ---------------------------------------------------------


@app.get("/")
async def root():
    return {"status": "SEVA API running"}
