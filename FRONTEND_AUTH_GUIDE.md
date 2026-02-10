# Frontend Authentication & Access Control Guide

## Overview

The frontend now includes authentication and access control features. Here's how to access and use them.

## New Pages Added

### 1. Login Page (`/login`)
- **Route**: `/login`
- **Purpose**: User authentication
- **Features**:
  - Email/password login
  - Automatic redirect to change password if temporary password detected
  - JWT token storage in localStorage

### 2. User Management (`/admin/users`)
- **Route**: `/admin/users`
- **Purpose**: Manage users (admin only)
- **Features**:
  - View all users
  - See user status (active/inactive, temporary password)
  - Reset user passwords (generates temporary password)
  - Create new users (modal coming soon)

### 3. Access Control (`/admin/access-control`)
- **Route**: `/admin/access-control`
- **Purpose**: Manage user access to nodes and departments (admin only)
- **Features**:
  - Select user
  - View current access (node + department assignments)
  - Grant new access (select node + departments)
  - Visual display of access hierarchy

## How to Access

### From Dashboard

1. **Navigate to Dashboard** (`/dashboard`)
2. **Click on the new buttons**:
   - **"User Management →"** - Opens user management page
   - **"Access Control →"** - Opens access control page

### Direct URLs

- Login: `http://localhost:5173/login`
- User Management: `http://localhost:5173/admin/users`
- Access Control: `http://localhost:5173/admin/access-control`

## Authentication Flow

### First Time Setup

1. **Create Admin User** (via API or SQL):
   ```bash
   POST /api/users
   {
     "email": "admin@example.com",
     "displayName": "Admin User",
     "authType": "Password"
   }
   ```

2. **Login**:
   - Go to `/login`
   - Enter email and temporary password
   - If temporary password, you'll be redirected to change password

3. **Change Password** (if required):
   - Enter new password (must meet complexity requirements)
   - Password requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character

### Using the System

1. **Login** at `/login`
2. **Access Dashboard** - All existing features work as before
3. **Manage Users** - Go to `/admin/users`
4. **Control Access** - Go to `/admin/access-control`

## API Integration

All API calls automatically include the JWT token from localStorage. The `apiClient` service handles:
- Adding `Authorization: Bearer <token>` header to all requests
- Redirecting to `/login` on 401 errors
- Token management (storage, retrieval, removal)

## Example: Grant Access to User

1. Go to `/admin/access-control`
2. Select a user from the dropdown
3. View their current access
4. In "Grant Access" form:
   - Select a node (e.g., "IN-N - India North")
   - Check departments (e.g., ACADEMIC, HR)
   - Click "Grant Access"

## Example: Reset User Password

1. Go to `/admin/users`
2. Find the user in the table
3. Click the key icon (🔑) next to their name
4. Confirm the reset
5. Copy the temporary password shown
6. Communicate it to the user

## Security Notes

- **JWT tokens** are stored in localStorage
- **Tokens expire** after 8 hours (configurable via `JWT_EXPIRES_IN`)
- **401 errors** automatically log out and redirect to login
- **All admin endpoints** require authentication
- **Temporary passwords** must be changed on first login

## Troubleshooting

### "Cannot connect to API server"
- Ensure backend is running on port 3001
- Check `VITE_API_BASE_URL` in `.env` file

### "401 Unauthorized"
- Token expired or invalid
- You'll be redirected to login automatically
- Login again to get a new token

### "Password change required"
- User has temporary password
- Must change password before accessing other features
- Redirect happens automatically

### Buttons not showing
- Ensure you've imported the new pages in `App.tsx`
- Check that routes are added to `<Routes>`
- Verify Dashboard.tsx has the new Link components

## Next Steps

To add more features:

1. **Create User Modal**: Add a form modal in `UserManagement.tsx`
2. **Department Management**: Create `/admin/departments` page
3. **Node Management**: Create `/admin/nodes` page
4. **School Assignment**: Add to Access Control page
5. **My Access Page**: Create `/my-access` for regular users to view their own access

## Files Created/Modified

### New Files
- `src/services/AuthService.ts` - Authentication service
- `src/pages/Login.tsx` - Login page
- `src/pages/UserManagement.tsx` - User management page
- `src/pages/AccessControl.tsx` - Access control page

### Modified Files
- `src/services/apiClient.ts` - Added JWT token handling
- `src/config/api.ts` - Added auth endpoints
- `src/App.tsx` - Added new routes
- `src/pages/Dashboard.tsx` - Added new navigation buttons
