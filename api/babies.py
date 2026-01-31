from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.database import get_db

babies_bp = Blueprint('babies', __name__)

@babies_bp.route('/babies', methods=['GET'])
@jwt_required()
def get_babies():
    email = get_jwt_identity()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get babies (admins see all, users see their assigned babies)
        if user['role'] == 'admin':
            cursor.execute('SELECT id, name, age, attributes, image_path, is_visible, life_stages, user_id FROM babies ORDER BY id')
        else:
            cursor.execute('SELECT id, name, age, attributes, image_path, life_stages, user_id FROM babies WHERE user_id = %s AND is_visible = TRUE ORDER BY id', (user['id'],))

        babies = cursor.fetchall()

        return jsonify([{
            'id': b['id'],
            'name': b['name'],
            'age': b['age'],
            'attributes': b['attributes'],
            'image_path': b['image_path'],
            'is_visible': b.get('is_visible', True),
            'life_stages': b.get('life_stages', []),
            'user_id': b.get('user_id')
        } for b in babies]), 200

@babies_bp.route('/babies/visibility', methods=['POST'])
@jwt_required()
def toggle_baby_visibility():
    email = get_jwt_identity()
    data = request.json
    is_visible = data.get('is_visible', False)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        # Update all babies visibility
        cursor.execute('UPDATE babies SET is_visible = %s', (is_visible,))

        return jsonify({'message': 'Baby visibility updated', 'is_visible': is_visible}), 200

@babies_bp.route('/babies/selected', methods=['POST'])
@jwt_required()
def select_baby():
    email = get_jwt_identity()
    data = request.json
    baby_id = data.get('baby_id')

    if not baby_id:
        return jsonify({'error': 'Baby ID required'}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Verify baby exists
        cursor.execute('SELECT id FROM babies WHERE id = %s', (baby_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Baby not found'}), 404

        # Update user's selected baby
        cursor.execute(
            'UPDATE users SET selected_baby_id = %s WHERE id = %s',
            (baby_id, user['id'])
        )

        return jsonify({'message': 'Baby selected successfully', 'baby_id': baby_id}), 200

@babies_bp.route('/babies/selected', methods=['GET'])
@jwt_required()
def get_selected_baby():
    email = get_jwt_identity()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT selected_baby_id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not user['selected_baby_id']:
            return jsonify({'selected_baby': None}), 200

        cursor.execute(
            'SELECT id, name, age, attributes, image_path, life_stages FROM babies WHERE id = %s',
            (user['selected_baby_id'],)
        )
        baby = cursor.fetchone()

        if not baby:
            return jsonify({'selected_baby': None}), 200

        return jsonify({
            'selected_baby': {
                'id': baby['id'],
                'name': baby['name'],
                'age': baby['age'],
                'attributes': baby['attributes'],
                'image_path': baby['image_path'],
                'life_stages': baby.get('life_stages', [])
            }
        }), 200

@babies_bp.route('/babies/my-babies', methods=['GET'])
@jwt_required()
def get_my_babies():
    """Get babies associated with the current user (selected baby + babies with chat history)"""
    email = get_jwt_identity()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, selected_baby_id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get babies the user has interacted with (through chat sessions or selected baby)
        cursor.execute('''
            SELECT DISTINCT b.id, b.name, b.age, b.attributes, b.image_path, b.life_stages
            FROM babies b
            LEFT JOIN chat_sessions cs ON b.id = cs.baby_id AND cs.user_id = %s
            WHERE b.is_visible = TRUE
            AND (cs.baby_id IS NOT NULL OR b.id = %s)
            ORDER BY b.id
        ''', (user['id'], user['selected_baby_id']))

        babies = cursor.fetchall()

        return jsonify([{
            'id': b['id'],
            'name': b['name'],
            'age': b['age'],
            'attributes': b['attributes'],
            'image_path': b['image_path'],
            'life_stages': b.get('life_stages', [])
        } for b in babies]), 200

@babies_bp.route('/babies', methods=['POST'])
@jwt_required()
def create_baby():
    """Admin only: Create a new baby and assign to a user"""
    email = get_jwt_identity()
    data = request.json

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        name = data.get('name')
        age = data.get('age')
        attributes = data.get('attributes', [])
        image_path = data.get('image_path', '')
        user_id = data.get('user_id')  # User to assign baby to

        if not name or not age:
            return jsonify({'error': 'Name and age required'}), 400

        # If user_id provided, verify user exists
        if user_id:
            cursor.execute('SELECT id FROM users WHERE id = %s', (user_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'User not found'}), 404

        cursor.execute(
            'INSERT INTO babies (name, age, attributes, image_path, is_visible, user_id) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
            (name, age, attributes, image_path, False, user_id)
        )
        baby_id = cursor.fetchone()['id']

        return jsonify({'message': 'Baby created', 'id': baby_id}), 201

@babies_bp.route('/babies/<int:baby_id>/assign', methods=['POST'])
@jwt_required()
def assign_baby_to_user():
    """Admin only: Assign a baby to a user"""
    email = get_jwt_identity()
    data = request.json
    baby_id = data.get('baby_id')
    user_id = data.get('user_id')

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        if not baby_id or not user_id:
            return jsonify({'error': 'Baby ID and User ID required'}), 400

        # Verify baby exists
        cursor.execute('SELECT id FROM babies WHERE id = %s', (baby_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Baby not found'}), 404

        # Verify user exists
        cursor.execute('SELECT id FROM users WHERE id = %s', (user_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404

        # Assign baby to user
        cursor.execute('UPDATE babies SET user_id = %s WHERE id = %s', (user_id, baby_id))

        return jsonify({'message': 'Baby assigned to user successfully'}), 200
