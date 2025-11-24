# Sales Assistant Frontend - Complete Implementation Guide

## 🎨 UI/UX Design Overview

### Design Philosophy
- **Primary Theme**: Dark mode with elegant gradients
- **Theme Toggle**: Seamless light/dark mode switching
- **Color Palette**: 
  - Dark: Deep blacks (#0a0a0a), dark grays (#1a1a1a), accent purple/blue gradients
  - Light: Clean whites (#ffffff), light grays (#f5f5f5), vibrant accent colors
- **Typography**: Inter font family for modern, clean look
- **Layout**: Responsive, mobile-first design

---

## 📱 Application Structure

### Page Hierarchy

```
Sales Assistant App
├── Authentication
│   ├── Login Page
│   └── Register Page
├── Dashboard (Protected)
│   ├── Overview Stats
│   ├── Recent Conversations
│   └── Quick Actions
├── Agents Management
│   ├── Agents List
│   ├── Create Agent
│   ├── Edit Agent
│   └── Agent Details
└── Conversations
    ├── Conversation List
    ├── Active Conversation
    └── Message Thread
```

---

## 🎯 Detailed Page Specifications

### 1. Login Page (`/login`)

**Visual Design:**
```
┌─────────────────────────────────────────┐
│                                         │
│         [LOGO] Sales Assistant          │
│                                         │
│     ┌─────────────────────────────┐    │
│     │  Email                      │    │
│     │  [email input field]        │    │
│     │                             │    │
│     │  Password                   │    │
│     │  [password input field]     │    │
│     │                             │    │
│     │  [Login Button]             │    │
│     │                             │    │
│     │  Don't have an account?     │    │
│     │  [Register]                 │    │
│     └─────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**API Integration:**

**Endpoint:** `POST /api/v1/auth/login/`

**Request Payload:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (Success - 200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "company_name": "Tech Corp"
  }
}
```

**UI Flow:**
1. User enters email and password
2. On submit, show loading spinner on button
3. Call login API
4. On success:
   - Store `access` token in localStorage/sessionStorage
   - Store `refresh` token securely
   - Store user data in context/state
   - Redirect to `/dashboard`
5. On error:
   - Show error message below form
   - Highlight invalid fields

**React Component Structure:**
```jsx
<LoginPage>
  <ThemeToggle />
  <LoginForm>
    <Logo />
    <EmailInput />
    <PasswordInput />
    <LoginButton />
    <RegisterLink />
  </LoginForm>
</LoginPage>
```

---

### 2. Register Page (`/register`)

**Visual Design:**
```
┌─────────────────────────────────────────┐
│         Create Your Account             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  First Name    Last Name        │   │
│  │  [input]       [input]          │   │
│  │                                 │   │
│  │  Email                          │   │
│  │  [email input]                  │   │
│  │                                 │   │
│  │  Username                       │   │
│  │  [username input]               │   │
│  │                                 │   │
│  │  Password                       │   │
│  │  [password input]               │   │
│  │                                 │   │
│  │  Confirm Password               │   │
│  │  [password input]               │   │
│  │                                 │   │
│  │  Company (Optional)             │   │
│  │  [company input]                │   │
│  │                                 │   │
│  │  [Create Account Button]        │   │
│  │                                 │   │
│  │  Already have an account?       │   │
│  │  [Login]                        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**API Integration:**

**Endpoint:** `POST /api/v1/auth/register/`

**Request Payload:**
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Tech Solutions Inc",
  "job_title": "Business Development Manager"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "company_name": "Tech Solutions Inc"
  }
}
```

**UI Flow:**
1. User fills registration form
2. Validate password match in real-time
3. On submit, validate all fields
4. Call register API
5. On success:
   - Show success message
   - Auto-redirect to login page after 2 seconds
6. On error:
   - Display field-specific errors

---

### 3. Dashboard Page (`/dashboard`)

**Visual Design:**
```
┌────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Dashboard                    [Profile] │
│             │                                          │
│  Dashboard  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  Agents     │  │ Total    │ │ Active   │ │ Messages│ │
│  Chats      │  │ Agents   │ │ Chats    │ │ Today   │ │
│             │  │   5      │ │   3      │ │   24    │ │
│             │  └──────────┘ └──────────┘ └─────────┘ │
│             │                                          │
│             │  Recent Conversations                    │
│             │  ┌────────────────────────────────────┐ │
│             │  │ [Agent] Client Discussion - 2h ago │ │
│             │  │ [Agent] Tech Query - 5h ago        │ │
│             │  │ [Agent] Project Planning - 1d ago  │ │
│             │  └────────────────────────────────────┘ │
│             │                                          │
│             │  Quick Actions                           │
│             │  [+ Create Agent] [+ New Chat]          │
└────────────────────────────────────────────────────────┘
```

**API Integrations:**

**1. Get User Profile:**
- **Endpoint:** `GET /api/v1/auth/profile/`
- **Headers:** `Authorization: Bearer {access_token}`
- **Response:** User profile data

**2. Get Agents List:**
- **Endpoint:** `GET /api/v1/agents/`
- **Headers:** `Authorization: Bearer {access_token}`
- **Response:** List of user's agents

**3. Get Recent Conversations:**
- **Endpoint:** `GET /api/v1/conversations/sessions/?page=1&page_size=5`
- **Headers:** `Authorization: Bearer {access_token}`
- **Response:** Recent conversation sessions

**UI Flow:**
1. On mount, fetch all dashboard data in parallel
2. Show loading skeletons while fetching
3. Display stats cards with animations
4. List recent conversations with click-to-open
5. Quick action buttons navigate to respective pages

---

### 4. Agents List Page (`/agents`)

**Visual Design:**
```
┌────────────────────────────────────────────────────────┐
│  [Sidebar]  │  My AI Agents          [+ Create Agent] │
│             │                                          │
│             │  [Search agents...]                      │
│             │                                          │
│             │  ┌────────────────────────────────────┐ │
│             │  │ [Avatar] Sarah Johnson             │ │
│             │  │ Senior Full-Stack Developer        │ │
│             │  │ 7 years exp • Active               │ │
│             │  │ [Chat] [Edit] [Delete]             │ │
│             │  └────────────────────────────────────┘ │
│             │                                          │
│             │  ┌────────────────────────────────────┐ │
│             │  │ [Avatar] Mike Chen                 │ │
│             │  │ DevOps Engineer                    │ │
│             │  │ 5 years exp • Inactive             │ │
│             │  │ [Chat] [Edit] [Delete]             │ │
│             │  └────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**API Integration:**

**Endpoint:** `GET /api/v1/agents/`

**Query Parameters:**
- `is_active=true` - Filter active agents
- `search=developer` - Search by name/role

**Response (200):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sarah Johnson",
      "role": "Senior Full-Stack Developer",
      "company": "Tech Innovations Ltd",
      "is_active": true,
      "created_at": "2025-11-23T18:00:00Z",
      "updated_at": "2025-11-23T18:00:00Z"
    }
  ]
}
```

**UI Flow:**
1. Fetch agents list on mount
2. Display in grid/list view
3. Search filters agents in real-time
4. Click agent card to view details
5. Action buttons:
   - **Chat**: Navigate to `/conversations/new?agent={id}`
   - **Edit**: Navigate to `/agents/{id}/edit`
   - **Delete**: Show confirmation modal, then call DELETE API

---

### 5. Create Agent Page (`/agents/create`)

**Visual Design:**
```
┌────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Create AI Agent                         │
│             │                                          │
│             │  Basic Information                       │
│             │  ┌────────────────────────────────────┐ │
│             │  │ Name *                             │ │
│             │  │ [input]                            │ │
│             │  │                                    │ │
│             │  │ Role/Title *                       │ │
│             │  │ [input]                            │ │
│             │  │                                    │ │
│             │  │ Company                            │ │
│             │  │ [input]                            │ │
│             │  └────────────────────────────────────┘ │
│             │                                          │
│             │  Personality & Expertise                 │
│             │  ┌────────────────────────────────────┐ │
│             │  │ Personality Description *          │ │
│             │  │ [textarea - 500 chars]             │ │
│             │  │                                    │ │
│             │  │ Expertise Areas *                  │ │
│             │  │ [Python] [Django] [+Add]           │ │
│             │  │                                    │ │
│             │  │ Years of Experience                │ │
│             │  │ [number input]                     │ │
│             │  └────────────────────────────────────┘ │
│             │                                          │
│             │  Resume Upload (Optional)                │
│             │  ┌────────────────────────────────────┐ │
│             │  │ [📄 Drop PDF here or click]        │ │
│             │  │ Auto-extracts skills & experience  │ │
│             │  └────────────────────────────────────┘ │
│             │                                          │
│             │  [Cancel] [Create Agent]                 │
└────────────────────────────────────────────────────────┘
```

**API Integration:**

**Endpoint:** `POST /api/v1/agents/`

**Request (multipart/form-data):**
```
name: "Sarah Johnson"
role: "Senior Full-Stack Developer"
company: "Tech Innovations Ltd"
personality_description: "Friendly and approachable, explains complex concepts simply..."
expertise_areas: ["Python", "Django", "React", "PostgreSQL", "AWS"]
years_of_experience: 7
current_projects: "Leading development of microservices platform..."
education: "BS in Computer Science from MIT"
resume_file: [File object]
temperature: 0.7
```

**Response (201):**
```json
{
  "success": true,
  "message": "Agent created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Sarah Johnson",
    "role": "Senior Full-Stack Developer",
    "expertise_areas": ["Python", "Django", "React"],
    "is_active": true
  }
}
```

**UI Flow:**
1. Form with real-time validation
2. Expertise areas as tag input (add/remove)
3. Resume upload with drag-and-drop
4. Show upload progress
5. On PDF upload:
   - Auto-extract and populate expertise_areas
   - Show preview of extracted data
6. On submit:
   - Validate all required fields
   - Show loading state
   - On success: Redirect to agent details page
   - On error: Show field-specific errors

---

### 6. Conversation Page (`/conversations/:sessionId`)

**Visual Design:**
```
┌────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Chat with Sarah Johnson    [⚙️Settings]│
│             │                                          │
│  [Sessions] │  ┌────────────────────────────────────┐ │
│             │  │                                    │ │
│  Session 1  │  │  User: How should I explain        │ │
│  Session 2  │  │  microservices to the client?      │ │
│  Session 3  │  │                                    │ │
│             │  │  Sarah: Great question! Think of   │ │
│             │  │  microservices like a restaurant   │ │
│             │  │  kitchen...                        │ │
│             │  │                                    │ │
│             │  │  User: Client asks: Can you        │ │
│             │  │  explain your caching strategy?    │ │
│             │  │                                    │ │
│             │  │  Sarah: Absolutely! Our caching... │ │
│             │  │                                    │ │
│             │  └────────────────────────────────────┘ │
│             │                                          │
│             │  ┌────────────────────────────────────┐ │
│             │  │ [Type your message...]             │ │
│             │  │                                    │ │
│             │  │ [🤔 User Query] [💼 Client Msg]   │ │
│             │  │              [Send →]              │ │
│             │  └────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**API Integrations:**

**1. Create Conversation Session:**

**Endpoint:** `POST /api/v1/conversations/sessions/`

**Request:**
```json
{
  "agent": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Client Technical Discussion"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Conversation session created successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "agent": "550e8400-e29b-41d4-a716-446655440000",
    "agent_details": {
      "name": "Sarah Johnson",
      "role": "Senior Full-Stack Developer"
    },
    "title": "Client Technical Discussion",
    "is_active": true,
    "message_count": 0
  }
}
```

**2. Send Message:**

**Endpoint:** `POST /api/v1/conversations/sessions/{sessionId}/send_message/`

**Request:**
```json
{
  "message": "Client asks: How does your caching strategy work?",
  "is_user_query": false,
  "is_client_query": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "session": "660e8400-e29b-41d4-a716-446655440001",
    "user_message": "Client asks: How does your caching strategy work?",
    "agent_response": "Great question! Our caching strategy uses Redis...",
    "message_type": "client_message",
    "is_client_query": true,
    "response_time_ms": 1250,
    "created_at": "2025-11-23T18:35:00Z"
  }
}
```

**3. Get Conversation Details:**

**Endpoint:** `GET /api/v1/conversations/sessions/{sessionId}/`

**Response (200):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "agent_details": {
    "name": "Sarah Johnson",
    "role": "Senior Full-Stack Developer"
  },
  "title": "Client Technical Discussion",
  "message_count": 5,
  "messages": [
    {
      "id": "msg-1",
      "user_message": "Hello",
      "agent_response": "Hi! How can I help?",
      "message_type": "general",
      "created_at": "2025-11-23T18:30:00Z"
    }
  ]
}
```

**UI Flow:**
1. On mount, fetch conversation details
2. Display messages in chronological order
3. Auto-scroll to latest message
4. Message input with type toggle:
   - **User Query** (🤔): `is_user_query: true`
   - **Client Message** (💼): `is_client_query: true`
5. On send:
   - Add message to UI optimistically
   - Show "typing..." indicator
   - Call send_message API
   - On response:
     - Replace optimistic message with real data
     - Display agent response with typing animation
   - On error:
     - Show error, allow retry

---

## 🎨 Theme Implementation

### Color Tokens

**Dark Theme:**
```css
--bg-primary: #0a0a0a
--bg-secondary: #1a1a1a
--bg-tertiary: #2a2a2a
--text-primary: #ffffff
--text-secondary: #a0a0a0
--accent-primary: #8b5cf6
--accent-secondary: #3b82f6
--border-color: #333333
--success: #10b981
--error: #ef4444
```

**Light Theme:**
```css
--bg-primary: #ffffff
--bg-secondary: #f5f5f5
--bg-tertiary: #e5e5e5
--text-primary: #0a0a0a
--text-secondary: #666666
--accent-primary: #7c3aed
--accent-secondary: #2563eb
--border-color: #d4d4d4
--success: #059669
--error: #dc2626
```

### Theme Toggle Component

```jsx
const ThemeToggle = () => {
  const [theme, setTheme] = useState('dark');
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};
```

---

## 🔐 Authentication Flow

### Token Management

**Store tokens securely:**
```javascript
// After login success
localStorage.setItem('access_token', response.access);
localStorage.setItem('refresh_token', response.refresh);
localStorage.setItem('user', JSON.stringify(response.user));
```

**API Request Interceptor:**
```javascript
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

**Token Refresh:**
```javascript
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      try {
        const { data } = await axios.post('/api/v1/auth/token/refresh/', {
          refresh: refreshToken
        });
        localStorage.setItem('access_token', data.access);
        error.config.headers.Authorization = `Bearer ${data.access}`;
        return axios(error.config);
      } catch {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 📦 Recommended Tech Stack

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "react-query": "^3.39.3",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "framer-motion": "^10.16.5",
    "lucide-react": "^0.294.0",
    "react-hot-toast": "^2.4.1",
    "tailwindcss": "^3.3.5"
  }
}
```

---

## 🚀 Next Steps

1. Set up React project with Vite
2. Configure Tailwind CSS with theme variables
3. Implement authentication context
4. Create reusable API service layer
5. Build component library
6. Implement routing with protected routes
7. Add loading states and error boundaries
8. Test all API integrations

This guide provides the complete blueprint for building your frontend. Would you like me to generate the actual React code for any specific component?
