# Quick Setup Guide

Follow these steps to get your AI Baby application running:

## Step 1: Set up Neon Database

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:pass@host/db`)
4. Save this for the next step

## Step 2: Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

## Step 3: Create .env File

Create a `.env` file in the root directory with:

```bash
DATABASE_URL=postgresql://your-neon-connection-string
JWT_SECRET_KEY=my-super-secret-jwt-key-change-this-in-production
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
ADMIN_EMAIL=admin@example.com
```

Replace the placeholder values with your actual credentials.

## Step 4: Install Dependencies

```bash
# Frontend dependencies (if not already installed)
npm install

# Backend dependencies
pip3 install -r requirements.txt
```

## Step 5: Initialize Database

Start the Flask server:
```bash
python3 -m flask --app api/index run -p 5328
```

Then visit: http://localhost:5328/api/init-db

You should see: `{"message": "Database initialized successfully"}`

## Step 6: Seed Sample Babies (Optional)

In a new terminal:
```bash
cd api
python3 seed_babies.py
```

This adds 3 sample babies to the database.

## Step 7: Start the Application

```bash
npm run dev
```

This starts both Next.js (port 3000) and Flask (port 5328).

## Step 8: Test the Application

1. Open http://localhost:3000
2. You'll be redirected to /login
3. Create an account with any email/password
4. To test admin features, create an account with the email you set as `ADMIN_EMAIL`

## Common Issues

### "Module not found" errors
Run `npm install` again to ensure all dependencies are installed.

### Database connection errors
- Verify your `DATABASE_URL` is correct
- Make sure your Neon database is running
- Check that you've initialized the database (Step 5)

### Flask not starting
- Make sure port 5328 is not in use
- Try running `pip3 install -r requirements.txt` again
- Check for Python version compatibility (needs 3.8+)

### Images not uploading
The `uploads/` folder is created automatically when you first upload an image. If you have permission issues, create it manually:
```bash
mkdir uploads
chmod 755 uploads
```

## Next Steps

1. **As Admin**: Login with your admin email, then toggle "Show Babies" to make them visible to users
2. **As User**: Complete the questionnaire, then navigate to the Babies tab to chat with babies
3. **Customize**: Edit `api/seed_babies.py` to add your own babies with custom attributes

## Need Help?

Check the main README.md for detailed documentation, API endpoints, and troubleshooting tips.
