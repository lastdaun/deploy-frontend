import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { useProfileQuery } from '@/features/profile/hooks/useProfileQuery';
import { resolveUserAvatarUrl } from '@/lib/prescriptionImageUrl';

const SIZE_CLASSES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
};

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ size = 'md', className }: UserAvatarProps) {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useProfileQuery();

  const rawAvatar = profile?.imageUrl || user?.avatar;
  const avatarSrc = rawAvatar ? resolveUserAvatarUrl(rawAvatar) : undefined;
  const initials = getInitials(user?.name);

  return (
    <Avatar className={`${SIZE_CLASSES[size]} border border-sidebar-border shrink-0 ${className ?? ''}`}>
      <AvatarImage src={avatarSrc ?? undefined} alt={user?.name ?? 'User'} />
      <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground font-semibold uppercase">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
