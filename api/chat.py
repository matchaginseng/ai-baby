from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.database import get_db
from api.config import Config
from anthropic import Anthropic

chat_bp = Blueprint('chat', __name__)

def get_baby_prompt(baby_name, baby_age, baby_attributes, stage=None):
    """Load and format the baby chat prompt"""
    attributes_str = ", ".join(baby_attributes)

    if stage:
        # Use stage-specific age and description
        return f"""You are {baby_name} at {stage['age']}. {stage['description']}

Your core traits: {attributes_str}.

Respond as {baby_name} at {stage['age']} would - with appropriate language, personality, and behavior for this age.
Be genuine, stay in character, and keep responses concise and engaging."""
    else:
        # Default prompt
        return f"""You are {baby_name}, a {baby_age} baby with the following traits: {attributes_str}.

Respond as this baby would - with appropriate language, personality, and behavior for their age and attributes.
Be playful, genuine, and stay in character. Keep responses concise and engaging."""

@chat_bp.route('/chat/<int:baby_id>', methods=['GET'])
@jwt_required()
def get_chat_history(baby_id):
    email = get_jwt_identity()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get chat messages
        cursor.execute(
            '''
            SELECT message, role, created_at
            FROM chat_messages
            WHERE user_id = %s AND baby_id = %s
            ORDER BY created_at ASC
            ''',
            (user['id'], baby_id)
        )
        messages = cursor.fetchall()

        # Get message count
        cursor.execute(
            'SELECT message_count FROM chat_sessions WHERE user_id = %s AND baby_id = %s',
            (user['id'], baby_id)
        )
        session = cursor.fetchone()
        message_count = session['message_count'] if session else 0

        return jsonify({
            'messages': [{
                'message': m['message'],
                'role': m['role'],
                'timestamp': m['created_at'].isoformat()
            } for m in messages],
            'message_count': message_count
        }), 200

@chat_bp.route('/chat/<int:baby_id>', methods=['POST'])
@jwt_required()
def send_message(baby_id):
    email = get_jwt_identity()
    data = request.json
    user_message = data.get('message')
    stage = data.get('stage')  # Optional stage parameter

    if not user_message:
        return jsonify({'error': 'Message required'}), 400

    with get_db() as conn:
        cursor = conn.cursor()

        # Get user
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get baby details
        cursor.execute('SELECT name, age, attributes FROM babies WHERE id = %s', (baby_id,))
        baby = cursor.fetchone()
        if not baby:
            return jsonify({'error': 'Baby not found'}), 404

        # Check message count
        cursor.execute(
            '''
            INSERT INTO chat_sessions (user_id, baby_id, message_count)
            VALUES (%s, %s, 0)
            ON CONFLICT (user_id, baby_id)
            DO NOTHING
            ''',
            (user['id'], baby_id)
        )

        cursor.execute(
            'SELECT message_count FROM chat_sessions WHERE user_id = %s AND baby_id = %s',
            (user['id'], baby_id)
        )
        session = cursor.fetchone()
        message_count = session['message_count']

        if message_count >= 20:  # 10 back-and-forths = 20 messages
            return jsonify({'error': 'Message limit reached', 'limit_reached': True}), 400

        # Save user message
        cursor.execute(
            'INSERT INTO chat_messages (user_id, baby_id, message, role) VALUES (%s, %s, %s, %s)',
            (user['id'], baby_id, user_message, 'user')
        )

        # Get chat history for context
        cursor.execute(
            '''
            SELECT message, role
            FROM chat_messages
            WHERE user_id = %s AND baby_id = %s
            ORDER BY created_at ASC
            ''',
            (user['id'], baby_id)
        )
        history = cursor.fetchall()

        # Build messages for Claude
        system_prompt = get_baby_prompt(baby['name'], baby['age'], baby['attributes'], stage)
        messages = [{'role': 'user' if h['role'] == 'user' else 'assistant', 'content': h['message']} for h in history]

        # Call Claude API
        try:
            client = Anthropic(api_key=Config.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=system_prompt,
                messages=messages
            )

            assistant_message = response.content[0].text

            # Save assistant message
            cursor.execute(
                'INSERT INTO chat_messages (user_id, baby_id, message, role) VALUES (%s, %s, %s, %s)',
                (user['id'], baby_id, assistant_message, 'assistant')
            )

            # Update message count
            new_count = message_count + 2  # user + assistant
            cursor.execute(
                'UPDATE chat_sessions SET message_count = %s WHERE user_id = %s AND baby_id = %s',
                (new_count, user['id'], baby_id)
            )

            return jsonify({
                'message': assistant_message,
                'message_count': new_count,
                'limit_reached': new_count >= 20
            }), 200

        except Exception as e:
            return jsonify({'error': f'Failed to get response: {str(e)}'}), 500
