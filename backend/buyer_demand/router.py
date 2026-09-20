from fastapi import APIRouter, Header, HTTPException

from backend.lot_aggregation.router import _user_id
from .schema import RequirementCreateRequest, RequirementPayload, StatusRequest
from .service import change_status, create_requirement, delete_requirement, get_requirement, list_requirements, update_requirement

router = APIRouter(prefix="/api/buyer-requirements", tags=["Buyer Requirements"])

@router.get("")
def mine(authorization: str = Header(default="")):
    try: return {"requirements": list_requirements(_user_id(authorization))}
    except HTTPException: raise
    except ValueError as exc: raise HTTPException(403, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not load buyer requirements.") from exc

@router.get("/{requirement_id}")
def detail(requirement_id: str, authorization: str = Header(default="")):
    try:
        value = get_requirement(_user_id(authorization), requirement_id)
        if not value: raise HTTPException(404, "Requirement not found.")
        return value
    except HTTPException: raise
    except ValueError as exc: raise HTTPException(403, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not load buyer requirement.") from exc

@router.post("")
def create(payload: RequirementCreateRequest, authorization: str = Header(default="")):
    try: return create_requirement(_user_id(authorization), payload)
    except HTTPException: raise
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not save the requirement.") from exc

@router.put("/{requirement_id}")
def update(requirement_id: str, payload: RequirementPayload, authorization: str = Header(default="")):
    try: return update_requirement(_user_id(authorization), requirement_id, payload)
    except HTTPException: raise
    except LookupError as exc: raise HTTPException(404, str(exc)) from exc
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not save the requirement.") from exc

@router.post("/{requirement_id}/publish")
def publish(requirement_id: str, authorization: str = Header(default="")):
    try: return change_status(_user_id(authorization), requirement_id, "ACTIVE")
    except HTTPException: raise
    except LookupError as exc: raise HTTPException(404, str(exc)) from exc
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not publish the requirement.") from exc

@router.post("/{requirement_id}/status")
def status(requirement_id: str, payload: StatusRequest, authorization: str = Header(default="")):
    try: return change_status(_user_id(authorization), requirement_id, payload.status)
    except HTTPException: raise
    except LookupError as exc: raise HTTPException(404, str(exc)) from exc
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not update the requirement.") from exc

@router.delete("/{requirement_id}")
def delete(requirement_id: str, authorization: str = Header(default="")):
    try:
        delete_requirement(_user_id(authorization), requirement_id)
        return {"deleted": True, "requirement_id": requirement_id}
    except LookupError as exc: raise HTTPException(404, str(exc)) from exc
    except ValueError as exc: raise HTTPException(409, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not delete the requirement.") from exc
