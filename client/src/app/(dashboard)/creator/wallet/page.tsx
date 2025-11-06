"use client";

import { useState } from "react";
import {
  useGetAuthUserQuery,
  useGetCreatorBalancesQuery,
  useGetCreatorPaymentRequestsQuery,
  useCreatePaymentRequestMutation,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react";

export default function CreatorWalletPage() {
  const { data: authUser } = useGetAuthUserQuery();
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    branchName: "",
  });

  // Fetch balances for all creator's projects
  const { data: balancesResponse, isLoading: isLoadingBalances } = useGetCreatorBalancesQuery();

  const { data: requestsData, isLoading: isLoadingRequests } = useGetCreatorPaymentRequestsQuery({
    page: 1,
    limit: 20,
  });

  const [createRequest, { isLoading: isCreatingRequest }] = useCreatePaymentRequestMutation();

  const balances = balancesResponse?.data;
  const totalAvailable = balances?.totalAvailable || 0;
  const projects = balances?.projects || [];
  const requests = requestsData?.data || [];

  const handleCreateRequest = async () => {
    if (!selectedProjectId || !requestAmount || parseFloat(requestAmount) <= 0) {
      alert("Please select a project and enter a valid amount");
      return;
    }

    if (!bankDetails.accountHolder || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.branchName) {
      alert("Please fill in all required bank details");
      return;
    }

    const selectedProject = projects.find((p: any) => p.projectId === selectedProjectId);
    if (!selectedProject || parseFloat(requestAmount) > selectedProject.availableAmount) {
      alert("Requested amount exceeds available balance");
      return;
    }

    try {
      await createRequest({
        projectId: selectedProjectId,
        requestedAmount: parseFloat(requestAmount),
        bankDetails: {
          accountHolder: bankDetails.accountHolder,
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          routingNumber: bankDetails.routingNumber || undefined,
          branchName: bankDetails.branchName,
        },
      }).unwrap();

      // Reset form
      setShowRequestModal(false);
      setSelectedProjectId("");
      setRequestAmount("");
      setBankDetails({
        accountHolder: "",
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        branchName: "",
      });
      
      alert("Withdrawal request submitted successfully!");
    } catch (error: any) {
      alert(error?.data?.message || "Failed to create payment request");
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find((p: any) => p.projectId === projectId);
    if (project) {
      setRequestAmount(project.availableAmount.toString());
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-blue-100 text-blue-800 border-blue-300",
      paid: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-semibold text-gray-900">Creator Wallet</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50 space-y-6">
        {/* Balance Overview */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Available Balance</h2>
              {isLoadingBalances ? (
                <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-green-600">
                  BDT {totalAvailable.toLocaleString()}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Across {projects.length} project{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={() => setShowRequestModal(true)}
              disabled={totalAvailable <= 0 || isLoadingBalances}
              className="bg-green-600 hover:bg-green-700"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Request Withdrawal
            </Button>
          </div>

          {/* Project Balances */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Balance by Project
            </h3>
            
            {isLoadingBalances ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map((project: any) => (
                  <div
                    key={project.projectId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{project.projectTitle}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-gray-600">
                          Raised: <span className="font-medium">BDT {project.totalRaised.toLocaleString()}</span>
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">
                          Net: <span className="font-medium">BDT {project.totalNetAmount.toLocaleString()}</span>
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">
                          Requested: <span className="font-medium">BDT {project.alreadyRequested.toLocaleString()}</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {project.donationCount} donation{project.donationCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg text-green-600">
                        BDT {project.availableAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No projects with available funds</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Request History */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payment Request History</h2>
          </div>

          {isLoadingRequests ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request: any) => (
                  <TableRow key={request._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {request.project?.title || "Unknown Project"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">BDT {request.requestedAmount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">
                          Net: BDT {request.netAmount?.toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusBadge(request.status)} border`}
                      >
                        {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {request.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {request.status === "paid" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {request.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {request.adminNotes || request.rejectionReason || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment requests yet</h3>
              <p className="text-gray-600">
                Request a withdrawal when you have available funds
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Request to withdraw funds from your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Project *
              </label>
              <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects
                    .filter((proj: any) => proj.availableAmount > 0)
                    .map((proj: any) => (
                      <SelectItem key={proj.projectId} value={proj.projectId}>
                        {proj.projectTitle} - BDT {proj.availableAmount.toLocaleString()} available
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Withdrawal Amount (BDT) *
              </label>
              <Input
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                max={
                  selectedProjectId
                    ? projects.find((p: any) => p.projectId === selectedProjectId)?.availableAmount
                    : undefined
                }
              />
              {selectedProjectId && (
                <p className="text-xs text-gray-600 mt-1">
                  Max available: BDT{" "}
                  {projects
                    .find((p: any) => p.projectId === selectedProjectId)
                    ?.availableAmount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Bank Details */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Bank Account Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Account Holder Name *
                  </label>
                  <Input
                    value={bankDetails.accountHolder}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountHolder: e.target.value })
                    }
                    placeholder="Full name as per bank account"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bank Name *
                  </label>
                  <Input
                    value={bankDetails.bankName}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, bankName: e.target.value })
                    }
                    placeholder="e.g. Dutch-Bangla Bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Branch Name *
                  </label>
                  <Input
                    value={bankDetails.branchName}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, branchName: e.target.value })
                    }
                    placeholder="e.g. Gulshan Branch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Account Number *
                  </label>
                  <Input
                    value={bankDetails.accountNumber}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                    }
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Routing Number
                  </label>
                  <Input
                    value={bankDetails.routingNumber}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, routingNumber: e.target.value })
                    }
                    placeholder="9-digit routing number"
                  />
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Processing Time</p>
                <p>
                  Payment requests are reviewed by admin and typically processed within 3-5
                  business days.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestModal(false)}
              disabled={isCreatingRequest}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={isCreatingRequest}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingRequest ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}