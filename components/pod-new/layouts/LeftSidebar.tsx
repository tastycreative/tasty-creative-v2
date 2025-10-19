"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  PlayCircle,
  CalendarIcon,
  Upload,
  Users,
  Settings,
  Users2,
  Zap,
  Kanban,
  FileText,
  Shield,
  Sparkles,
  Mic,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTeams } from "@/hooks/useTeams";

type SubNavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavItem = {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant?: "primary" | "secondary" | "success" | "warning" | "alert";
  } | null;
  subItems?: SubNavItem[];
  isTeamAccordion?: boolean;
};

const navigation: { title: string; items: NavItem[] }[] = [
  {
    title: "Core",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Board",
        icon: Kanban,
        subItems: [],
        isTeamAccordion: true,
      },
      {
        title: "Workspace",
        href: "/workspace",
        icon: Briefcase,
      },
      {
        title: "Generative AI",
        icon: Sparkles,
        subItems: [
          {
            title: "Voice Generator",
            href: "/generative-ai/voice",
            icon: Mic,
          },
        ],
      },
    ],
  },
  {
    title: "Content & Schedule",
    items: [
      {
        title: "Schedule Content",
        href: "/schedule",
        icon: Calendar,
      },
      {
        title: "Live Stream",
        href: "/live-stream",
        icon: PlayCircle,
        badge: { text: "Live", variant: "success" },
      },
      { title: "Calendar", href: "/calendar", icon: CalendarIcon },
    ],
  },
  {
    title: "Workflow",
    items: [
      {
        title: "OTP/PTR",
        href: "/forms",
        icon: FileText,
        badge: { text: "New", variant: "primary" },
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "My Models",
        href: "/my-models",
        icon: Users,
      },
      { title: "Team", href: "/team", icon: Users2 },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Admin", href: "/admin", icon: Shield },
    ],
  },
];

function Badge({
  text,
  variant = "primary",
}: {
  text: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "alert";
}) {
  const variantClasses = {
    primary: "bg-blue-500/20 dark:bg-blue-500/30 text-blue-300 dark:text-blue-200 border-blue-500/30 dark:border-blue-400/40",
    secondary: "bg-gray-500/20 dark:bg-gray-500/30 text-gray-300 dark:text-gray-200 border-gray-500/30 dark:border-gray-400/40",
    success: "bg-green-500/20 dark:bg-green-500/30 text-green-300 dark:text-green-200 border-green-500/30 dark:border-green-400/40",
    warning: "bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-300 dark:text-yellow-200 border-yellow-500/30 dark:border-yellow-400/40",
    alert: "bg-red-500/20 dark:bg-red-500/30 text-red-300 dark:text-red-200 border-red-500/30 dark:border-red-400/40",
  } as const;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-medium rounded-full border ${variantClasses[variant]}`}
    >
      {text}
    </span>
  );
}

interface LeftSidebarProps {
  collapsed?: boolean;
}

export default function LeftSidebar({ collapsed = false }: LeftSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const currentTeamId = searchParams.get('team');
  const { teams, loading: teamsLoading, refetch } = useTeams();
  
  // Team creation modal state
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    projectPrefix: ''
  });

  // Filter teams based on user access
  const getAccessibleTeams = () => {
    if (!session?.user) return [];
    
    const userRole = session.user.role;
    const userId = session.user.id;
    const userEmail = session.user.email;
    
    // ADMIN and MODERATOR can see all teams
    if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
      return teams;
    }
    
    // Regular users can only see teams they're members of
    return teams.filter(team => {
      // Check if user is a member of this team
      return team.members?.some(member => 
        member.id === userId || member.email === userEmail
      );
    });
  };

  const accessibleTeams = getAccessibleTeams();

  const handleTeamSelect = (teamId: string) => {
    router.push(`/board?team=${teamId}`);
  };

  const handleAddNewTeam = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion from toggling
    setShowCreateTeamModal(true);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamFormData.name.trim() || !teamFormData.projectPrefix.trim()) {
      alert('Team name and project prefix are required');
      return;
    }

    setIsCreatingTeam(true);
    
    try {
      const response = await fetch('/api/pod/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamFormData.name.trim(),
          description: teamFormData.description.trim(),
          projectPrefix: teamFormData.projectPrefix.trim().toUpperCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      const result = await response.json();
      
      if (result.success && result.team) {
        // Reset form
        setTeamFormData({ name: '', description: '', projectPrefix: '' });
        setShowCreateTeamModal(false);
        
        // Refresh teams list
        await refetch();
        
        // Navigate to the new team's board
        router.push(`/board?team=${result.team.id}`);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const closeCreateTeamModal = () => {
    setShowCreateTeamModal(false);
    setTeamFormData({ name: '', description: '', projectPrefix: '' });
  };

  if (collapsed) {
    return null; // Hide completely when collapsed
  }

  return (
    <>
    <aside
      className="hidden xl:flex xl:flex-col sticky top-24 self-start rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/10 shadow-sm w-[280px] overflow-hidden backdrop-blur-sm transition-all duration-300"
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="px-4 py-4 border-b border-slate-200/50 dark:border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm text-slate-800 dark:text-slate-200 font-semibold">
            Tasty Creative Pod
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">POD Dashboard</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6 min-h-0">
        {navigation.map((section) => (
          <div key={section.title} className="px-2">
            <div className="px-2 py-1">
              <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                // Check if this is the team accordion item
                if (item.isTeamAccordion) {
                  // Always show Board accordion, even if user has no team access
                  
                  const isAnyTeamActive = pathname === "/board" || pathname?.startsWith("/board?");
                  const shouldAutoExpand = !teamsLoading && accessibleTeams.length > 0;
                  
                  return (
                    <li key={item.title} className="relative">
                      <Accordion type="single" collapsible value={shouldAutoExpand ? item.title : undefined}>
                        <AccordionItem value={item.title} className="border-none">
                          <AccordionTrigger
                            className={`group relative flex items-center justify-between px-3.5 py-2.75 rounded-xl transition-all duration-200 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 [&[data-state=open]>svg:last-child]:rotate-180 ${
                              isAnyTeamActive
                                ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/20 text-white dark:text-white ring-1 ring-inset ring-indigo-400/40 shadow-lg shadow-indigo-500/10"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.08] hover:text-slate-800 dark:hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <item.icon
                                className={`w-5 h-5 shrink-0 transition-colors ${
                                  isAnyTeamActive
                                    ? "text-indigo-300 dark:text-indigo-300"
                                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                }`}
                              />
                              <span className={`text-sm truncate ${isAnyTeamActive ? "font-medium" : ""}`}>
                                {item.title}
                              </span>
                            </div>
                            {/* Only show plus icon for ADMIN users */}
                            {session?.user?.role === 'ADMIN' && (
                              <button
                                onClick={handleAddNewTeam}
                                className={`p-1 rounded-md absolute right-8 top-1/2 -translate-y-1/2 transition-colors hover:bg-white/10 dark:hover:bg-white/10 ${
                                  isAnyTeamActive
                                    ? "text-indigo-300 dark:text-indigo-300 hover:text-white dark:hover:text-white"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                }`}
                                title="Add new team"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </AccordionTrigger>
                          <AccordionContent className="pb-1 pt-2 px-2">
                            <ul className="space-y-1">
                              {teamsLoading ? (
                                <li>
                                  <div className="group relative flex items-center gap-3 px-3.5 py-2.5 ml-9 rounded-lg text-slate-500 dark:text-slate-400">
                                    <div className="w-4 h-4 shrink-0" />
                                    <span className="text-sm truncate">Loading teams...</span>
                                  </div>
                                </li>
                              ) : accessibleTeams.length > 0 ? (
                                accessibleTeams.map((team) => {
                                  const isTeamActive = currentTeamId === team.id;
                                  return (
                                    <li key={team.id}>
                                      <button
                                        onClick={() => handleTeamSelect(team.id)}
                                        className={`group relative flex items-center gap-3 px-3.5 py-2.5 ml-9 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 w-full text-left ${
                                          isTeamActive
                                            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-400/30 shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/[0.05] hover:text-slate-700 dark:hover:text-slate-200"
                                        }`}
                                      >
                                        <Kanban className={`w-4 h-4 shrink-0 ${isTeamActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                                        <span className={`text-sm truncate ${isTeamActive ? "font-medium" : ""}`}>{team.name}</span>
                                        {isTeamActive && (
                                          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full opacity-80" />
                                        )}
                                      </button>
                                    </li>
                                  );
                                })
                              ) : (
                                <li>
                                  <div className="group relative flex items-center gap-3 px-3.5 py-2.5 ml-9 rounded-lg text-slate-500 dark:text-slate-400">
                                    <div className="w-4 h-4 shrink-0" />
                                    <span className="text-sm truncate">No teams found</span>
                                  </div>
                                </li>
                              )}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </li>
                  );
                }
                
                // Check if this item has sub-items (accordion)
                if (item.subItems && item.subItems.length > 0) {
                  const isAnySubItemActive = item.subItems.some(
                    (subItem) => pathname === subItem.href || pathname?.startsWith(subItem.href + "/")
                  );

                  return (
                    <li key={item.title}>
                      <Accordion type="single" collapsible defaultValue={isAnySubItemActive ? item.title : undefined}>
                        <AccordionItem value={item.title} className="border-none">
                          <AccordionTrigger
                            className={`group relative flex items-center justify-between px-3.5 py-2.75 rounded-xl transition-all duration-200 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 [&[data-state=open]>svg]:rotate-180 ${
                              isAnySubItemActive
                                ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/20 text-white dark:text-white ring-1 ring-inset ring-indigo-400/40 shadow-lg shadow-indigo-500/10"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.08] hover:text-slate-800 dark:hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <item.icon
                                className={`w-5 h-5 shrink-0 transition-colors ${
                                  isAnySubItemActive
                                    ? "text-indigo-300 dark:text-indigo-300"
                                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                }`}
                              />
                              <span className={`text-sm truncate ${isAnySubItemActive ? "font-medium" : ""}`}>
                                {item.title}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-1 pt-2 px-2">
                            <ul className="space-y-1">
                              {item.subItems.map((subItem) => {
                                const isSubItemActive = pathname === subItem.href;
                                return (
                                  <li key={subItem.title}>
                                    <Link
                                      href={subItem.href}
                                      aria-current={isSubItemActive ? "page" : undefined}
                                      className={`group relative flex items-center gap-3 px-3.5 py-2.5 ml-9 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                                        isSubItemActive
                                          ? "bg-indigo-500/20 dark:bg-indigo-500/20 text-indigo-200 dark:text-indigo-200"
                                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/[0.05] hover:text-slate-700 dark:hover:text-slate-200"
                                      }`}
                                    >
                                      <subItem.icon className="w-4 h-4 shrink-0" />
                                      <span className="text-sm truncate">{subItem.title}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </li>
                  );
                }

                // Regular nav item (no sub-items)
                
                // Hide Admin nav item if user is not ADMIN
                if (item.title === "Admin" && session?.user?.role !== "ADMIN") {
                  return null;
                }
                
                const isActive = pathname === item.href;
                return (
                  <li key={item.title}>
                    <Link
                      href={item.href!}
                      aria-current={isActive ? "page" : undefined}
                      className={`group relative flex items-center gap-4 px-3.5 py-2.75 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/20 text-white dark:text-white ring-1 ring-inset ring-indigo-400/40 shadow-lg shadow-indigo-500/10"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.08] hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive
                            ? "text-indigo-300 dark:text-indigo-300"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                        }`}
                      />
                      <span
                        className={`text-sm truncate ${isActive ? "font-medium" : ""}`}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <div className="ml-auto">
                          <Badge
                            text={item.badge.text}
                            variant={item.badge.variant}
                          />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 dark:bg-indigo-400 rounded-full opacity-60" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Add Theme Toggle to Settings section */}
            {section.title === "Settings" && (
              <div className="mt-3 px-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Theme
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </aside>

    {/* Create Team Modal - Outside sidebar to cover full screen */}
    {showCreateTeamModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Create New Team
            </h3>
            <button
              onClick={closeCreateTeamModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Name *
              </label>
              <input
                id="teamName"
                type="text"
                value={teamFormData.name}
                onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter team name"
                disabled={isCreatingTeam}
              />
            </div>

            <div>
              <label htmlFor="projectPrefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Prefix * <span className="text-xs text-gray-500">(3-5 characters)</span>
              </label>
              <input
                id="projectPrefix"
                type="text"
                value={teamFormData.projectPrefix}
                onChange={(e) => setTeamFormData({ ...teamFormData, projectPrefix: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ABC"
                maxLength={5}
                disabled={isCreatingTeam}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={teamFormData.description}
                onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Enter team description (optional)"
                disabled={isCreatingTeam}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={closeCreateTeamModal}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isCreatingTeam}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCreatingTeam || !teamFormData.name.trim() || !teamFormData.projectPrefix.trim()}
              >
                {isCreatingTeam ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Team'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}
