from datetime import datetime, timedelta
from typing import Optional
import os
import sys
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

# Load environment variables
load_dotenv()

# Configuration for JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    sys.stderr.write("ERROR: JWT_SECRET_KEY environment variable is not set. This is required for security.\n")
    sys.stderr.write("Please set a strong, unique secret key in your .env file.\n")
    sys.exit(1)

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

# Password hashing
# Use a try-except block to handle bcrypt version compatibility issues
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    # Fallback to a specific bcrypt variant that works without version check
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__ident="2b")

# OAuth2 scheme for token handling
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback direct verification if CryptContext fails
        try:
            from passlib.hash import bcrypt
            return bcrypt.verify(plain_password, hashed_password)
        except Exception as inner_e:
            print(f"Password verification error: {inner_e}")
            return False

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str):
    # Find user by username or email
    user = db.query(models.User).filter(
        (models.User.username == username) | (models.User.email == username)
    ).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False

    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()

    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception

    # Try to find the user by username or email
    user = db.query(models.User).filter(
        (models.User.username == token_data.username) | (models.User.email == token_data.username)
    ).first()

    if user is None:
        raise credentials_exception

    return user

def get_current_active_user(current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
