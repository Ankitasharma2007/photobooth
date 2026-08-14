from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PhotoModel(BaseModel):
    id: str
    filename: str
    uploadedAt: datetime


class SessionModel(BaseModel):
    sessionId: str
    status: str = "active"
    layout: Optional[str] = None
    frame: Optional[str] = None
    photos: List[PhotoModel] = []
    createdAt: datetime