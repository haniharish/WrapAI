from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.api.routes import router as api_router

app = FastAPI(
    title="WrapAI AI Service",
    description="Dedicated AI/ML processing microservice for speech-to-text, media processing, and transcript generation.",
    version="1.0.0",
    docs_url="/docs" if settings.NODE_ENV != "production" else None,
    redoc_url="/redoc" if settings.NODE_ENV != "production" else None
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global catch-all error handler ensuring standardized JSON error responses.
    """
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred in the AI processing service",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "details": str(exc) if settings.NODE_ENV == "development" else None
            }
        }
    )


# Mount API Routes
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=(settings.NODE_ENV == "development"))
