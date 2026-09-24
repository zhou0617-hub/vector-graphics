import { request } from './client';
import type { ConvertResponse } from '@/types/api';

export function convertImage(
  file: File,
  params: Record<string, unknown> = {},
  signal?: AbortSignal
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('params', JSON.stringify(params));

  return request<ConvertResponse>('/api/conversions/convert', {
    method: 'POST',
    body: formData,
    signal,
  });
}
