import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { RegisterSchema, type RegisterInput } from '../types';
import { useAuthStore } from '../stores/useAuthStore';
import { notifySuccess } from '@/lib/notifyError';

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.registerUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      dob: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data, avatarFile);
      setAvatarFile(null);
      notifySuccess('Đăng ký thành công. Vui lòng đăng nhập.');
      navigate('/auth/login');
    } catch (error: unknown) {
      if (error instanceof Error) {
        const msg = error.message;

        if (msg.toLowerCase().includes('age') || msg.includes('18')) {
          form.setError('dob', { message: msg });
        } else if (msg.toLowerCase().includes('username') || msg.includes('exists')) {
          form.setError('username', { message: 'Username đã được sử dụng' });
        } else {
          form.setError('root', { message: msg });
        }
      }
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    avatarFile,
    setAvatarFile,
  };
};
