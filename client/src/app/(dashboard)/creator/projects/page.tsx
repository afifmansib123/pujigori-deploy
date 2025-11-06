"use client";

import { useState } from "react";
import { useGetAuthUserQuery, useGetProjectsByCreatorQuery } from "@/state/api";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "funded", label: "Funded" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AllProjectsPage() {
  const { data: authUser } = useGetAuthUserQuery();
  const creatorId = authUser?.cognitoInfo?.userId;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: projectsData, isLoading } = useGetProjectsByCreatorQuery(
    {
      creatorId: creatorId || "",
      page,
      limit: 12,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    {
      skip: !creatorId,
    }
  );

  const projects = projectsData?.data || [];
  const meta = projectsData?.meta;

  // Client-side search filter
  const filteredProjects = projects.filter((project: any) =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "funded":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "expired":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center justify-between flex-1">
          <h1 className="text-xl font-semibold">All Projects</h1>
          <Button asChild>
            <Link href="/creator/create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Project
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: any) => {
                const fundingProgress = project.targetAmount
                  ? (project.currentAmount / project.targetAmount) * 100
                  : 0;
                const daysRemaining = calculateDaysRemaining(project.endDate);

                return (
                  <div
                    key={project._id}
                    className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Project Image */}
                    <div className="relative h-48 bg-gray-200">
                      {project.images && project.images[0] ? (
                        <img
                          src={project.images[0]}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="p-5 space-y-4">
                      {/* Title & Description */}
                      <div>
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.shortDescription}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-50 rounded">
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Raised
                            </p>
                            <p className="font-semibold">
                              {Math.round(fundingProgress)}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-50 rounded">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Backers
                            </p>
                            <p className="font-semibold">
                              {project.backerCount || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-50 rounded">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Target
                            </p>
                            <p className="font-semibold text-xs">
                              BDT {project.targetAmount?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-orange-50 rounded">
                            <Clock className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Days Left
                            </p>
                            <p className="font-semibold">
                              {daysRemaining > 0 ? daysRemaining : "Ended"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            BDT {project.currentAmount?.toLocaleString()}
                          </span>
                          <span>
                            BDT {project.targetAmount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(fundingProgress, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link
                            href={`/creator/projects/${project.slug}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === meta.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search or filters"
                  : "Create your first project to get started"}
              </p>
              {!searchTerm && (
                <Button asChild className="mt-4">
                  <Link href="/creator/create">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
