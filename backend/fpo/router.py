import secrets

from fastapi import APIRouter, Header, HTTPException

from .schema import (
    ClaimRequest,
    MembershipRequest,
    StaffInviteRequest,
    StaffRoleRequest,
    StaffStatusRequest,
    OrganisationUpdate,
    SourceFpoIngest,
)

from .service import (
    current_profile,
    get_fpo,
    public_fpo,
    my_fpo,
    authorised,
    update_fpo,
    staff_role,
    membership_summary,
    membership_views,
    invite,
    invite_record,
    resolve_farmer,
    farmer_by_aarth_id,
    profile_completion,
    now,
    MANAGE_ORG,
    MANAGE_MEMBERS,
    STAFF_ROLES,
)

from backend.auth.service import _client, _new_role_id, profile_for_user


router = APIRouter(
    prefix="",
    tags=["FPO foundation"],
)


def token(header: str) -> str:
    if not header.lower().startswith("bearer "):
        raise HTTPException(
            401,
            "Authentication required.",
        )

    return header[7:].strip()


# =========================================================
# PUBLIC FPO DIRECTORY
# =========================================================

@router.get("/fpos")
def list_fpos(
    search: str = "",
    district: str = "",
    taluka: str = "",
    crop: str = "",
):
    rows = (
        _client(admin=True)
        .table("fpos")
        .select("*")
        .execute()
        .data
        or []
    )

    def matches(row):
        p = public_fpo(row)

        needle = search.lower()

        return (
            (
                not needle
                or needle in p["fpo_name"].lower()
            )
            and (
                not district
                or p["district"] == district
            )
            and (
                not taluka
                or p["taluka"] == taluka
            )
            and (
                not crop
                or crop.lower()
                in [
                    str(x).lower()
                    for x in p["crops"]
                ]
            )
        )

    return {
        "items": [
            public_fpo(row)
            for row in rows
            if matches(row)
        ]
    }


@router.get("/fpos/{fpo_id}")
def fpo_detail(
    fpo_id: str,
):
    return public_fpo(
        get_fpo(fpo_id)
    )


# =========================================================
# ADMIN FPO INGESTION
# =========================================================

@router.post("/fpos/ingest")
def ingest_fpo(
    payload: SourceFpoIngest,
    authorization: str = Header(default=""),
):
    """
    Administrator-only ingestion point for permitted
    official/public source exports.

    This endpoint does not scrape or bypass external
    sources.
    """

    profile = current_profile(
        token(authorization)
    )

    if profile.get("role") != "ADMIN":
        raise HTTPException(
            403,
            "Administrator access required.",
        )

    rows = (
        _client(admin=True)
        .table("fpos")
        .select("*")
        .execute()
        .data
        or []
    )

    existing = next(
        (
            row
            for row in rows
            if (
                row.get("source_data") or {}
            ).get("source")
            == payload.source
            and (
                row.get("source_data") or {}
            ).get("record_id")
            == payload.source_record_id
        ),
        None,
    )

    source_data = {
        "source": payload.source,
        "record_id": payload.source_record_id,
        "last_source_sync": payload.last_source_sync,
    }

    record = (
        payload.model_dump(
            exclude={
                "source",
                "source_record_id",
                "last_source_sync",
            }
        )
        | {
            "source_data": source_data,
            "activation_status": "GOVERNMENT_LISTED",
            "claim_status": "UNCLAIMED",
            "verification_status": "SOURCE_LISTED",
        }
    )

    admin = _client(admin=True)

    if existing:
        return public_fpo(
            update_fpo(
                existing["id"],
                record,
            )
        )

    record.update(
        {
            "fpo_id": _new_role_id("FPO"),
            "status": "ACTIVE",
        }
    )

    created = (
        admin
        .table("fpos")
        .insert(record)
        .execute()
        .data[0]
    )

    return public_fpo(created)


# =========================================================
# FPO CLAIM
# =========================================================

@router.post("/fpos/{fpo_id}/claim")
def claim_fpo(
    fpo_id: str,
    payload: ClaimRequest,
    authorization: str = Header(default=""),
):
    if not payload.authorised:
        raise HTTPException(
            400,
            "Authorisation confirmation is required.",
        )

    profile = current_profile(
        token(authorization)
    )

    row = get_fpo(fpo_id)

    if profile.get("role") != "FPO":
        raise HTTPException(
            403,
            "Claim an organisation using an FPO AARTH account.",
        )

    if row.get("claim_status") not in {
        "UNCLAIMED",
        "REJECTED",
    }:
        raise HTTPException(
            409,
            "This organisation already has a claim in progress.",
        )

    claim = {
        "representative_user_id": profile["user_id"],
        "full_name": payload.full_name,
        "designation": payload.designation,
        "mobile_number": payload.mobile_number,
        "official_email": str(
            payload.official_email
        ),
        "submitted_at": now(),
        "status": "PENDING",
    }

    # The temporary FPO identity record created during
    # registration is merged into the selected master
    # organisation instead of creating a duplicate FPO.
    identity = (
        _client(admin=True)
        .table("fpos")
        .select("*")
        .eq("profile_id", profile["id"])
        .maybe_single()
        .execute()
        .data
    )

    if identity and identity["id"] != row["id"]:

        if identity.get("fpo_name"):
            raise HTTPException(
                409,
                "This FPO account is already linked to an organisation.",
            )

        (
            _client(admin=True)
            .table("fpos")
            .delete()
            .eq("id", identity["id"])
            .execute()
        )

    update_fpo(
        fpo_id,
        {
            "profile_id": profile["id"],
            "user_id": profile["user_id"],
            "username": profile["username"],
            "claim_data": claim,
            "claim_status": "PENDING",
            "activation_status": "PENDING_VERIFICATION",
        },
    )

    return {
        "success": True,
        "status": "PENDING_VERIFICATION",
    }


# =========================================================
# ADMIN CLAIMS
# =========================================================

@router.get("/fpo/claims")
def claims(
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    if profile.get("role") != "ADMIN":
        raise HTTPException(
            403,
            "Administrator access required.",
        )

    rows = (
        _client(admin=True)
        .table("fpos")
        .select("*")
        .eq("claim_status", "PENDING")
        .execute()
        .data
        or []
    )

    return {
        "items": [
            public_fpo(row)
            for row in rows
        ]
    }


@router.post("/fpo/claims/{fpo_id}/verify")
def verify_claim(
    fpo_id: str,
    approved: bool = True,
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    if profile.get("role") != "ADMIN":
        raise HTTPException(
            403,
            "Administrator access required.",
        )

    row = get_fpo(fpo_id)

    if row.get("claim_status") != "PENDING":
        raise HTTPException(
            409,
            "No pending claim exists for this organisation.",
        )

    claim = row.get("claim_data") or {}
    verification = (
        row.get("verification_data")
        or {}
    )

    claim.update(
        {
            "status": (
                "APPROVED"
                if approved
                else "REJECTED"
            ),
            "reviewed_at": now(),
            "reviewed_by": profile["user_id"],
        }
    )

    patch = {
        "claim_data": claim,
        "claim_status": claim["status"],
    }

    if approved:

        verification.update(
            {
                "organisation_details_verified": True,
                "representative_verified": True,
                "last_verified": now(),
            }
        )

        staff = (
            row.get("staff_data")
            or []
        )

        if not any(
            member.get("user_id")
            == row.get("user_id")
            for member in staff
        ):
            staff.append(
                {
                    "user_id": row.get(
                        "user_id"
                    ),
                    "role": "FPO_ADMIN",
                    "status": "ACTIVE",
                    "added_at": now(),
                    "added_by": profile[
                        "user_id"
                    ],
                }
            )

        patch.update(
            {
                "activation_status": "ACTIVATED",
                "verification_status": "AARTH_VERIFIED",
                "primary_admin_user_id": row.get(
                    "user_id"
                ),
                "verification_data": verification,
                "staff_data": staff,
            }
        )

    else:
        patch[
            "activation_status"
        ] = "GOVERNMENT_LISTED"

    return public_fpo(
        update_fpo(
            fpo_id,
            patch,
        )
    )


# =========================================================
# CURRENT FPO ORGANISATION
# =========================================================

@router.get("/fpo/me")
def get_my_fpo(
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    row = my_fpo(profile)

    return {
        **public_fpo(row),
        "staff_role": staff_role(
            row,
            profile["user_id"],
        ),
        "profile_completion": profile_completion(row),
    }


# =========================================================
# FPO DASHBOARD
# =========================================================

@router.get("/fpo/dashboard")
def dashboard(
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    row = my_fpo(profile)

    view = public_fpo(row)

    # A newly registered FPO account may not have
    # claimed a government-listed master record yet.
    # In that case, use the existing profile identity
    # without creating a duplicate organisation.
    profile_name = (
        profile.get("profile_data")
        or {}
    ).get("fpo_name")

    if (
        not view.get("fpo_name")
        or view.get("fpo_name")
        == "Unnamed FPO"
    ):
        view["fpo_name"] = (
            profile_name
            or profile.get("username")
            or "FPO"
        )

    staff = (
        row.get("staff_data")
        or []
    )

    unique_staff = {
        item.get("user_id")
        for item in staff
        if item.get("user_id")
    }

    if row.get("primary_admin_user_id"):
        unique_staff.add(
            row["primary_admin_user_id"]
        )

    if row.get("user_id"):
        unique_staff.add(row["user_id"])

    return {
        **view,
        "summary": membership_summary(
            row
        ),
        "staff_count": len(
            unique_staff
        ),
        "verification": (
            row.get("verification_data")
            or {}
        ),
        "staff_role": staff_role(
            row,
            profile["user_id"],
        ),
    }


# =========================================================
# ORGANISATION
# =========================================================

@router.get("/fpo/organisation")
def organisation(
    authorization: str = Header(default=""),
):
    profile = current_profile(token(authorization))
    row = my_fpo(profile)
    view = public_fpo(row)
    return {
        **view,
        "staff_role": staff_role(row, profile["user_id"]),
        "profile_completion": profile_completion(row),
    }


@router.patch("/fpo/organisation")
def update_organisation(
    payload: OrganisationUpdate,
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    row = my_fpo(profile)

    authorised(
        row,
        profile["user_id"],
        MANAGE_ORG,
    )

    patch = {
        key: value
        for key, value
        in payload.model_dump().items()
        if value is not None
    }

    return public_fpo(
        update_fpo(
            row["id"],
            patch,
        )
    )


# =========================================================
# FARMER MEMBERSHIP NETWORK
# =========================================================

@router.get("/fpo/members")
def members(
    search: str = "",
    district: str = "",
    taluka: str = "",
    village: str = "",
    crop: str = "",
    status: str = "",
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    row = my_fpo(profile)

    authorised(
        row,
        profile["user_id"],
        MANAGE_MEMBERS
        | {"FIELD_COORDINATOR"},
    )

    result = membership_views(row)
    search_text = search.strip().lower()
    result = [
        item
        for item in result
        if (
            not search_text
            or search_text in str(item.get("full_name") or "").lower()
            or search_text in str(item.get("aarth_id") or "").lower()
        )
        and (not district or item.get("district") == district)
        and (not taluka or item.get("taluka") == taluka)
        and (not village or item.get("village") == village)
        and (not crop or crop.lower() in [
            str(value).lower() for value in (item.get("crops") or [])
        ])
        and (not status or item.get("status") == status)
    ]

    return {
        "summary": membership_summary(
            row
        ),
        "items": result,
    }


@router.get("/fpo/invites/{code}")
def invite_details(code: str):
    rows = (
        _client(admin=True)
        .table("fpos")
        .select("*")
        .execute()
        .data
        or []
    )

    for row in rows:
        try:
            invite_item = invite_record(row, code)
        except HTTPException:
            continue

        return {
            "code": invite_item["code"],
            "fpo_id": row["id"],
            "fpo": public_fpo(row),
            "expires_at": invite_item.get("expires_at"),
            "remaining_uses": max(
                0,
                invite_item.get("max_usage", 1)
                - invite_item.get("usage_count", 0),
            ),
        }

    raise HTTPException(404, "Invite code is invalid or inactive.")


@router.get("/fpo/farmers/{membership_id}")
def farmer_detail(
    membership_id: str,
    authorization: str = Header(default=""),
):
    profile = current_profile(token(authorization))
    row = my_fpo(profile)
    authorised(
        row,
        profile["user_id"],
        MANAGE_MEMBERS | {"FIELD_COORDINATOR"},
    )

    membership = next(
        (
            item
            for item in (row.get("membership_data") or [])
            if item.get("id") == membership_id
        ),
        None,
    )
    if not membership:
        raise HTTPException(404, "Farmer membership not found.")

    farmer_profile = profile_for_user(membership.get("farmer_user_id"))
    if not farmer_profile or farmer_profile.get("role") != "FARMER":
        raise HTTPException(404, "Farmer profile is no longer available.")

    data = farmer_profile.get("profile_data") or {}
    return {
        "membership_id": membership["id"],
        "farmer_user_id": membership.get("farmer_user_id"),
        "aarth_id": farmer_profile.get("role_id") or farmer_profile.get("aarth_id"),
        "full_name": data.get("full_name") or farmer_profile.get("username"),
        "district": data.get("district"),
        "taluka": data.get("taluka"),
        "village": data.get("village"),
        "crops": data.get("crops_grown") or [],
        "land_size": data.get("land_size"),
        "status": membership.get("status"),
        "requested_at": membership.get("requested_at"),
        "approved_at": membership.get("approved_at"),
    }


@router.get("/fpo/membership")
def farmer_membership(
    authorization: str = Header(default=""),
):
    profile = current_profile(token(authorization))
    farmer = resolve_farmer(profile)
    user_id = farmer["profile"]["user_id"]
    rows = _client(admin=True).table("fpos").select("*").execute().data or []
    memberships = []
    for row in rows:
        for item in row.get("membership_data") or []:
            if item.get("farmer_user_id") == user_id:
                memberships.append({
                    "fpo": public_fpo(row),
                    "membership": item,
                })
    return {"items": memberships}


@router.post("/fpo/members/request")
def request_membership(
    payload: MembershipRequest,
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    farmer_identity = resolve_farmer(profile)

    if payload.aarth_id:
        requested_identity = farmer_by_aarth_id(payload.aarth_id)
        if requested_identity["profile"]["user_id"] != profile["user_id"]:
            raise HTTPException(
                403,
                "The AARTH ID must belong to the authenticated Farmer account.",
            )

    rows = (
        _client(admin=True)
        .table("fpos")
        .select("*")
        .execute()
        .data
        or []
    )

    row = None
    invite_item = None
    for candidate in rows:
        try:
            invite_item = invite_record(candidate, payload.invite_code or "")
            row = candidate
            break
        except HTTPException:
            continue

    if not row:
        raise HTTPException(
            404,
            "Invite code is invalid or inactive.",
        )

    memberships = (
        row.get("membership_data")
        or []
    )

    if any(
        x.get("farmer_user_id")
        == profile["user_id"]
        and x.get("status")
        in {"PENDING", "ACTIVE"}
        for x in memberships
    ):
        raise HTTPException(
            409,
            "You already have a membership request for this FPO.",
        )

    memberships.append(
        {
            "id": secrets.token_hex(8),
            "farmer_user_id": profile[
                "user_id"
            ],
            "status": "PENDING",
            "requested_at": now(),
            "source": "INVITATION",
            "invite_code": invite_item["code"],
        }
    )

    invite_item["usage_count"] = invite_item.get("usage_count", 0) + 1
    if invite_item["usage_count"] >= invite_item.get("max_usage", 1):
        invite_item["status"] = "EXHAUSTED"

    update_fpo(
        row["id"],
        {
            "membership_data": memberships,
            "invite_data": row.get("invite_data") or [],
        },
    )

    return {
        "success": True,
        "status": "PENDING",
    }


# =========================================================
# FARMER INVITATION
# =========================================================

@router.post("/fpo/members/invite")
def create_invite(
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    return invite(
        my_fpo(profile),
        profile["user_id"],
    )


# =========================================================
# MEMBERSHIP DECISION
# =========================================================

@router.patch(
    "/fpo/members/{membership_id}/{decision}"
)
def decide_member(
    membership_id: str,
    decision: str,
    authorization: str = Header(default=""),
):
    if decision not in {
        "approve",
        "reject",
    }:
        raise HTTPException(
            404,
            "Unknown membership action.",
        )

    profile = current_profile(
        token(authorization)
    )

    row = my_fpo(profile)

    authorised(
        row,
        profile["user_id"],
        MANAGE_MEMBERS,
    )

    items = (
        row.get("membership_data")
        or []
    )

    member = next(
        (
            x
            for x in items
            if x.get("id")
            == membership_id
        ),
        None,
    )

    if not member:
        raise HTTPException(
            404,
            "Membership request not found.",
        )

    if member.get("status") != "PENDING":
        raise HTTPException(
            409,
            "Only pending membership requests can be reviewed.",
        )

    if decision == "approve":
        resolve_farmer(
            profile_for_user(member.get("farmer_user_id"))
        )

    member.update(
        {
            "status": (
                "ACTIVE"
                if decision == "approve"
                else "REJECTED"
            ),
        }
    )

    if decision == "approve":
        member.update(
            {
                "approved_at": now(),
                "approved_by": profile["user_id"],
            }
        )
    else:
        member.update(
            {
                "rejected_at": now(),
                "rejected_by": profile["user_id"],
            }
        )

    update_fpo(
        row["id"],
        {
            "membership_data": items
        },
    )

    return {
        "success": True,
        "status": member["status"],
    }


# =========================================================
# STAFF
# =========================================================

@router.get("/fpo/staff")
def staff(
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    row = my_fpo(profile)

    authorised(
        row,
        profile["user_id"],
        MANAGE_ORG,
    )

    return {
        "items": (
            row.get("staff_data")
            or []
        )
    }


@router.post("/fpo/staff/invite")
def add_staff(
    payload: StaffInviteRequest,
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    row = my_fpo(profile)

    authorised(
        row,
        profile["user_id"],
        MANAGE_ORG,
    )

    staff_profile = profile_for_user(payload.user_id)
    if not staff_profile or staff_profile.get("status") != "ACTIVE":
        raise HTTPException(
            404,
            "Only an active AARTH account can receive staff access.",
        )

    staff = (
        row.get("staff_data")
        or []
    )

    if any(
        x.get("user_id")
        == payload.user_id
        for x in staff
    ):
        raise HTTPException(
            409,
            "User is already staff.",
        )

    staff.append(
        {
            "user_id": payload.user_id,
            "role": payload.role,
            "status": "ACTIVE",
            "added_at": now(),
            "added_by": profile[
                "user_id"
            ],
        }
    )

    update_fpo(
        row["id"],
        {
            "staff_data": staff
        },
    )

    return {
        "success": True
    }


@router.patch("/fpo/staff/{user_id}/status")
def change_staff_status(
    user_id: str,
    payload: StaffStatusRequest,
    authorization: str = Header(default=""),
):
    profile = current_profile(token(authorization))
    row = my_fpo(profile)
    authorised(row, profile["user_id"], MANAGE_ORG)

    staff = row.get("staff_data") or []
    person = next((item for item in staff if item.get("user_id") == user_id), None)
    if not person:
        raise HTTPException(404, "Staff member not found.")

    person["status"] = payload.status
    update_fpo(row["id"], {"staff_data": staff})
    return {"success": True, "status": payload.status}


@router.patch(
    "/fpo/staff/{user_id}/role"
)
def change_staff_role(
    user_id: str,
    payload: StaffRoleRequest,
    authorization: str = Header(default=""),
):
    profile = current_profile(
        token(authorization)
    )

    row = my_fpo(profile)

    authorised(
        row,
        profile["user_id"],
        MANAGE_ORG,
    )

    staff = (
        row.get("staff_data")
        or []
    )

    person = next(
        (
            x
            for x in staff
            if x.get("user_id")
            == user_id
        ),
        None,
    )

    if not person:
        raise HTTPException(
            404,
            "Staff member not found.",
        )

    person["role"] = payload.role

    update_fpo(
        row["id"],
        {
            "staff_data": staff
        },
    )

    return {
        "success": True
    }