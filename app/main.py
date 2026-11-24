"""
MediExtract AI — FastAPI Application Entry Point.
Deterministic Local Clinical NLP Engine — 100% local, zero external APIs, zero DLL dependencies.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router

# ──────────────────────────────────────────────────────────────
# App Configuration
# ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="MediExtract AI",
    description=(
        "Deterministic Local Clinical NLP Engine — "
        "100% local, zero-DLL, rule-based medical entity extraction."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",  # Local development flexibility
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handler ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {type(exc).__name__}: {str(exc)}",
            "path": str(request.url),
        },
    )


# ── Include API Router ──
app.include_router(router)


# ── Root Info Endpoint ──
@app.get("/", include_in_schema=False)
async def root():
    return {
        "app": "MediExtract AI",
        "version": "1.0.0",
        "engine": "local-rule-based-nlp",
        "docs": "/docs",
        "health": "/api/health",
        "disclaimer": "Rule-based extraction for demonstration. Not for clinical use.",
    }
