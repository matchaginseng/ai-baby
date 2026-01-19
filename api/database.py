import psycopg2
from psycopg2.extras import RealDictCursor
from api.config import Config
from contextlib import contextmanager

def get_db_connection():
    """Create a database connection"""
    return psycopg2.connect(Config.DATABASE_URL, cursor_factory=RealDictCursor)

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    """Initialize database tables"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                selected_baby_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Questionnaires table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questionnaires (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                answers JSONB DEFAULT '{}',
                image_paths TEXT[],
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            )
        ''')

        # Babies table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS babies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                age VARCHAR(50) NOT NULL,
                attributes TEXT[] NOT NULL,
                image_path VARCHAR(500),
                is_visible BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Chat messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                baby_id INTEGER REFERENCES babies(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Chat sessions tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                baby_id INTEGER REFERENCES babies(id) ON DELETE CASCADE,
                message_count INTEGER DEFAULT 0,
                UNIQUE(user_id, baby_id)
            )
        ''')

        conn.commit()
        print("Database tables created successfully!")
