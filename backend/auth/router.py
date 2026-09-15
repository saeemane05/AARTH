import ast
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from fastapi import APIRouter, Header, HTTPException

from .schema import LoginRequest, RegisterRequest
from .service import login, profile_for_user, register

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
MAHARASHTRA_DISTRICTS = {
    "Ahilyanagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Chhatrapati Sambhajinagar",
    "Dharashiv", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City",
    "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri",
    "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal",
}


def _session_payload(session, profile):
    return {"access_token": session.session.access_token, "refresh_token": session.session.refresh_token,
            "user_id": session.user.id, "profile": profile}


@router.post("/register")
def register_account(payload: RegisterRequest):
    try:
        session, profile = register(payload)
        return {"success": True, **_session_payload(session, profile)}
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/login")
def login_account(payload: LoginRequest):
    session, profile = login(payload.username, payload.password)
    if not session or not session.session:
        raise HTTPException(401, "Invalid username or password")
    return {"success": True, **_session_payload(session, profile)}


@router.get("/me")
def me(authorization: str = Header(...)):
    from .service import _client
    try:
        user = _client().auth.get_user(authorization.removeprefix("Bearer ")).user
        profile = profile_for_user(user.id)
        if not profile:
            raise ValueError()
        return profile
    except Exception:
        raise HTTPException(401, "Invalid session")


@router.get("/catalog")
def catalog():
    market_file = Path(__file__).resolve().parents[1] / "market_intelligence" / "market_rates.py"
    tree = ast.parse(market_file.read_text(encoding="utf-8"))
    crops = []
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(target, "id", "") == "crop_master" for target in node.targets):
            crop_master = ast.literal_eval(node.value)
            crops = sorted(value.get("mr", key.replace("_", " ").title()) for key, value in crop_master.items())
    xlsx = Path(__file__).resolve().parents[1] / "market_intelligence" / "apmc_locations_patched.xlsx"
    with zipfile.ZipFile(xlsx) as book:
        ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
        strings = ["".join(item.itertext()) for item in ET.fromstring(book.read("xl/sharedStrings.xml"))]
        rows = []
        for row in ET.fromstring(book.read("xl/worksheets/sheet1.xml")).findall(f".//{ns}row"):
            values = []
            for cell in row.findall(f"{ns}c"):
                value = cell.find(f"{ns}v")
                values.append(strings[int(value.text)] if value is not None and cell.get("t") == "s" else (value.text if value is not None else ""))
            rows.append(values)
    header, data = rows[0], rows[1:]
    name, district = header.index("apmc_name"), header.index("district")
    apmcs = sorted({f"{row[name]} — {row[district]}" for row in data if len(row) > district})
    return {"crops": crops, "apmcs": apmcs, "districts": sorted(MAHARASHTRA_DISTRICTS | {row[district] for row in data if len(row) > district})}
