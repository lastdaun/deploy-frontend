import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

// Import Schema và Type chuẩn từ file types
import { LoginSchema, type LoginInput } from '../types';
import { useAuthStore } from '../stores/useAuthStore';
import { notifySuccess } from '@/lib/notifyError';

export const useLoginForm = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Khởi tạo Form với React Hook Form + Zod
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Hàm xử lý khi Submit
  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.username, data.password);
      notifySuccess('Đăng nhập thành công.');
      const redirectPath = useAuthStore.getState().redirectByRole();
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';

      form.setError('root', {
        message: errorMessage,
      });
    }
  };

  return {
    form,
    onSubmit,
    isLoading,
  };
};
