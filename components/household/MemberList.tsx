import { Crown, User, UserMinus } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface MemberListProps {
  members: Member[];
  currentUserId: string | null;
  onMemberClick?: (userId: string) => void;
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

export function MemberList({
  members,
  currentUserId,
  onMemberClick,
  isCurrentUserOwner,
  onKickMember,
  kickingUserId,
}: MemberListProps) {
  // Owner always first
  const sorted = [...members].sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (b.role === 'owner' && a.role !== 'owner') return 1;
    return a.profile.display_name.localeCompare(b.profile.display_name);
  });

  return (
    <ul className="flex flex-col divide-y divide-slate-800">
      {sorted.map((member) => {
        const isMe = member.user_id === currentUserId;
        const canKick = isCurrentUserOwner && onKickMember && member.role !== 'owner' && !isMe;
        const isBeingKicked = kickingUserId === member.user_id;

        return (
          <li
            key={member.id}
            className={`flex items-center gap-3 py-3 ${onMemberClick ? 'cursor-pointer hover:bg-slate-800/50 rounded-xl px-2 -mx-2' : ''}`}
            onClick={() => onMemberClick?.(member.user_id)}
          >
            <Avatar name={member.profile.display_name} avatarUrl={member.profile.avatar_url} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-white">
                  {member.profile.display_name}
                </span>
                {isMe && (
                  <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
                    you
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Joined {formatJoinDate(member.joined_at)}</p>
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
            ) : member.role === 'owner' ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
                <Crown className="h-3 w-3" />
                Owner
              </span>
            ) : (
              <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs text-slate-400">
                Member
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export { Avatar };
