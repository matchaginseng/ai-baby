from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from api.database import get_db
from api.config import Config

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    with get_db() as conn:
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 400

        # Determine role (admin if matching admin email)
        role = 'admin' if email == Config.ADMIN_EMAIL else 'user'

        # Create user
        password_hash = generate_password_hash(password)
        cursor.execute(
            'INSERT INTO users (email, password_hash, role) VALUES (%s, %s, %s) RETURNING id',
            (email, password_hash, role)
        )
        user_id = cursor.fetchone()['id']

        # Create empty questionnaire for user
        cursor.execute(
            'INSERT INTO questionnaires (user_id, answers, image_paths) VALUES (%s, %s, %s)',
            (user_id, '{}', [])
        )

    token = create_access_token(identity=email)
    return jsonify({'token': token, 'role': role, 'email': email}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, email, password_hash, role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401

        token = create_access_token(identity=email)
        return jsonify({
            'token': token,
            'role': user['role'],
            'email': user['email']
        }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    email = get_jwt_identity()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, email, role, selected_baby_id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'selected_baby_id': user['selected_baby_id']
        }), 200
