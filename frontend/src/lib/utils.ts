import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 下载文件（跨域可用）
 * 通过 fetch + blob 实现，不依赖 <a download> 属性
 * 部署到任何域名下都可以正常工作
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) {
    throw new Error(`下载失败 (${res.status})`);
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
