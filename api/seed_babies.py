"""
Script to seed the database with sample babies.
Run this after initializing the database.
"""

import json
from database import get_db

def seed_babies():
    """Add sample babies to the database"""
    babies = [
        {
            'name': 'Lily',
            'age': '6 months',
            'attributes': ['smart', 'curious', 'giggly'],
            'image_path': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
            'life_stages': [
                {
                    'age': '6 months',
                    'description': 'At 6 months, I love exploring the world! I giggle at everything and I\'m just learning to sit up on my own.',
                    'image_path': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400'
                },
                {
                    'age': '5 years',
                    'description': 'I\'m in kindergarten now! I love learning my ABCs and asking "why" about everything. My favorite thing is story time.',
                    'image_path': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400'
                },
                {
                    'age': '14 years',
                    'description': 'I\'m a teenager now! I\'m into science and robotics. I\'m curious about how things work and love debating ideas.',
                    'image_path': 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?w=400'
                }
            ]
        },
        {
            'name': 'Max',
            'age': '8 months',
            'attributes': ['funny', 'playful', 'energetic'],
            'image_path': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
            'life_stages': [
                {
                    'age': '8 months',
                    'description': 'I\'m always on the move! I love crawling around and making everyone laugh with my silly faces.',
                    'image_path': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400'
                },
                {
                    'age': '5 years',
                    'description': 'I have so much energy! I love playing sports, making new friends, and telling jokes. Let\'s play!',
                    'image_path': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400'
                },
                {
                    'age': '14 years',
                    'description': 'I\'m super active! I play on the soccer team and love hanging out with my friends. Life is an adventure!',
                    'image_path': 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?w=400'
                }
            ]
        },
        {
            'name': 'Emma',
            'age': '5 months',
            'attributes': ['sweet', 'calm', 'loving'],
            'image_path': 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?w=400',
            'life_stages': [
                {
                    'age': '5 months',
                    'description': 'I\'m a peaceful baby who loves cuddles and soft music. I smile at everyone I meet!',
                    'image_path': 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?w=400'
                },
                {
                    'age': '5 years',
                    'description': 'I love art and music! I\'m gentle and caring, and I enjoy helping others. My favorite is painting.',
                    'image_path': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400'
                },
                {
                    'age': '14 years',
                    'description': 'I\'m creative and empathetic. I love writing poetry and playing piano. I care deeply about people and the world.',
                    'image_path': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400'
                }
            ]
        },
    ]

    with get_db() as conn:
        cursor = conn.cursor()

        for baby in babies:
            # Check if baby already exists
            cursor.execute('SELECT id FROM babies WHERE name = %s', (baby['name'],))
            if cursor.fetchone():
                print(f"Baby '{baby['name']}' already exists, skipping...")
                continue

            cursor.execute(
                '''
                INSERT INTO babies (name, age, attributes, image_path, is_visible, life_stages)
                VALUES (%s, %s, %s, %s, %s, %s)
                ''',
                (baby['name'], baby['age'], baby['attributes'], baby['image_path'], False, json.dumps(baby['life_stages']))
            )
            print(f"Added baby: {baby['name']}")

    print("\nDatabase seeded successfully!")
    print("Note: Babies are initially hidden. Admin must toggle visibility to show them to users.")

if __name__ == '__main__':
    seed_babies()
