'use client';

import { logout } from '@/app/auth/actions';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Building2,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';

// --- Rol Bazlı Menü Tanımları ---
const menuByRole: Record<string, { label: string; href: string; icon: React.ElementType }[]> = {
  super_admin: [
    { label: 'Genel Bakış', href: '/dashboard/super-admin', icon: LayoutDashboard },
    { label: 'Üniversiteler', href: '/dashboard/super-admin/organizations', icon: Building2 },
    { label: 'Tüm Kullanıcılar', href: '/dashboard/super-admin/users', icon: Users },
    { label: 'Sistem Ayarları', href: '/dashboard/super-admin/settings', icon: Settings },
  ],
  admin: [
    { label: 'Genel Bakış', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Dersler', href: '/dashboard/admin/courses', icon: BookOpen },
    { label: 'Kullanıcı Yönetimi', href: '/dashboard/admin/users', icon: Users },
    { label: 'Ayarlar', href: '/dashboard/admin/settings', icon: Settings },
  ],
  instructor: [
    { label: 'Genel Bakış', href: '/dashboard/instructor', icon: LayoutDashboard },
    { label: 'Derslerim', href: '/dashboard/instructor/courses', icon: BookOpen },
    { label: 'Ayarlar', href: '/dashboard/instructor/settings', icon: Settings },
  ],
  student: [
    { label: 'Genel Bakış', href: '/dashboard/student', icon: LayoutDashboard },
    { label: 'Derslerim', href: '/dashboard/student/courses', icon: GraduationCap },
    { label: 'Görevlerim', href: '/dashboard/student/tasks', icon: ClipboardList },
    { label: 'Ayarlar', href: '/dashboard/student/settings', icon: Settings },
  ],
};

// --- Rol Renk ve İkon Bilgileri ---
const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  super_admin: { label: 'Süper Admin', color: 'text-purple-400', icon: Shield },
  admin: { label: 'Okul Admini', color: 'text-blue-400', icon: Building2 },
  instructor: { label: 'Hoca', color: 'text-green-400', icon: GraduationCap },
  student: { label: 'Öğrenci', color: 'text-yellow-400', icon: GraduationCap },
};

interface SidebarProps {
  role: string;
  fullName: string;
  email: string;
  orgName?: string | null;
}

export default function Sidebar({ role, fullName, email, orgName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = menuByRole[role] ?? [];
  const config = roleConfig[role] ?? { label: role, color: 'text-gray-400', icon: LayoutDashboard };
  const RoleIcon = config.icon;

  return (
    <aside
      className={`
        relative flex flex-col h-screen
        bg-[#0a0f1e]/95 backdrop-blur-xl
        border-r border-white/5
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
      `}
    >
      {/* Gradient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/5 to-transparent" />
      </div>

      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
          <span className="text-white font-bold text-sm">CF</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-base tracking-tight">CampusFlow</span>
        )}
      </div>

      {/* Okul Adı ve Rol Rozeti */}
      {!collapsed && (
        <div className="mx-3 mt-4 flex flex-col gap-1.5">
          {orgName ? (
            <div className="px-2 text-xs font-semibold text-gray-400 truncate" title={orgName}>
              {orgName}
            </div>
          ) : (
            <div className="px-2 text-xs font-semibold text-purple-300 truncate">
              Sistem Yöneticisi
            </div>
          )}
          <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <div className={`flex items-center gap-2 text-xs font-semibold ${config.color}`}>
              <RoleIcon size={13} />
              <span>{config.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nav Menüsü */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-150 relative
                ${isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              {/* Aktif Göstergesi */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-400 rounded-full" />
              )}
              <Icon size={18} className={isActive ? 'text-purple-400' : 'group-hover:text-white'} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Alt: Kullanıcı Profili */}
      <div className="p-2 border-t border-white/5">
        {!collapsed ? (
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer group"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-xs font-semibold truncate">{fullName}</p>
                <p className="text-gray-500 text-[10px] truncate">{email}</p>
              </div>
              <LogOut size={14} className="text-gray-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
            </button>
          </form>
        ) : (
          <form action={logout} className="flex justify-center py-1">
            <button
              type="submit"
              title="Çıkış Yap"
              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <span className="text-white text-xs font-bold">
                {fullName?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </button>
          </form>
        )}
      </div>

      {/* Collapse Butonu */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
          absolute -right-3 top-[72px]
          w-6 h-6 rounded-full
          bg-[#0a0f1e] border border-white/10
          flex items-center justify-center
          text-gray-400 hover:text-white
          transition-colors shadow-lg
          z-10
        "
        aria-label={collapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
 