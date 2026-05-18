'use client';

import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, Target, ClipboardCheck, Users, Settings,
  BarChart3, FileText, Shield, Bell, ChevronDown, Loader2, Menu, X, Check, LogOut, Home
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '@/lib/actions';

const NAV_ITEMS = {
  employee: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Goals', href: '/goals', icon: Target },
    { label: 'Check-ins', href: '/checkins', icon: ClipboardCheck },
  ],
  manager: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Goals', href: '/goals', icon: Target },
    { label: 'Approvals', href: '/manager/approvals', icon: Shield },
    { label: 'Team Check-ins', href: '/manager/checkins', icon: ClipboardCheck },
    { label: 'My Team', href: '/manager/team', icon: Users },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'All Goals', href: '/admin/goals', icon: Target },
    { label: 'Cycles', href: '/admin/cycles', icon: Settings },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Shared Goals', href: '/admin/shared-goals', icon: Shield },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Escalations', href: '/admin/escalations', icon: Shield },
    { label: 'Audit Log', href: '/admin/audit', icon: FileText },
  ]
};

const ROLE_COLORS: Record<string, string> = {
  employee: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, availableUsers, switchUser, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const notifs = await getNotifications(currentUser.id);
      setNotifications(notifs);
    })();
  }, [currentUser]);

  const handleReadNotification = async (id: string, link?: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (link) router.push(link);
  };

  if (loading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const navItems = NAV_ITEMS[currentUser.role as keyof typeof NAV_ITEMS] || [];
  const pageTitle = navItems.find(i => pathname === i.href || pathname.startsWith(i.href + '/'))?.label || 'Dashboard';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar flex flex-col border-r border-border transition-transform transform md:relative md:translate-x-0 print:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <Image src="/logo.png" alt="Velora" width={32} height={32} className="rounded-lg mr-3" />
          <div>
            <h1 className="font-bold text-sidebar-foreground leading-tight tracking-tight">Velora</h1>
            <p className="text-[10px] text-muted-foreground">Goal Tracker</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} prefetch={true}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary ml-0 pl-2.5"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-border" />

        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-sidebar-accent transition-colors text-left cursor-pointer">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser.name}</p>
                  <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-4 font-medium', ROLE_COLORS[currentUser.role])}>
                    {currentUser.role}
                  </Badge>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            } />
            <DropdownMenuContent align="start" className="w-56 mb-2">
              <DropdownMenuGroup>
                <p className="px-2 py-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Organization Directory</p>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {availableUsers.map((user) => (
                <DropdownMenuItem key={user.id} onClick={() => switchUser(user.id)} className={cn(currentUser.id === user.id && 'bg-accent')}>
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.role} • {user.department}</p>
                    </div>
                    {currentUser.id === user.id && <Check className="w-3 h-3 text-primary ml-auto" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-1 mt-2">
            <Link href="/" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground h-8">
                <Home className="w-3.5 h-3.5 mr-1.5" /> Home
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground h-8 hover:text-red-500">
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0 print:hidden sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-sm font-semibold">{pageTitle}</h2>
              <p className="text-xs text-muted-foreground hidden md:block">{currentUser.department} • FY 2026-27</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="relative rounded-full w-9 h-9">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background"></span>
                  )}
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-80 mt-1 max-h-96 overflow-y-auto">
                <DropdownMenuGroup>
                  <div className="px-3 py-2 flex items-center justify-between sticky top-0 bg-popover/90 backdrop-blur border-b z-10">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unreadCount > 0 && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">{unreadCount} New</Badge>}
                  </div>
                </DropdownMenuGroup>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">You have no notifications.</div>
                ) : (
                  notifications.map(notif => (
                    <DropdownMenuItem 
                      key={notif.id} 
                      className={cn("px-3 py-3 items-start gap-3 border-b last:border-0", !notif.read && "bg-muted/30")}
                      onClick={() => handleReadNotification(notif.id, notif.link)}
                    >
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", notif.read ? "bg-transparent" : "bg-primary")} />
                      <div className="flex-1 space-y-1">
                        <p className={cn("text-sm leading-tight", !notif.read ? "font-semibold" : "font-medium text-muted-foreground")}>{notif.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">{children}</main>
      </div>
    </div>
  );
}
