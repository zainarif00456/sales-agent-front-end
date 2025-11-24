# Troubleshooting: Agents Page Not Loading

## Common Issues and Solutions

### 1. **Not Logged In**
**Symptom:** Page redirects to login or shows blank screen

**Solution:**
1. Navigate to `http://localhost:3001/login`
2. Login with your credentials or register a new account
3. After successful login, navigate to `/agents`

### 2. **Backend Not Running**
**Symptom:** Loading spinner that never stops, or error message

**Solution:**
```bash
# In your backend directory
python manage.py runserver
```

### 3. **CORS Issues**
**Symptom:** Console shows CORS errors

**Solution:**
Make sure your Django backend has CORS configured:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]
```

### 4. **Token Expired**
**Symptom:** Automatic redirect to login page

**Solution:**
- This is expected behavior
- Simply log in again
- The app will automatically refresh tokens when possible

### 5. **Check Browser Console**
Open Developer Tools (F12) and check:
- **Console tab:** Look for JavaScript errors
- **Network tab:** Check if API calls are failing
- **Application tab:** Check if tokens are stored in localStorage

### 6. **Clear Browser Data**
Sometimes cached data causes issues:
```javascript
// In browser console, run:
localStorage.clear();
// Then refresh and login again
```

### Debug Steps:

1. **Check if backend is running:**
   ```bash
   curl http://localhost:8000/api/v1/agents/
   ```

2. **Check if you're logged in:**
   - Open browser console
   - Type: `localStorage.getItem('access_token')`
   - Should return a token string, not null

3. **Check network requests:**
   - Open DevTools → Network tab
   - Navigate to /agents
   - Look for failed requests (red)
   - Click on them to see error details

4. **Force reload:**
   - Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   - This clears cache and reloads

### Expected Behavior:

When working correctly:
1. Navigate to `/agents`
2. See loading spinner briefly
3. See grid of agent cards (or empty state if no agents)
4. Can search, create, edit, and delete agents

### Still Not Working?

Check the browser console for specific error messages and share them for more targeted help.
