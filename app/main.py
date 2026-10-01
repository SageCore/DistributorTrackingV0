from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_v0_router, api_v2_router, health_router
from app.core.config import settings
from app.core.logging import logger
from app.schemas.common import RootResponse
from app.db.session import async_session_factory
from app.db.seed import seed_v2_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for FastAPI application."""
    logger.info(f"Starting {settings.APP_NAME} in environment '{settings.APP_ENV}'")
    try:
        async with async_session_factory() as session:
            await seed_v2_data(session)
    except Exception as e:
        logger.warning(f"Initial V2 seed check skipped or handled: {e}")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    description="Distributor GPS Tracking Backend API (V0 & V2)",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS for local development and authorized web origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=settings.DEBUG)
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal Server Error", "error": str(exc)},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred."},
    )


# Include health router (public)
app.include_router(health_router)

# Include API v0 endpoints
app.include_router(api_v0_router)

# Include API v2 endpoints
app.include_router(api_v2_router)


@app.get("/", response_model=RootResponse, tags=["Root"])
async def root():
    """Root endpoint returning service identity."""
    return RootResponse(name=settings.APP_NAME, version="0")
