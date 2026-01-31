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
        cursor.execute('SELECT id, email, role, selected_baby_id, partner FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'selected_baby_id': user['selected_baby_id'],
            'partner': user['partner']
        }), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    email = get_jwt_identity()
    data = request.json
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password required'}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, password_hash FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Verify current password
        if not check_password_hash(user['password_hash'], current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Update to new password
        new_password_hash = generate_password_hash(new_password)
        cursor.execute(
            'UPDATE users SET password_hash = %s WHERE id = %s',
            (new_password_hash, user['id'])
        )

        return jsonify({'message': 'Password changed successfully'}), 200

@auth_bp.route('/partner', methods=['POST'])
@jwt_required()
def update_partner():
    email = get_jwt_identity()
    data = request.json
    partner = data.get('partner', '')

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        cursor.execute(
            'UPDATE users SET partner = %s WHERE id = %s',
            (partner, user['id'])
        )

        return jsonify({'message': 'Partner information updated successfully'}), 200

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Admin only: Get all users"""
    email = get_jwt_identity()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        cursor.execute('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC')
        users = cursor.fetchall()

        return jsonify([{
            'id': u['id'],
            'email': u['email'],
            'role': u['role'],
            'created_at': u['created_at'].isoformat() if u['created_at'] else None
        } for u in users]), 200
