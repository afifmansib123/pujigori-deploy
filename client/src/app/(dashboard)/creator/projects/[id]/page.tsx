"use client";

import { use } from "react";
import { 
  useGetProjectQuery, 
  useGetProjectDonationsQuery, 
  useGetProjectPaymentRequestsQuery 
} from "@/state/api";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Users, 
  TrendingUp,
  Edit,
  Settings,
  BarChart3,
  Wallet
} from "lucide-react";
import Link from "next/link";

export default function ProjectManagementPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  const slugOrId = resolvedParams.id;

  const { data: projectData, isLoading: isLoadingProject } = useGetProjectQuery(slugOrId);

  const project = projectData?.data;
  const actualProjectId = project?._id;

  const { data: donationsData, isLoading: isLoadingDonations } = useGetProjectDonationsQuery(
    {
      projectId: actualProjectId,
      page: 1,
      limit: 10
    },
    {
      skip: !actualProjectId,
    }
  );

  const { data: paymentRequestsData } = useGetProjectPaymentRequestsQuery(
    actualProjectId || '',
    {
      skip: !actualProjectId,
    }
  );

  const donations = donationsData?.data || [];
  const paymentRequests = paymentRequestsData?.data || [];

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/creator/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  // FIXED: Calculate stats safely with fallbacks
  const fundingProgress = project.targetAmount 
    ? (project.currentAmount / project.targetAmount) * 100 
    : 0;
  
  // Calculate net amount (97% of current amount after 3% admin fee)
  const netAmount = Math.round((project.currentAmount || 0) * 0.97);
  const adminFee = (project.currentAmount || 0) - netAmount;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center justify-between flex-1">
          <h1 className="text-xl font-semibold truncate">{project.title}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/creator/projects/${actualProjectId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Stats Overview - FIXED */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Raised</p>
                <p className="text-2xl font-bold">
                  BDT {(project.currentAmount || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {(project.targetAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Backers</p>
                <p className="text-2xl font-bold">{project.backerCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{Math.round(fundingProgress)}%</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">
                  BDT {netAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  After 3% fee (BDT {adminFee.toLocaleString()})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your code stays the same... */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="donations">Donations ({donations.length})</TabsTrigger>
            <TabsTrigger value="payments">Payment Requests ({paymentRequests.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="border rounded-lg p-6 bg-white">
              <h3 className="text-lg font-semibold mb-4">Project Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Status: </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-700' :
                    project.status === 'funded' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Category: </span>
                  <span className="font-medium capitalize">{project.category}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Location: </span>
                  <span className="font-medium">
                    {project.location?.district}, {project.location?.division}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Campaign Period: </span>
                  <span className="font-medium">
                    {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="donations">
            <DonationsList donations={donations} isLoading={isLoadingDonations} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentRequestsSection projectId={actualProjectId} paymentRequests={paymentRequests} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-12 border rounded-lg bg-white">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-muted-foreground">Analytics coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DonationsList({ donations, isLoading }: any) {
  if (isLoading) {
    return <div>Loading donations...</div>;
  }
  return <div>Donations list component...</div>;
}

function PaymentRequestsSection({ projectId, paymentRequests }: any) {
  return <div>Payment requests component...</div>;
}