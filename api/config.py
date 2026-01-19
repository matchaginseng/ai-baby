import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    DATABASE_URL = os.getenv('DATABASE_URL')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    MAX_CONTENT_LENGTH = 1 * 1024 * 1024  # 1MB max file size
    UPLOAD_FOLDER = 'uploads'
