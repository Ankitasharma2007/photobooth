from fastapi import FastAPI
from app.api import session, upload, photos, generate, email
from app.api import download, templates
from app.services.email_worker import start_email_worker
from app.database.db import init_database

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Photobooth API")

@app.on_event("startup")
def startup_event():
    init_database()
    start_email_worker()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(templates.router)
app.include_router(session.router)
app.include_router(upload.router)
app.include_router(photos.router)
app.include_router(generate.router)
app.include_router(download.router)
app.include_router(email.router)

@app.get("/")
def root():
    return {"message": "Photobooth Backend Running"}