"use client";

import { useGetAuthUserQuery, useGetTrendingProjectsQuery } from "@/state/api";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function UserDashboard() {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: trendingProjects, isLoading } = useGetTrendingProjectsQuery({ limit: 6 });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {authUser?.userInfo.name}!
          </h1>
          <p className="text-muted-foreground">
            Discover amazing projects to support
          </p>
        </div>
      </div>

      {/* Trending Projects */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Trending Projects</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingProjects?.data?.map((project: any) => (
              <div
                key={project._id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold mb-2">{project.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {project.shortDescription}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">
                    BDT {project.currentAmount?.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    of {project.targetAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}