import { request } from './client';
import type { LoginResponse, User } from '@/types/api';

export function register(email: string, password: string, username: string) {
  return request<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
  });
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request<User>('/api/users/me');
}
