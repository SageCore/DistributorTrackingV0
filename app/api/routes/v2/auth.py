from fastapi import APIRouter, HTTPException, status
from app.schemas.v2 import AuthResponse, LoginRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["V2 Auth"])


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """Admin login endpoint."""
    if not body.username or not body.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required.",
        )
    return AuthResponse(
        token=f"v2-auth-token-{body.username}",
        user=UserResponse(
            id="usr-admin-1",
            username=body.username,
            name=body.username.split("@")[0].title() if "@" in body.username else body.username.title(),
            email=body.username if "@" in body.username else f"{body.username}@distributor.com",
            role="DISTRIBUTOR_ADMIN",
            distributor_name="Al-Rehman Distribution",
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Get current authenticated user info."""
    return UserResponse(
        id="usr-admin-1",
        username="admin@distributor.com",
        name="Administrator",
        email="admin@distributor.com",
        role="DISTRIBUTOR_ADMIN",
        distributor_name="Al-Rehman Distribution",
    )
