import { Crown, User, UserMinus } from 'lucide-react';
import { isHead } from '@/lib/roles';
import type { MemberRole } from '@/lib/supabase/types';

interface Member {
  id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  is_creator: boolean;
  visitor_expires_at: string | null;
  profile: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface MemberListProps {
  members: Member[];
  currentUserId: string | null;
  onMemberClick?: (userId: string) => void;
  isCurrentUserHead?: boolean;
  /** @deprecated use isCurrentUserHead */
  isCurrentUserOwner?: boolean;
  onKickMember?: (userId: string) => void;
  kickingUserId?: string | null;
}

function Avatar({
  name,
  size = 'md',
  avatarUrl,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  avatarUrl?: string | null;
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClass =
    size === 'sm' ? 'h-8 w-8 text-xs' :
    size === 'lg' ? 'h-20 w-20 text-2xl' :
    'h-10 w-10 text-sm';

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${sizeClass}`}
      />
    );
  }

  // Deterministic colour from name
  const colours = [
    'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500',
    'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
  ];
  const colorIndex =
    name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colours.length;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClass} ${colours[colorIndex]}`}
    >
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}

function formatJoinDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatExpiry(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Expired';
  if (diffDays === 1) return 'Expires tomorrow';
  if (diffDays <= 7) return `Expires in ${diffDays} days`;
  return `Expires ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function RoleBadge({ member }: { member: Member }) {
  if (member.is_creator) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
        <Crown className="h-3 w-3" />
        Creator
      </span>
    );
  }
  if (isHead(member.role)) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
        <Crown className="h-3 w-3" />
        Head
      </span>
    );
  }
  if (member.role === 'visitor') {
    return (
      <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-300">
        Visitor
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs text-slate-400">
      Member
    </span>
  );
}

export function MemberList({
  members,
  currentUserId,
  onMemberClick,
  isCurrentUserHead,
  isCurrentUserOwner,
  onKickMember,
  kickingUserId,
}: MemberListProps) {
  const canManage = isCurrentUserHead ?? isCurrentUserOwner ?? false;

  // Heads first, then members, then visitors; alphabetical within each group
  const sorted = [...members].sort((a, b) => {
    const rankA = isHead(a.role) ? 0 : a.role === 'visitor' ? 2 : 1;
    const rankB = isHead(b.role) ? 0 : b.role === 'visitor' ? 2 : 1;
    if (rankA !== rankB) return rankA - rankB;
    return a.profile.display_name.localeCompare(b.profile.display_name);
  });

  return (
    <ul className="flex flex-col divide-y divide-slate-800">
      {sorted.map((member) => {
        const isMe = member.user_id === currentUserId;
        const canKick = canManage && onKickMember && !isHead(member.role) && !isMe;
        const isBeingKicked = kickingUserId === member.user_id;

        return (
          <li
            key={member.id}
            className={`flex items-center gap-3 py-3 ${onMemberClick ? 'cursor-pointer hover:bg-slate-800/50 rounded-xl px-2 -mx-2' : ''}`}
            onClick={() => onMemberClick?.(member.user_id)}
          >
            <Avatar name={member.profile.display_name} avatarUrl={member.profile.avatar_url} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="truncate text-sm font-medium text-white">
                  {member.profile.display_name}
                </span>
                {isMe && (
                  <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
                    you
                  </span>
                )}
              </div>
              {member.role === 'visitor' && member.visitor_expires_at ? (
                <p className="text-xs text-blue-400">{formatExpiry(member.visitor_expires_at)}</p>
              ) : (
                <p className="text-xs text-slate-500">Joined {formatJoinDate(member.joined_at)}</p>
              )}
            </div>

            {/* Kick button or role badge */}
            {canKick ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onKickMember!(member.user_id);
                }}
                disabled={isBeingKicked}
                className="flex items-center gap-1 rounded-full border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:border-red-500 hover:bg-red-500/10 disabled:opacity-40"
              >
                <UserMinus className="h-3 w-3" />
                {isBeingKicked ? 'Removing…' : 'Kick'}
              </button>
            ) : (
              <RoleBadge member={member} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export { Avatar };
