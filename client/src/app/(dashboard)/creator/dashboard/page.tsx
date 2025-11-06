"use client";

import { useGetAuthUserQuery, useGetProjectsByCreatorQuery } from "@/state/api";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { 
  FolderKanban, 
  DollarSign, 
  TrendingUp, 
  Users,
  PlusCircle 
} from "lucide-react";

export default function CreatorDashboard() {
  const { data: authUser } = useGetAuthUserQuery();
  const creatorId = authUser?.cognitoInfo?.userId;

  const { data: projectsData, isLoading } = useGetProjectsByCreatorQuery(
    {
      creatorId: creatorId || "",
      page: 1,
      limit: 10,
    },
    {
      skip: !creatorId,
    }
  );

  const projects = projectsData?.data || [];
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p: any) => p.status === "active").length,
    totalRaised: projects.reduce((sum: number, p: any) => sum + (p.currentAmount || 0), 0),
    totalBackers: projects.reduce((sum: number, p: any) => sum + (p.backerCount || 0), 0),
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-semibold">Creator Dashboard</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {authUser?.userInfo?.name || 'Creator'}!
          </h2>
          <p className="text-muted-foreground mb-4">
            Manage your projects and track your fundraising progress
          </p>
          <Link
            href="/creator/create"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Project
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderKanban className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-2xl font-bold">
                  BDT {stats.totalRaised.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Backers</p>
                <p className="text-2xl font-bold">{stats.totalBackers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <Link
              href="/creator/projects"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project: any) => (
                <Link
                  key={project._id}
                  href={`/creator/projects/${project._id}`}
                  className="block border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.shortDescription}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === "active"
                          ? "bg-green-100 text-green-700"
                          : project.status === "funded"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Raised: </span>
                      <span className="font-semibold text-green-600">
                        BDT {project.currentAmount?.toLocaleString() || 0}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}/ {project.targetAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Backers: </span>
                      <span className="font-semibold">{project.backerCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progress: </span>
                      <span className="font-semibold">
                        {project.targetAmount
                          ? Math.round((project.currentAmount / project.targetAmount) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Link
                href="/creator/create"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Create Your First Project
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}