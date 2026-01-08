const TOKEN_KEY = 'LOOP_API_TOKEN';
const ROLE_KEY = 'LOOP_USER_ROLE';

export type UserRole = 'admin' | 'exec' | 'member';

export const authStorage = {
    // Token management
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),

    // Role management
    getRole: () => localStorage.getItem(ROLE_KEY) as UserRole | null,
    setRole: (role: UserRole) => localStorage.setItem(ROLE_KEY, role),

    // Clear all auth data
    clearAll: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
    },

    // Check if authenticated
    isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};
