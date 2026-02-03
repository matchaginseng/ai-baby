from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from .database import get_db
from .config import Config
import os
import base64
from PIL import Image
from io import BytesIO

questionnaire_bp = Blueprint('questionnaire', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@questionnaire_bp.route('/questionnaire', methods=['GET'])
@jwt_required()
def get_questionnaire():
    email = get_jwt_identity()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        cursor.execute(
            'SELECT answers, image_paths FROM questionnaires WHERE user_id = %s',
            (user['id'],)
        )
        questionnaire = cursor.fetchone()

        if not questionnaire:
            return jsonify({'answers': {}, 'image_paths': []}), 200

        return jsonify({
            'answers': questionnaire['answers'],
            'image_paths': questionnaire['image_paths'] or []
        }), 200

@questionnaire_bp.route('/questionnaire', methods=['POST'])
@jwt_required()
def save_questionnaire():
    email = get_jwt_identity()
    data = request.json
    answers = data.get('answers', {})

    with get_db() as conn:
        cursor = conn.cursor()

        # Check if questionnaires are locked
        cursor.execute("SELECT value FROM settings WHERE key = 'questionnaires_locked'")
        setting = cursor.fetchone()
        if setting and setting['value']:
            return jsonify({'error': 'Questionnaires are currently locked by admin'}), 403

        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        cursor.execute(
            '''
            INSERT INTO questionnaires (user_id, answers, updated_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id)
            DO UPDATE SET answers = %s, updated_at = CURRENT_TIMESTAMP
            ''',
            (user['id'], str(answers).replace("'", '"'), str(answers).replace("'", '"'))
        )

        return jsonify({'message': 'Questionnaire saved successfully'}), 200

@questionnaire_bp.route('/questionnaire/upload', methods=['POST'])
@jwt_required()
def upload_image():
    email = get_jwt_identity()

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > Config.MAX_CONTENT_LENGTH:
        return jsonify({'error': 'File too large (max 1MB)'}), 400

    with get_db() as conn:
        cursor = conn.cursor()

        # Check if questionnaires are locked
        cursor.execute("SELECT value FROM settings WHERE key = 'questionnaires_locked'")
        setting = cursor.fetchone()
        if setting and setting['value']:
            return jsonify({'error': 'Questionnaires are currently locked by admin'}), 403

        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(__file__), '..', Config.UPLOAD_FOLDER)
        os.makedirs(upload_dir, exist_ok=True)

        # Save file
        filename = secure_filename(f"{user['id']}_{file.filename}")
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)

        # Update questionnaire with image path
        cursor.execute(
            'SELECT image_paths FROM questionnaires WHERE user_id = %s',
            (user['id'],)
        )
        result = cursor.fetchone()
        image_paths = result['image_paths'] if result and result['image_paths'] else []
        image_paths.append(filename)

        cursor.execute(
            '''
            UPDATE questionnaires
            SET image_paths = %s, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
            ''',
            (image_paths, user['id'])
        )

        return jsonify({'message': 'Image uploaded successfully', 'filename': filename}), 200

@questionnaire_bp.route('/questionnaires/all', methods=['GET'])
@jwt_required()
def get_all_questionnaires():
    email = get_jwt_identity()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        cursor.execute('''
            SELECT u.id, u.email, q.answers, q.image_paths, q.updated_at
            FROM users u
            LEFT JOIN questionnaires q ON u.id = q.user_id
            WHERE u.role = 'user'
            ORDER BY q.updated_at DESC
        ''')
        questionnaires = cursor.fetchall()

        return jsonify([{
            'user_id': q['id'],
            'email': q['email'],
            'answers': q['answers'] or {},
            'image_paths': q['image_paths'] or [],
            'updated_at': q['updated_at'].isoformat() if q['updated_at'] else None
        } for q in questionnaires]), 200
