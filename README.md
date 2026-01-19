# AI Baby - Full-Stack Application

A full-stack application built with Next.js (frontend) and Flask (backend) that allows users to complete questionnaires, interact with AI-powered baby characters using Claude, and select their preferred baby.

## Features

- **Authentication System**: JWT-based authentication with user and admin roles
- **Questionnaire**: Auto-saving questionnaire with multiple choice, checkboxes, text inputs, and image uploads (max 1MB)
- **Admin Dashboard**: View all user questionnaires and toggle baby visibility
- **Baby Display**: Playing card-style layout showing babies with attributes
- **AI Chat**: Chat with babies using Claude API (Anthropic) with personality-based responses
- **Baby Selection**: 10-message limit per baby, then option to make final selection
- **Responsive Design**: Works on both web and mobile devices

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Axios (API calls)

### Backend
- Flask 3.0
- PostgreSQL (Neon)
- Flask-JWT-Extended (authentication)
- Anthropic API (Claude integration)
- Pillow (image processing)

## Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.8+
- PostgreSQL database (Neon recommended)
- Anthropic API key

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
pip3 install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database

# JWT Secret (generate a secure random string)
JWT_SECRET_KEY=your-secret-key-here

# Anthropic API Key (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Admin Email (this email will have admin role)
ADMIN_EMAIL=admin@example.com
```

### 3. Initialize Database

Visit the initialization endpoint:

```bash
# Start the Flask server first
python3 -m flask --app api/index run -p 5328

# Then in another terminal, initialize the database
curl http://localhost:5328/api/init-db
```

Or visit `http://localhost:5328/api/init-db` in your browser.

### 4. Seed Sample Babies (Optional)

```bash
cd api
python3 seed_babies.py
```

This will add 3 sample babies to the database.

### 5. Run Development Servers

```bash
# Run both Next.js and Flask concurrently
npm run dev

# Or run them separately:
# Terminal 1 - Flask
npm run flask-dev

# Terminal 2 - Next.js
npm run next-dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5328

## Usage Guide

### For Regular Users

1. **Register/Login**: Create an account or login at `/login`
2. **Complete Questionnaire**: Fill out the questionnaire with your preferences (auto-saves)
3. **Upload Photos**: Upload up to multiple photos (1MB max each)
4. **Wait for Babies**: Admin must enable "Show Babies" toggle
5. **Meet Babies**: View 3 babies in card layout with their attributes
6. **Chat with Babies**: Click "Chat" to start conversation (10 messages max per baby)
7. **Select Baby**: After reaching message limit, confirm final selection
8. **View Your Baby**: See your selected baby on the Babies page

### For Admin

1. **Login**: Login with the admin email specified in `.env`
2. **View Questionnaires**: See all user submissions and uploaded images
3. **Toggle Baby Visibility**: Enable "Show Babies" to make babies visible to all users
4. **Monitor Activity**: Review user responses and engagement

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Questionnaire
- `GET /api/questionnaire` - Get user's questionnaire
- `POST /api/questionnaire` - Save questionnaire answers
- `POST /api/questionnaire/upload` - Upload image
- `GET /api/questionnaires/all` - Get all questionnaires (admin only)

### Babies
- `GET /api/babies` - Get all babies (filtered by visibility for users)
- `POST /api/babies/visibility` - Toggle baby visibility (admin only)
- `POST /api/babies/selected` - Select a baby
- `GET /api/babies/selected` - Get selected baby
- `POST /api/babies` - Create new baby (admin only)

### Chat
- `GET /api/chat/:babyId` - Get chat history
- `POST /api/chat/:babyId` - Send message to baby

## Database Schema

### users
- `id`, `email`, `password_hash`, `role`, `selected_baby_id`, `created_at`

### questionnaires
- `id`, `user_id`, `answers` (JSONB), `image_paths`, `updated_at`

### babies
- `id`, `name`, `age`, `attributes`, `image_path`, `is_visible`, `created_at`

### chat_messages
- `id`, `user_id`, `baby_id`, `message`, `role`, `created_at`

### chat_sessions
- `id`, `user_id`, `baby_id`, `message_count`

## Customization

### Adding Custom Baby Attributes

Edit the baby seed data in `api/seed_babies.py` or use the admin API to create new babies.

### Modifying Questionnaire Questions

Edit the questionnaire component in `app/questionnaire/page.tsx`.

### Changing Chat Limit

Modify the limit in `api/chat.py` (currently set to 20 messages = 10 back-and-forths).

### Customizing Baby Personalities

The baby prompt is generated in `api/chat.py` using the baby's name, age, and attributes.

## Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel
```

### Backend (Any Python host)
```bash
# Set environment variables
# Run Flask app
gunicorn api.index:app
```

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running and accessible
- Check firewall settings for Neon

### Image Upload Fails
- Check file size (must be < 1MB)
- Ensure `uploads/` directory has write permissions
- Verify MIME type is image/*

### Chat Not Working
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key has sufficient credits
- Review Flask logs for error messages

## Project Structure

```
ai-baby/
├── api/                    # Flask backend
│   ├── index.py           # Main Flask app
│   ├── config.py          # Configuration
│   ├── database.py        # Database utilities
│   ├── auth.py            # Authentication routes
│   ├── questionnaire.py   # Questionnaire routes
│   ├── babies.py          # Baby management routes
│   ├── chat.py            # Chat with Claude routes
│   └── seed_babies.py     # Database seeding script
├── app/                   # Next.js frontend
│   ├── page.tsx           # Home/redirect page
│   ├── layout.tsx         # Root layout
│   ├── login/             # Login/register page
│   ├── questionnaire/     # Questionnaire page
│   ├── admin/             # Admin dashboard
│   ├── babies/            # Babies display page
│   └── chat/[babyId]/     # Chat interface
├── lib/                   # Shared utilities
│   ├── store.ts           # Zustand state management
│   └── api.ts             # API client
├── public/                # Static assets
├── uploads/               # Uploaded images (created at runtime)
├── .env                   # Environment variables (create this)
├── .env.example           # Environment template
├── requirements.txt       # Python dependencies
├── package.json           # Node dependencies
└── README.md             # This file
```

## License

MIT
