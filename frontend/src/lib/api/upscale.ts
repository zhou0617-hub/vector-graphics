import { request } from './client';
import type { UpscaleResponse } from '@/types/api';

export function upscaleImage(
  file: File,
  model: string = 'anime',
  signal?: AbortSignal
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);

  return request<UpscaleResponse>('/api/conversions/upscale', {
    method: 'POST',
    body: formData,
    signal,
  });
}
