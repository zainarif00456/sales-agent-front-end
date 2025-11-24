# Sales Assistant Frontend

A modern, beautiful React application for managing AI sales assistant agents and conversations.

## 🚀 Features

- **Authentication**: Secure login and registration with JWT tokens
- **Agent Management**: Create, edit, and manage AI sales agents
- **Conversations**: Real-time chat interface with AI agents
- **Dark/Light Theme**: Seamless theme switching
- **Responsive Design**: Mobile-first, fully responsive UI
- **Beautiful Animations**: Smooth transitions using Framer Motion

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching & caching
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── services/        # API service layer
├── store/           # Zustand stores
├── lib/             # Utility libraries
├── App.tsx          # Main app component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## 🎨 Features Overview

### Authentication
- Login with email/password
- User registration
- Automatic token refresh
- Protected routes

### Dashboard
- Overview statistics
- Recent conversations
- Quick actions

### Agents
- Create AI agents with custom personalities
- Upload resumes for auto-extraction
- Manage expertise areas
- Edit and delete agents

### Conversations
- Real-time chat interface
- Message type toggle (User Query / Client Message)
- Typing indicators
- Message history

## 🎯 API Integration

All API endpoints are configured to work with the Django backend at `http://localhost:8000/api/v1/`.

The application includes:
- Automatic JWT token management
- Request/response interceptors
- Error handling
- Token refresh on 401 errors

## 🌈 Theme System

The app supports both light and dark themes with:
- CSS custom properties
- Persistent theme selection
- Smooth transitions
- Tailwind CSS integration

## 📱 Responsive Design

Fully responsive across all devices:
- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

## 🚀 Development

```bash
# Run development server (http://localhost:3000)
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## 📝 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
