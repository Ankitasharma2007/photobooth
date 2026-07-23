from fastapi import FastAPI
from app.api import session, upload, photos, generate
from app.api import download

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Photobooth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(upload.router)
app.include_router(photos.router)
app.include_router(generate.router)
app.include_router(download.router)

@app.get("/")
def root():
    return {"message": "Photobooth Backend Running"}