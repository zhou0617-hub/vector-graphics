import { request } from './client';
import type { FileItem } from '@/types/api';

export function getMyFiles() {
  return request<FileItem[]>('/api/files/my');
}

export function deleteFile(id: number) {
  return request<void>(`/api/files/${id}`, { method: 'DELETE' });
}

export function batchDeleteFiles(ids: number[]) {
  return request<void>('/api/files/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}
