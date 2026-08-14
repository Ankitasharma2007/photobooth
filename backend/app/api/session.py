from fastapi import APIRouter
from app.services.session_service import create_session

router = APIRouter()


@router.post("/session")
def new_session():
    session = create_session()

    return {
        "sessionId": session.sessionId,
        "status": session.status,
        "createdAt": session.createdAt
    }