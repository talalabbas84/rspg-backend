# (Content from previous response - unchanged and correct)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.api.routes import (
    auth, sequences, blocks, variables, global_lists, engine, runs
)
# For Alembic auto-generation, ensure models are imported somewhere Base can see them
from app.db import base as db_base # To ensure Base.metadata is populated
from app.models import User, Sequence, Block, Variable, GlobalList, GlobalListItem, Run, BlockRun # Explicitly import models

# Setup logging
logging.basicConfig(level=logging.INFO if settings.ENVIRONMENT == "prod" else logging.DEBUG)
logger = logging.getLogger(__name__)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="0.1.0",
    description="Backend for MPSG AI Sequence Generator"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip() for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    logger.warning("CORS origins not configured. API might not be accessible from frontend.")


# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(sequences.router, prefix=f"{settings.API_V1_STR}/sequences", tags=["Sequences"])
app.include_router(blocks.router, prefix=f"{settings.API_V1_STR}/blocks", tags=["Blocks"])
app.include_router(variables.router, prefix=f"{settings.API_V1_STR}/variables", tags=["Variables"])
app.include_router(global_lists.router, prefix=f"{settings.API_V1_STR}/global-lists", tags=["Global Lists"])
app.include_router(engine.router, prefix=f"{settings.API_V1_STR}/engine", tags=["Execution Engine Utilities"])
app.include_router(runs.router, prefix=f"{settings.API_V1_STR}/runs", tags=["Runs & Execution History"])


@app.get(f"{settings.API_V1_STR}/healthcheck", tags=["Health Check"])
async def healthcheck():
    """Basic health check endpoint."""
    # Could add a DB ping here for a more comprehensive health check
    return {"status": "ok", "project_name": settings.PROJECT_NAME, "environment": settings.ENVIRONMENT}

# Optional: Add startup event for DB connection test or other init tasks
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup...")
    try:
        from app.db.session import engine as db_engine # Renamed to avoid conflict
        async with db_engine.connect() as connection:
            logger.info("Database connection successful.")
    except Exception as e:
        logger.error(f"Database connection failed on startup: {e}")

if __name__ == "__main__":
    import uvicorn
    # This is for direct execution (e.g. python app/main.py)
    # Production usually uses Gunicorn + Uvicorn workers.
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
