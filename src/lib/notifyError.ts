import { isAxiosError } from 'axios';
import { toast } from 'sonner';

export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const m = error.response?.data?.message;
    toast.error(
      typeof m === 'string' && m.length > 0 ? m : (error.message || fallback),
    );
    return;
  }
  if (error instanceof Error) {
    toast.error(error.message || fallback);
    return;
  }
  toast.error(fallback);
}

export function notifyInfo(message: string) {
  toast.info(message);
}
