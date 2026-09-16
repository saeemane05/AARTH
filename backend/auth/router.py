import ast
import zipfile

from pathlib import Path
from xml.etree import ElementTree as ET

from fastapi import (
    APIRouter,
    Header,
    HTTPException,
)

from .schema import (
    LoginRequest,
    RegisterRequest,
    RefreshRequest,
    ProfileUpdateRequest,
)

from .service import (
    login,
    register,
    refresh_session,
    profile_for_user,
    update_profile,
    _client,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


MAHARASHTRA_DISTRICTS = {
    "Ahilyanagar",
    "Akola",
    "Amravati",
    "Beed",
    "Bhandara",
    "Buldhana",
    "Chandrapur",
    "Chhatrapati Sambhajinagar",
    "Dharashiv",
    "Dhule",
    "Gadchiroli",
    "Gondia",
    "Hingoli",
    "Jalgaon",
    "Jalna",
    "Kolhapur",
    "Latur",
    "Mumbai City",
    "Mumbai Suburban",
    "Nagpur",
    "Nanded",
    "Nandurbar",
    "Nashik",
    "Palghar",
    "Parbhani",
    "Pune",
    "Raigad",
    "Ratnagiri",
    "Sangli",
    "Satara",
    "Sindhudurg",
    "Solapur",
    "Thane",
    "Wardha",
    "Washim",
    "Yavatmal",
}


def _session_payload(
    session,
    profile,
):
    return {
        "success": True,
        "access_token":
            session.session.access_token,
        "refresh_token":
            session.session.refresh_token,
        "user_id":
            session.user.id,
        "profile":
            profile,
    }


@router.post("/register")
def register_account(
    payload: RegisterRequest,
):
    try:
        session, profile = register(
            payload
        )

        return _session_payload(
            session,
            profile,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.post("/login")
def login_account(
    payload: LoginRequest,
):
    session, profile = login(
        payload.username,
        payload.password,
    )

    if (
        not session
        or not session.session
        or not profile
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password.",
        )

    return _session_payload(
        session,
        profile,
    )


@router.post("/refresh")
def refresh_account(
    payload: RefreshRequest,
):
    try:
        response = refresh_session(
            payload.refresh_token
        )

        if (
            not response
            or not response.session
        ):
            raise ValueError()

        profile = profile_for_user(
            response.user.id
        )

        if not profile:
            raise ValueError()

        return {
            "success": True,
            "access_token":
                response.session.access_token,
            "refresh_token":
                response.session.refresh_token,
            "user_id":
                response.user.id,
            "profile":
                profile,
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Session expired. Please login again.",
        )


@router.get("/me")
def me(
    authorization: str = Header(
        default=""
    ),
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is required.",
        )

    if not authorization.lower().startswith(
        "bearer "
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header.",
        )

    token = authorization[
        7:
    ].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid session.",
        )

    try:
        user_response = (
            _client()
            .auth
            .get_user(token)
        )

        user = (
            user_response.user
            if user_response
            else None
        )

        if not user:
            raise ValueError()

        profile = profile_for_user(
            user.id
        )

        if not profile:
            raise ValueError()

        if profile["status"] != "ACTIVE":
            raise ValueError()

        return profile

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid session.",
        )


@router.put("/profile")
def save_profile(
    payload: ProfileUpdateRequest,
    authorization: str = Header(
        default=""
    ),
):
    if not authorization.lower().startswith(
        "bearer "
    ):
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    token = authorization[
        7:
    ].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    try:
        user_response = (
            _client()
            .auth
            .get_user(token)
        )

        user = (
            user_response.user
            if user_response
            else None
        )

        if not user:
            raise ValueError()

        profile = update_profile(
            user.id,
            payload.profile_data,
        )

        return {
            "success": True,
            "profile": profile,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Could not save the AARTH profile.",
        )


@router.get("/catalog")
def catalog():
    market_file = (
        Path(__file__).resolve().parents[1]
        / "market_intelligence"
        / "market_rates.py"
    )

    tree = ast.parse(
        market_file.read_text(
            encoding="utf-8"
        )
    )

    crops = []

    for node in tree.body:
        if (
            isinstance(
                node,
                ast.Assign,
            )
            and any(
                getattr(
                    target,
                    "id",
                    "",
                )
                == "crop_master"
                for target in node.targets
            )
        ):
            crop_master = ast.literal_eval(
                node.value
            )

            crops = sorted(
                value.get(
                    "mr",
                    key.replace(
                        "_",
                        " ",
                    ).title(),
                )
                for key, value
                in crop_master.items()
            )

    xlsx = (
        Path(__file__).resolve().parents[1]
        / "market_intelligence"
        / "apmc_locations_patched.xlsx"
    )

    with zipfile.ZipFile(
        xlsx
    ) as book:

        ns = (
            "{http://schemas.openxmlformats.org/"
            "spreadsheetml/2006/main}"
        )

        strings = [
            "".join(
                item.itertext()
            )
            for item in ET.fromstring(
                book.read(
                    "xl/sharedStrings.xml"
                )
            )
        ]

        rows = []

        for row in ET.fromstring(
            book.read(
                "xl/worksheets/sheet1.xml"
            )
        ).findall(
            f".//{ns}row"
        ):

            values = []

            for cell in row.findall(
                f"{ns}c"
            ):

                value = cell.find(
                    f"{ns}v"
                )

                if (
                    value is not None
                    and cell.get("t")
                    == "s"
                ):
                    values.append(
                        strings[
                            int(value.text)
                        ]
                    )

                elif value is not None:
                    values.append(
                        value.text
                    )

                else:
                    values.append(
                        ""
                    )

            rows.append(values)

    if not rows:
        return {
            "crops": crops,
            "apmcs": [],
            "districts":
                sorted(
                    MAHARASHTRA_DISTRICTS
                ),
        }

    header = rows[0]
    data = rows[1:]

    name = header.index(
        "apmc_name"
    )

    district = header.index(
        "district"
    )

    apmcs = sorted(
        {
            f"{row[name]} — {row[district]}"
            for row in data
            if len(row) > district
        }
    )

    districts = sorted(
        MAHARASHTRA_DISTRICTS
        | {
            row[district]
            for row in data
            if len(row) > district
        }
    )

    return {
        "crops": crops,
        "apmcs": apmcs,
        "districts": districts,
    }