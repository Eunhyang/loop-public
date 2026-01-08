const TOKEN_KEY = 'LOOP_API_TOKEN';

export const authStorage = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clearToken: () => localStorage.removeItem(TOKEN_KEY),

    // Optional: User role storage if needed in future
    // getUserRole: () => ... 
};
