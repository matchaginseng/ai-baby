from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .database import get_db

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    """Get all settings (anyone can view)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT key, value FROM settings')
        settings = cursor.fetchall()

        return jsonify({s['key']: s['value'] for s in settings}), 200

@settings_bp.route('/settings/questionnaires-lock', methods=['POST'])
@jwt_required()
def toggle_questionnaires_lock():
    """Admin only: Toggle questionnaire editing lock"""
    email = get_jwt_identity()
    data = request.json
    is_locked = data.get('is_locked', False)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        # Update questionnaires lock setting
        cursor.execute(
            "UPDATE settings SET value = %s WHERE key = 'questionnaires_locked'",
            (is_locked,)
        )

        return jsonify({'message': 'Questionnaire lock updated', 'is_locked': is_locked}), 200
