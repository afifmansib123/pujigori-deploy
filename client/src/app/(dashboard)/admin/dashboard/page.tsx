"use client";

import { useGetDashboardQuery, useGetPaymentRequestsQuery } from "@/state/api"
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { 
  LayoutDashboard,
  FolderKanban, 
  DollarSign, 
  TrendingUp, 
  Users,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

export default function AdminDashboard() {
  const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardQuery({ period: 30 });
  const { data: paymentRequestsData, isLoading: isPaymentRequestsLoading } = useGetPaymentRequestsQuery({
    page: 1,
    limit: 5,
    status: "pending",
  });

  const overview = dashboardData?.data?.overview || {};
  const recentActivity = dashboardData?.data?.recentActivity || [];
  const topProjects = dashboardData?.data?.topProjects || [];
  const pendingRequests = paymentRequestsData?.data || [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Platform Overview</h2>
          </div>
          <p className="text-muted-foreground">
            Monitor and manage the PujiGori crowdfunding platform
          </p>
        </div>

        {/* Stats Grid */}
        {isDashboardLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FolderKanban className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold">{overview.totalProjects || 0}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{overview.activeProjects || 0}</p>
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
                      {overview.totalRaised ? `৳${(overview.totalRaised / 1000).toFixed(1)}k` : '৳0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Heart className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Donations</p>
                    <p className="text-2xl font-bold">{overview.totalDonations || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold">{overview.pendingPaymentRequests || 0}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Fees</p>
                    <p className="text-2xl font-bold">
                      {overview.totalAdminFees ? `৳${(overview.totalAdminFees / 1000).toFixed(1)}k` : '৳0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{overview.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-lg font-bold">
                      ৳{overview.thisMonthStats?.totalRaised?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Payment Requests */}
          <div className="border rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Payment Requests
              </h3>
              <Link
                href="/admin/payments"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>

            {isPaymentRequestsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((request: any) => (
                  <div
                    key={request._id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{request.project?.title || 'Unknown Project'}</p>
                        <p className="text-xs text-muted-foreground">
                          Requested {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        ৳{request.requestedAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/payments/${request._id}`}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Review
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        Fee: ৳{request.adminFee?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No pending payment requests</p>
              </div>
            )}
          </div>

          {/* Top Projects */}
          <div className="border rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Projects
              </h3>
              <Link
                href="/admin/projects"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>

            {isDashboardLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : topProjects.length > 0 ? (
              <div className="space-y-3">
                {topProjects.map((project: any, index: number) => (
                  <div
                    key={project._id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>৳{project.currentAmount?.toLocaleString() || 0}</span>
                          <span>•</span>
                          <span>{project.backerCount || 0} backers</span>
                          <span>•</span>
                          <span>{project.fundingProgress?.toFixed(0) || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No projects yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Recent Activity
          </h3>

          {isDashboardLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "donation"
                        ? "bg-green-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {activity.type === "donation" ? (
                      <Heart className="h-4 w-4 text-green-600" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.type === "donation" ? "New donation" : "Payment request"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.project?.title || 'Unknown Project'} • 
                      ৳{activity.amount?.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/payments"
            className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <h4 className="font-semibold">Review Payments</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Approve or reject pending payment requests
            </p>
          </Link>

          <Link
            href="/admin/projects"
            className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FolderKanban className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold">Manage Projects</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              View and moderate all platform projects
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold">View Reports</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate financial and analytics reports
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}