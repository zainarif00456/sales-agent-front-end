# Sales Assistant Frontend

A modern, beautiful React application for managing AI sales assistant agents and conversations.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** >= 18.x
- **npm** >= 9.x or **yarn** >= 3.x
- **Django Backend** running on `http://localhost:8000` (see [Backend Setup](#backend-setup))

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd sales-assistant/front-end

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your backend URL

# 4. Start development server
npm run dev
# App will be available at http://localhost:5173
```

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
npm preview
```

## 🔧 Configuration

### Backend Setup (Required)

Ensure the Django backend is running before starting the frontend:

```bash
# In the backend repository
python manage.py runserver
# Backend will run on http://localhost:8000
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration (Required)
VITE_API_BASE_URL=http://localhost:8000

# Development (Optional)
# Add other environment variables as needed
```

**Environment Variable Details:**
- `VITE_API_BASE_URL` - Base URL for all API requests to the Django backend (must include protocol and port)
- Variables prefixed with `VITE_` are exposed to the frontend at build time

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
- User registration with validation
- Automatic JWT token refresh (handles 401 errors)
- Protected routes - redirects to login if not authenticated
- Secure token storage in localStorage

### Dashboard
- Overview statistics
- Recent conversations
- Quick actions

### Agents
- Create AI agents with custom personalities
- Upload resumes for auto-extraction
- Manage expertise areas
- Edit and delete agents
- Regenerate personality prompts

### Conversations
- Real-time chat interface with WebSocket connection
- Message type toggle (User Query / Client Message)
- Typing indicators
- Message history
- Streaming message responses

### Documentation
- Markdown editor with live preview
- Mermaid diagram support and rendering
- Export documentation to PDF
- Manage documentation pages with tree navigation

## 🎯 API Integration

All API endpoints are configured to work with the Django backend at `http://localhost:8000/api/v1/`.

The application includes:
- Automatic JWT token management
- Request/response interceptors (Axios)
- Comprehensive error handling
- Token refresh on 401 errors
- FormData handling for file uploads

### Backend Repository
For backend setup and API documentation, see: [Backend Repository](https://github.com/zainarif00456/sales-agent-backend)

## 🌈 Theme System

The app supports both light and dark themes with:
- CSS custom properties (variables)
- Persistent theme selection (localStorage)
- Smooth transitions between themes
- Tailwind CSS integration
- System preference detection (optional)

Toggle theme using the button in the top-right corner.

## 📱 Responsive Design

Fully responsive across all devices:
- **Mobile** (< 768px) - Single column layout, touch-optimized
- **Tablet** (768px - 1024px) - Two column layout
- **Desktop** (> 1024px) - Full three-column layout with sidebar

## ❓ Troubleshooting

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend connection issues
- Verify Django backend is running: `http://localhost:8000/api/v1/health`
- Check `.env` file has correct `VITE_API_BASE_URL`
- Look for CORS errors in browser console
- Backend must have frontend origin in CORS_ALLOWED_ORIGINS

### TypeScript errors
```bash
# Run type checker
npx tsc --noEmit

# Clear TypeScript cache if needed
rm -rf dist/
npm run build
```

### Port already in use
```bash
# If port 5173 is already in use, Vite will use the next available port
# Or explicitly specify a different port:
npm run dev -- --port 3000
```

### WebSocket connection fails
- Verify backend WebSocket endpoint is configured
- Check network tab in DevTools for WebSocket connection
- Ensure JWT token is valid and not expired

### Linting fails
```bash
# Auto-fix formatting issues
npm run lint -- --fix

# Review remaining issues
npm run lint
```

## 👥 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- Run `npm run lint` before committing - all warnings must be fixed
- Run `npx tsc --noEmit` to ensure no TypeScript errors
- Write descriptive commit messages
- Test your changes locally before opening a PR
- Update README if adding new features or changing setup process

### Reporting Issues
Please include:
- Clear description of the issue
- Steps to reproduce
- Browser and Node.js versions
- Screenshots or error messages
- Relevant code snippets

## 📝 License

MIT

## 📚 Additional Resources

- **React Documentation** - https://react.dev
- **TypeScript Handbook** - https://www.typescriptlang.org/docs
- **Tailwind CSS** - https://tailwindcss.com/docs
- **Vite Documentation** - https://vitejs.dev
- **React Router** - https://reactrouter.com
- **Zustand** - https://github.com/pmndrs/zustand
- **React Query** - https://tanstack.com/query/latest

---

**Happy coding! 🎉**
