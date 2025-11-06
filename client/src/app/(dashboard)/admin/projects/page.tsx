"use client";

import { useState } from "react";
import {
  useGetAdminProjectsQuery,
  useUpdateProjectStatusMutation,
  useDeleteProjectMutation,
} from "@/state/api";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  FolderKanban,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  AlertCircle,
  TrendingUp,
  Target,
  Trash2,
} from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "technology", label: "Technology" },
  { value: "arts", label: "Arts & Culture" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "environment", label: "Environment" },
  { value: "community", label: "Community" },
  { value: "business", label: "Business" },
  { value: "charity", label: "Charity" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "funded", label: "Funded" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "currentAmount-desc", label: "Highest Funded" },
  { value: "backerCount-desc", label: "Most Backers" },
  { value: "endDate-asc", label: "Ending Soon" },
];

export default function AdminProjectsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("createdAt-desc");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const [sortBy, sortOrder] = sortOption.split("-");

  const { data: projectsData, isLoading } = useGetAdminProjectsQuery({
    page: currentPage,
    limit: 12,
    status: statusFilter === "all" ? undefined : statusFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    search: searchTerm || undefined,
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  const [updateProjectStatus, { isLoading: isUpdatingStatus }] =
    useUpdateProjectStatusMutation();

  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteProjectMutation();

  const projects = projectsData?.data || [];
  const meta = projectsData?.meta;

  const handleUpdateStatus = async () => {
    if (!selectedProject || !newStatus) return;

    try {
      await updateProjectStatus({
        projectId: selectedProject._id,
        status: newStatus,
        reason: statusReason || undefined,
      }).unwrap();

      alert(`Project status updated to ${newStatus} successfully!`);
      setShowStatusModal(false);
      setSelectedProject(null);
      setNewStatus("");
      setStatusReason("");
    } catch (error: any) {
      alert(error?.data?.message || "Failed to update status");
      console.error("Update status error:", error);
    }
  };

  const handleDeleteProject = async (project: any) => {
    const backerWarning = project.backerCount > 0
      ? `\n⚠️ WARNING: This project has ${project.backerCount} backers and BDT ${project.currentAmount?.toLocaleString()} raised!\n\n`
      : '';

    const confirmMessage = `🗑️ PERMANENT DELETE\n\n${backerWarning}Are you sure you want to permanently delete "${project.title}"?\n\nThis will:\n- Delete all project data\n- Cannot be undone\n\nType DELETE to confirm:`;
    
    const typedConfirm = prompt(confirmMessage);
    
    if (typedConfirm !== 'DELETE') {
      if (typedConfirm !== null) {
        alert('Confirmation failed. You must type DELETE exactly.');
      }
      return;
    }

    try {
      await deleteProject(project._id).unwrap();
      alert("Project permanently deleted!");
    } catch (error: any) {
      alert(error?.data?.message || "Failed to delete project");
      console.error("Delete project error:", error);
    }
  };

  const openStatusModal = (project: any) => {
    setSelectedProject(project);
    setNewStatus(project.status);
    setShowStatusModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "funded":
        return <Target className="h-4 w-4 text-blue-600" />;
      case "expired":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "funded":
        return "bg-blue-100 text-blue-700 border-blue-200";
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
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <FolderKanban className="h-5 w-5" />
          Projects Management
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50">
        {/* Filters Section */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects by title or creator..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full lg:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="w-full lg:w-48">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Showing <span className="font-semibold">{projects.length}</span> of{" "}
                  <span className="font-semibold">{meta?.total || 0}</span> projects
                </>
              )}
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-white rounded-xl animate-pulse border shadow-sm" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => {
                const fundingProgress = project.targetAmount
                  ? (project.currentAmount / project.targetAmount) * 100
                  : 0;
                const daysRemaining = calculateDaysRemaining(project.endDate);

                return (
                  <div
                    key={project._id}
                    className="bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Project Image */}
                    <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-500 overflow-hidden">
                      {project.images?.[0] ? (
                        <img
                          src={project.images[0]}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold opacity-20">
                          {project.title.charAt(0)}
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                          {project.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusBadgeColor(
                            project.status
                          )}`}
                        >
                          {getStatusIcon(project.status)}
                          <span className="capitalize">{project.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.shortDescription}
                        </p>
                      </div>

                      {/* Funding Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-green-600">
                            BDT {project.currentAmount?.toLocaleString() || 0}
                          </span>
                          <span className="text-muted-foreground">
                            of {project.targetAmount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(fundingProgress, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 text-right">
                          {fundingProgress.toFixed(1)}% funded
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{project.backerCount || 0} backers</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{daysRemaining} days left</span>
                        </div>
                      </div>

                      {/* Location & Date */}
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {project.location?.district}, {project.location?.division}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-2">
                        <div className="flex gap-2">
                          <Link
                            href={`/projects/${project.slug}`}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => openStatusModal(project)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                          >
                            <TrendingUp className="h-4 w-4" />
                            Status
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProject(project)}
                          disabled={isDeletingProject}
                          className="w-full gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          {isDeletingProject ? "Deleting..." : "Delete Project"}
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
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {[...Array(Math.min(meta.totalPages, 5))].map((_, idx) => {
                    const pageNum =
                      currentPage <= 3
                        ? idx + 1
                        : currentPage >= meta.totalPages - 2
                        ? meta.totalPages - 4 + idx
                        : currentPage - 2 + idx;

                    if (pageNum < 1 || pageNum > meta.totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={currentPage === pageNum ? "bg-blue-600" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === meta.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border">
            <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </main>

      {/* Update Status Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Project Status</DialogTitle>
            <DialogDescription>
              Change status for: {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <p>
                  Changing project status will affect its visibility and functionality on the
                  platform.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current Status</label>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusBadgeColor(
                  selectedProject?.status
                )}`}
              >
                {getStatusIcon(selectedProject?.status)}
                <span className="capitalize font-medium">{selectedProject?.status}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Provide a reason for the status change..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setSelectedProject(null);
                setNewStatus("");
                setStatusReason("");
              }}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus || newStatus === selectedProject?.status}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingStatus ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}