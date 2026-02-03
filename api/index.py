from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .database import init_db
from .auth import auth_bp
from .questionnaire import questionnaire_bp
from .babies import babies_bp
from .chat import chat_bp
from .settings import settings_bp
import os

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize JWT
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(questionnaire_bp, url_prefix='/api')
app.register_blueprint(babies_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(settings_bp, url_prefix='/api')

# Serve uploaded files
@app.route('/api/uploads/<path:filename>')
def serve_upload(filename):
    upload_dir = os.path.join(os.path.dirname(__file__), '..', Config.UPLOAD_FOLDER)
    return send_from_directory(upload_dir, filename)

@app.route("/api/health")
def health():
    return {"status": "ok"}

@app.route("/api/init-db")
def initialize_database():
    try:
        init_db()
        return {"message": "Database initialized successfully"}
    except Exception as e:
        return {"error": str(e)}, 500

# Export for Vercel
handler = app

if __name__ == '__main__':
    app.run(debug=True)