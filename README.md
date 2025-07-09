# Live-Collab Issue Tracker

A real-time collaborative issue tracking application with AI-powered features, built with React, Node.js, PostgreSQL, and Socket.IO.

## 🚀 Features

- **Real-time Collaboration**: Live updates using Socket.IO
- **AI-Powered Summaries**: Automatic issue summarization using OpenAI GPT
- **User Authentication**: Secure JWT-based authentication
- **Developer Dashboard**: Personalized issue management
- **Issue Management**: Create, edit, assign, and track issues
- **User Management**: Role-based access control
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Socket.IO client for real-time features
- Modern CSS with responsive design

### Backend
- Node.js with Express
- PostgreSQL database
- Socket.IO for real-time communication
- JWT authentication
- OpenAI integration for AI features
- bcrypt for password hashing

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- OpenAI API key (optional, for AI features)

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd live-collab-issue-tracker
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/live_collab_db
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
```

### 3. Frontend Setup
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Database Setup

#### First Time Setup:
```bash
cd server
npm run reset-db  # Creates database, tables, and sample data
```

#### Manual Seeding (when needed):
```bash
npm run seed-users   # Add default users only
npm run seed-issues  # Add sample issues only
```

### 5. Start the Application

#### Start Backend:
```bash
cd server
npm run dev  # Starts on http://localhost:5000
```

#### Start Frontend:
```bash
cd client
npm run dev  # Starts on http://localhost:5173
```

## 🤖 AI Features Setup

### Getting an OpenAI API Key:
1. Go to https://platform.openai.com/
2. Sign up or log in to your account
3. Navigate to API keys section
4. Create a new API key
5. Add it to your server's `.env` file

### AI Features:
- **Automatic Summaries**: Generated during issue creation
- **Manual Generation**: Click "🤖 Generate Summary" on any issue
- **Cost Optimization**: Summaries are stored and reused (no repeated API calls)
- **Ultra-Low Cost**: Uses gpt-4o-mini (~$0.0002 per summary, 95% cheaper than GPT-4)
- **Cost Monitoring**: Built-in tracking and estimation tools
- **Graceful Degradation**: App works without AI if API key not provided

### Cost Monitoring:
```bash
npm run check-costs  # View usage statistics and cost estimates
```

Cost tracking includes:
- Total requests and estimated costs
- Average cost per request  
- Real-time cost estimates in server logs
- API endpoint: `GET /api/issues/ai/stats` for programmatic access

## 📊 Database Management

### Development Workflow:
- `npm run dev` - Starts server with persistent database (no data loss)
- Database and tables are created only if they don't exist
- Your issues and AI summaries persist between server restarts

### Utility Commands:
```bash
npm run reset-db     # Complete database reset + sample data
npm run seed-users   # Add default users only
npm run seed-issues  # Add sample issues only
```

## 👥 Default Users

After running `npm run seed-users`, you can login with:

| Email | Password | Role |
|-------|----------|------|
| papapp1293@gmail.com | password | developer |
| alice@example.com | password | manager |
| bob@example.com | password | developer |

## 🚀 Usage

1. **Login**: Use one of the default accounts or register a new one
2. **Dashboard**: View issues assigned to you
3. **Issue List**: See all issues in the system
4. **Create Issues**: Add new issues with automatic AI summaries
5. **Real-time Updates**: See live changes from other users
6. **AI Summaries**: Generate or regenerate AI summaries for better understanding

## 📁 Project Structure

```
live-collab-issue-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── services/       # API and socket services
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── sockets/        # Socket.IO handlers
│   │   └── utils/          # Utility functions
│   └── db/                 # Database schemas
```

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests (if configured)
cd client
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.