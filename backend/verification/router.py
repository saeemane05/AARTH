import os, re
import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from backend.lot_aggregation.router import _user_id
from backend.auth.service import profile_for_user, update_profile

router = APIRouter(prefix="/api/verification", tags=["Business Verification"])
PATTERN = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$")
CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
class GSTINRequest(BaseModel): gstin: str
def normalize(value): return value.strip().replace(" ", "").replace("-", "").upper()
def valid(value):
    value=normalize(value)
    if len(value) != 15 or not PATTERN.fullmatch(value): return False, "FORMAT_INVALID", "Invalid GSTIN format."
    total=0
    for i,ch in enumerate(value[:14]):
        n=CHARSET.index(ch)
        product=n*(1 if i%2==0 else 2)
        total += (product // 36) + (product % 36)
    if CHARSET[(36-(total%36))%36] != value[14]:
        return False, "CHECKSUM_INVALID", "GSTIN checksum is invalid."
    return True, "FORMAT", "GSTIN format and checksum are valid."
@router.post("/gstin")
async def gstin(payload: GSTINRequest, authorization: str = Header(default="")):
    user_id=_user_id(authorization); profile=profile_for_user(user_id)
    if not profile or profile.get("role") not in {"LOGISTICS_PARTNER", "BUYER"}: raise HTTPException(403,"Only a buyer or logistics partner can verify its GSTIN.")
    value=normalize(payload.gstin); ok,status,message=valid(value)
    if not ok: return {"success":False,"verification_status":status,"message":message}
    key=os.getenv("GSTIN_API_KEY","")
    if not key: return {"success":False,"verification_status":"API_NOT_CONFIGURED","message":"GST verification service is not configured."}
    try:
        async with httpx.AsyncClient(timeout=15) as client: response=await client.get(f"https://www.gstinapi.in/v1/gstin/{value}",headers={"x-api-key":key})
    except httpx.TimeoutException: return {"success":False,"verification_status":"TIMEOUT","message":"GST verification service timed out."}
    except httpx.RequestError: return {"success":False,"verification_status":"PROVIDER_UNAVAILABLE","message":"GST verification service is currently unavailable."}
    if response.status_code==401: return {"success":False,"verification_status":"API_AUTH_ERROR","message":"GST verification API authentication failed."}
    if response.status_code==429: return {"success":False,"verification_status":"RATE_LIMITED","message":"GST verification rate limit reached. Please try again later."}
    if response.status_code==402: return {"success":False,"verification_status":"CREDITS_EXHAUSTED","message":"GST verification credits are exhausted."}
    if response.status_code==502: return {"success":False,"verification_status":"PROVIDER_UNAVAILABLE","message":"GST provider is temporarily unavailable."}
    if response.status_code >= 500: return {"success":False,"verification_status":"PROVIDER_UNAVAILABLE","message":"GST provider is temporarily unavailable."}
    try: body=response.json()
    except ValueError: return {"success":False,"verification_status":"INVALID_PROVIDER_RESPONSE","message":"Invalid response received from GST provider."}
    data=body.get("data") or body.get("result") or body
    if not response.is_success or body.get("success") is False: return {"success":False,"verification_status":"NOT_VERIFIED","message":body.get("error") or body.get("message") or "GSTIN could not be verified."}
    result = {"success":True,"verification_status":"LIVE_VERIFIED","gstin":data.get("gstin",value),"legal_name":data.get("legal_name") or data.get("lgnm"),"trade_name":data.get("trade_name") or data.get("tradeNam"),"registration_status":data.get("status"),"taxpayer_type":data.get("taxpayer_type") or data.get("dty"),"registered_state":data.get("state") or data.get("state_name"),"registration_date":data.get("registration_date") or data.get("rgdt")}
    update_profile(user_id, {"gstin": result["gstin"], "verification_status": "GSTIN_VERIFIED", "gstin_status": "VERIFIED", "gstin_legal_name": result["legal_name"], "gstin_trade_name": result["trade_name"], "gstin_registration_status": result["registration_status"], "gstin_taxpayer_type": result["taxpayer_type"], "gstin_registered_state": result["registered_state"], "gstin_registration_date": result["registration_date"], "gstin_verified_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(), "gstin_verification_provider": "gstinapi.in"})
    return result
