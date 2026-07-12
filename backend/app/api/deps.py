"""Shared FastAPI dependencies: DB session, current user, and RBAC guards."""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

# tokenUrl is only used by the OpenAPI docs "Authorize" button (form-based flow).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=True)

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the JWT, then load the matching active user from the DB."""
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise _credentials_exc
    except jwt.PyJWTError:
        raise _credentials_exc

    user = db.get(User, int(user_id))
    if user is None:
        raise _credentials_exc
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user"
        )
    return user


def require_role(*allowed_roles: UserRole):
    """Dependency factory: allow only the given roles (admin always allowed)."""

    def _guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.ADMIN:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return _guard
