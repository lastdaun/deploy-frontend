// src/features/auth/api/auth-api.ts
import { api } from '@/lib/axios';
import type {
  LoginInput,
  RegisterInput,
  AuthResponse,
  ApiResponse,
  UserRegistrationResult,
} from '../types';

export interface LogoutRequest {
  token: string;
}

export const authApi = {
  // 1. Login
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data.result;
  },

  // 2. Register — JSON nếu không có ảnh (tương thích mọi API); multipart khi có file avatar
  register: async (data: RegisterInput, avatarFile?: File | null): Promise<UserRegistrationResult> => {
    const payload = {
      username: data.username,
      password: data.password,
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
    };

    if (!avatarFile) {
      const response = await api.post<ApiResponse<UserRegistrationResult>>('/users/registration', payload);
      return response.data.result;
    }

    const formData = new FormData();
    formData.append('registration', JSON.stringify(payload));
    formData.append('avatar', avatarFile);
    const response = await api.post<ApiResponse<UserRegistrationResult>>('/users/registration', formData);
    return response.data.result;
  },

  // 3. Logout
  logout: (data: LogoutRequest): Promise<void> => {
    return api.post('/auth/logout', data);
  },

  // 4. Refresh token

  refreshToken: async (token: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/refresh', { token });
    return response.data; // Trả về toàn bộ ApiResponse để Store xử lý .result
  },
};