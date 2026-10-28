from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base
from .seed_data import seed_database
from .routes import students, sessions, attendance, analytics, recommendations, cv_audio, reports, privacy


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created and seeded
    Base.metadata.create_all(bind=engine)
    seed_database(force=False)
    yield


app = FastAPI(
    title="Multimodal Attendance & Engagement Agent API",
    description="Privacy-Preserving Intelligent Classroom Analytics Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(students.router)
app.include_router(sessions.router)
app.include_router(attendance.router)
app.include_router(analytics.router)
app.include_router(recommendations.router)
app.include_router(cv_audio.router)
app.include_router(reports.router)
app.include_router(privacy.router)


@app.get("/")
def root():
    return {
        "system": "Multimodal Attendance & Engagement Agent",
        "status": "online",
        "mode": "privacy_preserving_offline_local",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
