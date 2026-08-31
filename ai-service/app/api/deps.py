from fastapi import Header, HTTPException, status
from typing import Optional
from app.core.config import settings


async def verify_internal_api_key(
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
    authorization: Optional[str] = Header(default=None)
):
    """
    Validates internal service credentials provided via X-Internal-API-Key header
    or Authorization Bearer token header.
    """
    provided_key = x_internal_api_key

    if not provided_key and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            provided_key = parts[1]

    if not provided_key or provided_key != settings.AI_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED_SERVICE",
                "message": "Invalid or missing internal service API key"
            }
        )

    return True
