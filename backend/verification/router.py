import os, re
import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from backend.lot_aggregation.router import _user_id
from backend.auth.service import profile_for_user

router = APIRouter(prefix="/api/verification", tags=["Business Verification"])
PATTERN = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$")
CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
class GSTINRequest(BaseModel): gstin: str
def normalize(value): return value.strip().replace(" ", "").replace("-", "").upper()
def valid(value):
    value=normalize(value)
    if not PATTERN.fullmatch(value): return False, "Invalid GSTIN format."
    total=0
    for i,ch in enumerate(value[:14]):
        n=CHARSET.index(ch); total += n*(1 if i%2==0 else 2) if n<18 or i%2==0 else (n*2-36)
    return CHARSET[(36-(total%36))%36]==value[14], "GSTIN checksum is invalid."
@router.post("/gstin")
async def gstin(payload: GSTINRequest, authorization: str = Header(default="")):
    user_id=_user_id(authorization); profile=profile_for_user(user_id)
    if not profile or profile.get("role") != "LOGISTICS_PARTNER": raise HTTPException(403,"Only a logistics partner can verify its GSTIN.")
    value=normalize(payload.gstin); ok,message=valid(value)
    if not ok: return {"success":False,"verification_status":"INVALID_GSTIN","message":message}
    key=os.getenv("GSTIN_API_KEY","")
    if not key: return {"success":False,"verification_status":"API_NOT_CONFIGURED","message":"GST verification service is not configured."}
    try:
        async with httpx.AsyncClient(timeout=15) as client: response=await client.get(f"https://www.gstinapi.in/v1/gstin/{value}",headers={"x-api-key":key})
    except httpx.TimeoutException: return {"success":False,"verification_status":"TIMEOUT","message":"GST verification service timed out."}
    except httpx.RequestError: return {"success":False,"verification_status":"PROVIDER_UNAVAILABLE","message":"GST verification service is currently unavailable."}
    if response.status_code==401: return {"success":False,"verification_status":"API_AUTH_ERROR","message":"GST verification API authentication failed."}
    if response.status_code==429: return {"success":False,"verification_status":"RATE_LIMITED","message":"GST verification rate limit reached. Please try again later."}
    if response.status_code==402: return {"success":False,"verification_status":"CREDITS_EXHAUSTED","message":"GST verification credits are exhausted."}
    try: body=response.json()
    except ValueError: return {"success":False,"verification_status":"INVALID_PROVIDER_RESPONSE","message":"Invalid response received from GST provider."}
    data=body.get("data") or body.get("result") or body
    if not response.is_success or body.get("success") is False: return {"success":False,"verification_status":"NOT_VERIFIED","message":body.get("error") or body.get("message") or "GSTIN could not be verified."}
    return {"success":True,"verification_status":"LIVE_VERIFIED","gstin":data.get("gstin",value),"legal_name":data.get("legal_name") or data.get("lgnm"),"trade_name":data.get("trade_name") or data.get("tradeNam"),"registration_status":data.get("status")}
