import { Navigate, Outlet } from 'react-router-dom';
import { authStorage } from '@/features/auth/storage';

/**
 * Route Guard component that protects routes requiring authentication.
 * Redirects to /login if no valid token exists.
 */
export const ProtectedRoute = () => {
    const isAuthenticated = authStorage.isAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
