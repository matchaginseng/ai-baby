"""
Script to seed the database with sample babies.
Run this after initializing the database.
"""

from database import get_db

def seed_babies():
    """Add sample babies to the database"""
    babies = [
        {
            'name': 'Lily',
            'age': '6 months',
            'attributes': ['smart', 'curious', 'giggly'],
            'image_path': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
        },
        {
            'name': 'Max',
            'age': '8 months',
            'attributes': ['funny', 'playful', 'energetic'],
            'image_path': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
        },
        {
            'name': 'Emma',
            'age': '5 months',
            'attributes': ['sweet', 'calm', 'loving'],
            'image_path': 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?w=400',
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
                INSERT INTO babies (name, age, attributes, image_path, is_visible)
                VALUES (%s, %s, %s, %s, %s)
                ''',
                (baby['name'], baby['age'], baby['attributes'], baby['image_path'], False)
            )
            print(f"Added baby: {baby['name']}")

    print("\nDatabase seeded successfully!")
    print("Note: Babies are initially hidden. Admin must toggle visibility to show them to users.")

if __name__ == '__main__':
    seed_babies()
