import { request } from './client';
import type { User } from '@/types/api';

export function getUserByUsername(username: string) {
  return request<User>(`/api/users/${username}`);
}

export function updateProfile(data: { avatarUrl?: string; bio?: string }) {
  return request<User>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function updateUsername(username: string) {
  return request<User>('/api/users/me/username', {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  });
}

export function updatePassword(oldPassword: string, newPassword: string) {
  return request<void>('/api/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<User>('/api/users/me/avatar', {
    method: 'POST',
    body: formData,
  });
}
