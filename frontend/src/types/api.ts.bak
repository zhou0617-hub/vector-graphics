export interface User {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface FileItem {
  id: number;
  name: string;
  originalUrl: string;
  svgUrl: string | null;
  format: string;
  source: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface UpscaleResponse {
  fileId: number;
  status: string;
  originalUrl: string | null;
  resultUrl: string | null;
  width: number | null;
  height: number | null;
  message: string;
}

export interface ConvertResponse {
  conversionId: number;
  fileId: number;
  status: string;
  svgUrl: string | null;
  originalUrl: string | null;
  width: number | null;
  height: number | null;
  message: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
