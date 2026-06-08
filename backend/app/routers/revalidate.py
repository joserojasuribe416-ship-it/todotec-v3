import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["revalidate"])

@router.post("/revalidate-store")
async def revalidate_store():
    store_url = os.getenv("STORE_URL", "").rstrip("/")
    secret = os.getenv("REVALIDATE_SECRET", "")

    if not store_url:
        raise HTTPException(status_code=500, detail="STORE_URL not configured")
    if not secret:
        raise HTTPException(status_code=500, detail="REVALIDATE_SECRET not configured")

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{store_url}/api/revalidate",
                json={"secret": secret},
            )
        if r.status_code == 200:
            return {"ok": True, "message": "Tienda actualizada correctamente"}
        raise HTTPException(status_code=502, detail=f"Store respondió {r.status_code}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"No se pudo conectar con la tienda: {str(e)}")
