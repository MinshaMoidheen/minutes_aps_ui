# Authentication Integration

This document describes the authentication system integration between the frontend and backend.

## Overview

The authentication system supports three user types:
- **User**: Regular users
- **Admin**: Administrative users  
- **SuperAdmin**: Super administrative users

## Backend API

The backend provides a unified login endpoint at `http://localhost:5020/api/v1/auth/login` that handles all user types.

### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login Response
```json
{
  "message": "user login successful",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    // ... other user fields
  },
  "userType": "user|admin|superadmin",
  "accessToken": "jwt_token"
}
```

## Frontend Integration

### Components

1. **AuthProvider** (`src/context/auth-context.tsx`)
   - Manages authentication state
   - Provides login/logout functions
   - Handles user data persistence

2. **UserAuthForm** (`src/app/(auth)/auth/components/user-auth-form.tsx`)
   - Login form component
   - Integrates with AuthProvider
   - Handles form validation

3. **ProtectedRoute** (`src/components/protected-route.tsx`)
   - Protects routes based on authentication status
   - Supports user type restrictions
   - Handles loading states

4. **ProfileDropdown** (`src/components/profile-dropdown.tsx`)
   - Shows user information
   - Provides logout functionality
   - Displays user type

### API Integration

The frontend uses RTK Query for API calls:

- **Login**: `POST /api/v1/auth/login`
- **Logout**: `POST /api/v1/auth/logout`
- **Refresh Token**: `POST /api/v1/auth/refresh-token`

### Configuration

Update `src/constants.ts` to point to your backend:

```typescript
export const BASE_URL = 'http://localhost:5020/api/v1'
```

## Usage

### Login
Users can login using their email and password. The system will automatically determine their user type and redirect them accordingly.

### Protected Routes
Wrap components with `ProtectedRoute` to require authentication:

```tsx
<ProtectedRoute allowedUserTypes={['admin', 'superadmin']}>
  <AdminComponent />
</ProtectedRoute>
```

### User Information
Access user information using the `useAuth` hook:

```tsx
const { user, isAuthenticated, login, logout } = useAuth()
```

## Testing

1. Start the backend server on port 5020
2. Start the frontend development server
3. Navigate to `/auth/sign-in`
4. Login with valid credentials
5. Verify user information is displayed on the dashboard

## User Types

- **SuperAdmin**: Full system access
- **Admin**: Administrative access
- **User**: Standard user access

The system automatically handles user type detection and appropriate access control.

