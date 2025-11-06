"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import {
  Search,
  Plus,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  Grid3X3,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const Navbar = () => {
  const { user: amplifyUser } = useAuthenticator((context) => [context.user]);

  // Get user data from database using Cognito ID
  const {
    data: authResponse,
    isLoading,
    error,
  } = useGetAuthUserQuery(undefined, {
    skip: !amplifyUser, // Skip the query if no amplify user
  });

  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  // Extract user data from the structure
  const authUser = authResponse?.userInfo; // This is the database user data
  const userRole = authResponse?.userRole; // This is the Cognito role

  // User is authenticated if amplify user exists
  const isAuthenticated = !!amplifyUser;

  // Handle Google OAuth users who might not be in database yet
  const isGoogleOAuthUser =
    amplifyUser?.username?.includes("google") ||
    amplifyUser?.username?.includes("Google");
  const isUserBeingCreated =
    error && (error as any)?.status === "USER_NOT_IN_DB";

  // Use database user data if available, otherwise use Amplify data as fallback
  let displayUser = authUser;

  if (!authUser && amplifyUser) {
    // For Google OAuth users, extract name from Amplify data
    const googleName =
      amplifyUser.signInDetails?.loginId?.split("@")[0] ||
      amplifyUser.username ||
      "Google User";

    displayUser = {
      name: googleName,
      email: amplifyUser.signInDetails?.loginId || "",
      role: userRole || "user",
      avatar: "",
    };
  }

  // Fallback for unauthenticated users
  if (!displayUser) {
    displayUser = {
      name: "User",
      email: "",
      role: "user",
      avatar: "",
    };
  }

  console.log("amplifyUser:", amplifyUser);
  console.log("authResponse:", authResponse);
  console.log("authUser (database):", authUser);
  console.log("userRole (cognito):", userRole);
  console.log("displayUser:", displayUser);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("isLoading:", isLoading);
  console.log("error:", error);

  const isDashboardPage =
    pathname.includes("/dashboard") ||
    pathname.includes("/creator") ||
    pathname.includes("/admin") ||
    pathname.includes("/profile");

  // Show loading state while checking authentication
  if (amplifyUser && isLoading) {
    return (
      <div
        className="fixed top-0 left-0 w-full z-50 shadow-lg bg-white border-b border-gray-200"
        style={{ height: `${NAVBAR_HEIGHT}px` }}
      >
        <div className="flex items-center justify-between w-full h-full px-4 md:px-8 py-3">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div className="text-xl font-bold text-gray-800">
                Puji<span className="text-green-600 font-normal">Gori</span>
              </div>
            </Link>
          </div>

          {/* Loading indicator */}
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/projects?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getAvatarFallback = () => {
    if (displayUser?.name) {
      return displayUser.name.charAt(0).toUpperCase();
    }
    return displayUser?.role?.charAt(0).toUpperCase() || "U";
  };

  const getDashboardLink = () => {
    switch (displayUser?.role) {
      case "admin":
        return "/admin/dashboard";
      case "creator":
        return "/creator/dashboard";
      case "user":
        return "/user/dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <div
  className="fixed top-0 left-0 w-full z-50 shadow-lg border-b border-gray-200 overflow-x-hidden"
  //                                                                            ↑ Add this
  style={{
    maxWidth: '100vw', // Add this
    background: "linear-gradient(to right, rgba(240, 253, 244, 0.8), rgba(236, 253, 245, 0.6))",
    boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.15), 0 2px 4px -1px rgba(34, 197, 94, 0.1)",
  }}
>
      <div className="flex items-center justify-between w-full h-full px-4 md:px-8 py-3">
        {/* Left Section - Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            scroll={false}
          >
            {/* Logo placeholder - replace with your actual logo */}
            <div className="w-[120px] h-[35px] sm:w-[180px] sm:h-[50px] lg:w-[288px] lg:h-[80px] rounded-lg flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="PujiGori Logo"
                width={300}
                height={85}
                className="h-full w-auto object-contain" // Changed to h-full and added object-contain
                priority
              />
            </div>
          </Link>
        </div>

        {/* Center Section - Navigation Items (Desktop) */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              pathname === "/"
                ? "text-green-600 bg-green-50"
                : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            href="/categories"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith("/categories")
                ? "text-green-600 bg-green-50"
                : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="font-medium">Categories</span>
          </Link>

          {!isAuthenticated && (
            <Link
              href="/signup"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith("/signup")
                  ? "text-green-600 bg-green-50"
                  : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="font-medium">Register</span>
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href={getDashboardLink()}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isDashboardPage
                  ? "text-green-600 bg-green-50"
                  : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </Link>
          )}
        </div>

        {/* Right Section - Search & Auth */}
        <div className="flex items-center gap-4">
          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </form>

          {/* Authentication Section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={displayUser?.avatar} />
                    <AvatarFallback className="bg-green-100 text-green-600 text-sm font-medium">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {displayUser?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {displayUser?.role || "user"}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-56 bg-white border border-gray-200 shadow-lg"
                  align="end"
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {displayUser?.name || "User"}
                    </p>
                  </div>

                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push("/profile")}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(getDashboardLink())}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push("/settings")}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer hover:bg-red-50 text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            /* Not Authenticated - Sign In/Sign Up */
            <div className="flex items-center gap-3">
              <Link href="/signin">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-green-600 hover:bg-green-50"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu (you can add this later if needed) */}
      {/* Mobile search bar that appears on smaller screens */}
      <div className="lg:hidden border-t border-gray-200 bg-white">
        <form onSubmit={handleSearch} className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Navbar;
