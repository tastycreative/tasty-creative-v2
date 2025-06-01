import {
  AppWindow,
  Calendar1,
  House,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import Link from "next/link";

const SideMenu = () => {
  return (
    <div className="flex-1 flex flex-col justify-between">
      <nav className="space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
        >
          <House className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span className="font-medium">Home</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
        >
          <LayoutDashboard className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span className="font-medium">Dashboard</span>
        </Link>

        <Link
          href="/apps"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
        >
          <AppWindow className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span className="font-medium">Apps</span>
        </Link>

        <Link
          href="/calendar"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
        >
          <Calendar1 className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span className="font-medium">Calendar</span>
        </Link>
      </nav>

      <Link
        href="/settings"
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 mt-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-4"
      >
        <Settings className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
        <span className="font-medium">Settings</span>
      </Link>
    </div>
  );
};

export default SideMenu;
