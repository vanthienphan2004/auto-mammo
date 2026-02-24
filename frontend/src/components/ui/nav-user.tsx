import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconLogout } from "@tabler/icons-react";

interface NavUserProps {
  name: string;
  role: string;
  avatar: string;
}

export const NavUser = ({ user }: { user: NavUserProps }) => {
  return (
    <div className="flex items-center gap-3 px-2 py-1">
      <Avatar className="h-10 w-10 ring-2 ring-slate-100 dark:ring-slate-800">
        <AvatarImage
          src={user.avatar}
          alt={user.name}
          className="object-cover"
        />
        <AvatarFallback className="text-xs">
          {user.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {user.name}
        </p>
        <p className="text-xs text-slate-500 truncate">{user.role}</p>
      </div>
      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
        <IconLogout className="size-5" />
      </button>
    </div>
  );
};
