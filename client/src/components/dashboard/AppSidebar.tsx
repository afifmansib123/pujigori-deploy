"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  FolderKanban,
  Heart,
  User,
  Settings,
  LayoutDashboard,
  Users,
  DollarSign,
  FileText,
  PlusCircle,
  BarChart3,
  CreditCard,
  LogOut,
  Bookmark,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface AppSidebarProps {
  user: {
    userRole: "user" | "creator" | "admin";
    userInfo: {
      name: string;
      email: string;
      avatar?: string;
    };
  };
}

const navigationConfig : {
  [key in "user" | "creator" | "admin"]: {
    main: Array<{ name: string; href: string; icon: any }>;
    financial?: Array<{ name: string; href: string; icon: any }>;
    settings: Array<{ name: string; href: string; icon: any }>;
  };
} = {
  user: {
    main: [
      { name: "Dashboard", href: "/user/dashboard", icon: Home },
      { name: "Browse Projects", href: "/user/projects", icon: FolderKanban },
      { name: "My Wallet", href: "/user/wallet", icon: Wallet },
    ],
    settings: [],
  },
  creator: {
    main: [
      { name: "Dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
      { name: "My Projects", href: "/creator/projects", icon: FolderKanban },
      { name: "Create Project", href: "/creator/create", icon: PlusCircle },
    ],
    financial: [
      { name: "Wallet", href: "/creator/wallet", icon: Wallet },
    ],
    settings: [],
  },
  admin: {
    main: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "All Projects", href: "/admin/projects", icon: FolderKanban },
      { name: "Users", href: "/admin/users", icon: Users },
    ],
    financial: [
      { name: "Payment Approvals", href: "/admin/payments", icon: CreditCard },
    ],
    settings: [],
  },
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = user.userRole;
  const navigation = navigationConfig[role];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="PujiGori"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.main.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financial Section (for creator/admin) */}
        {navigation.financial && navigation.financial.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Financial</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.financial.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings Section - only show if there are settings items */}
        {navigation.settings && navigation.settings.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.settings.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        {/* User Info */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-700 font-medium text-sm">
                {user.userInfo.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.userInfo.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="px-2 pb-2">
          <SidebarMenuButton onClick={handleSignOut} className="w-full">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}