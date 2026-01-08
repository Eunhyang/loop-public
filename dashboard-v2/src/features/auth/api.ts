import { httpClient } from '@/services/http';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    role: 'admin' | 'exec' | 'member';
}

export const authApi = {
    login: (data: LoginRequest) =>
        httpClient.post<LoginResponse>('/oauth/dashboard-login', data),
};
