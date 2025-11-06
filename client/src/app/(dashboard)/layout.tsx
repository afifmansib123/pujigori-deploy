"use client";

import { useGetAuthUserQuery } from "@/state/api";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: authUser, isLoading, error } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !authUser) {
      router.push("/");
    }
  }, [authUser, isLoading, router]);

  // Role-based route protection
  useEffect(() => {
    if (authUser && pathname) {
      const role = authUser.userRole;
      const routeRole = pathname.split("/")[1]; // Extract 'user', 'creator', or 'admin'

      // Redirect if user tries to access wrong dashboard
      if (role === "user" && routeRole !== "user") {
        router.push("/user/dashboard");
      } else if (role === "creator" && routeRole !== "creator") {
        router.push("/creator/dashboard");
      } else if (role === "admin" && routeRole !== "admin") {
        router.push("/admin/dashboard");
      }
    }
  }, [authUser, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !authUser) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar user={authUser as any} />
        <SidebarInset className="flex-1">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}