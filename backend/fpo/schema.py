from typing import Literal
from pydantic import BaseModel, Field


class ClaimRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    designation: Literal['CEO', 'Managing Director', 'Manager', 'Authorised Representative', 'Other']
    mobile_number: str = Field(min_length=8, max_length=20)
    official_email: str = Field(min_length=5, max_length=254)
    authorised: bool


class MembershipRequest(BaseModel):
    invite_code: str | None = Field(default=None, max_length=64)
    aarth_id: str | None = Field(default=None, max_length=64)


class StaffInviteRequest(BaseModel):
    user_id: str
    role: Literal['FPO_ADMIN', 'OPERATIONS_MANAGER', 'FIELD_COORDINATOR', 'FINANCE']


class StaffRoleRequest(BaseModel):
    role: Literal['FPO_ADMIN', 'OPERATIONS_MANAGER', 'FIELD_COORDINATOR', 'FINANCE']


class OrganisationUpdate(BaseModel):
    organisation_type: str | None = None
    district: str | None = None
    taluka: str | None = None
    village: str | None = None
    address: str | None = None
    crops: list[str] | None = None


class StaffStatusRequest(BaseModel):
    status: Literal['ACTIVE', 'INACTIVE']


class SourceFpoIngest(BaseModel):
    fpo_name: str = Field(min_length=2, max_length=200)
    organisation_type: str | None = None
    registration_number: str | None = None
    district: str | None = None
    taluka: str | None = None
    village: str | None = None
    address: str | None = None
    crops: list[str] = Field(default_factory=list)
    source: str = Field(min_length=2, max_length=100)
    source_record_id: str = Field(min_length=1, max_length=200)
    last_source_sync: str | None = None
