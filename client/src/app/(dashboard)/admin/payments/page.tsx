"use client";

import { useState } from "react";
import {
  useGetPaymentRequestsQuery,
  useApprovePaymentRequestMutation,
  useRejectPaymentRequestMutation,
  useMarkPaymentAsPaidMutation,
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
import { Search, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

export default function PaymentRequestsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // Form states
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [paidNotes, setPaidNotes] = useState("");
  const [transactionRef, setTransactionRef] = useState("");

  const { data: requestsData, isLoading } = useGetPaymentRequestsQuery({
    page: currentPage,
    limit: 20,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const [approveRequest, { isLoading: isApproving }] = useApprovePaymentRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectPaymentRequestMutation();
  const [markAsPaid, { isLoading: isMarkingPaid }] = useMarkPaymentAsPaidMutation();

  const requests = requestsData?.data || [];
  const meta = requestsData?.meta;

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await approveRequest({
        requestId: selectedRequest._id,
        notes: approveNotes,
      }).unwrap();
      setShowApproveModal(false);
      setApproveNotes("");
      setSelectedRequest(null);
    } catch (error: any) {
      alert(error?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      alert("Rejection reason is required");
      return;
    }
    try {
      await rejectRequest({
        requestId: selectedRequest._id,
        reason: rejectReason,
      }).unwrap();
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedRequest(null);
    } catch (error: any) {
      alert(error?.data?.message || "Failed to reject request");
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedRequest) return;
    try {
      await markAsPaid({
        requestId: selectedRequest._id,
        notes: paidNotes,
        transactionReference: transactionRef,
      }).unwrap();
      setShowMarkPaidModal(false);
      setPaidNotes("");
      setTransactionRef("");
      setSelectedRequest(null);
    } catch (error: any) {
      alert(error?.data?.message || "Failed to mark as paid");
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
        <h1 className="text-xl font-semibold text-gray-900">Payment Requests</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50">
        {/* Filters */}
        <div className="bg-white rounded-lg border mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by project name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payment requests...</p>
            </div>
          ) : requests.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Admin Fee</TableHead>
                    <TableHead className="font-semibold">Net Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request: any) => (
                    <TableRow key={request._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {request.project?.title || "Unknown Project"}
                      </TableCell>
                      <TableCell>
                        BDT {request.requestedAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        BDT {request.adminFee?.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        BDT {request.netAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusBadge(request.status)} border`}
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowApproveModal(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectModal(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowMarkPaidModal(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          {request.status === "paid" && (
                            <span className="text-sm text-gray-500">Completed</span>
                          )}
                          {request.status === "rejected" && (
                            <span className="text-sm text-gray-500">Rejected</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No payment requests found
              </h3>
              <p className="text-gray-600">
                {statusFilter === "pending"
                  ? "There are no pending payment requests at this time."
                  : "Try adjusting your filters."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment Request</DialogTitle>
            <DialogDescription>
              Approve payment request for {selectedRequest?.project?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Requested Amount:</strong> BDT{" "}
                {selectedRequest?.requestedAmount?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Admin Fee (5%):</strong> BDT{" "}
                {selectedRequest?.adminFee?.toLocaleString()}
              </p>
              <p className="text-sm font-medium">
                <strong>Net Amount:</strong> BDT{" "}
                {selectedRequest?.netAmount?.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? "Approving..." : "Approve Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment Request</DialogTitle>
            <DialogDescription>
              Reject payment request for {selectedRequest?.project?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={4}
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Modal */}
      <Dialog open={showMarkPaidModal} onOpenChange={setShowMarkPaidModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Confirm payment for {selectedRequest?.project?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Transaction Reference
              </label>
              <Input
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Bank transaction ID or reference number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={paidNotes}
                onChange={(e) => setPaidNotes(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Add any notes about this payment..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMarkPaidModal(false)}
              disabled={isMarkingPaid}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={isMarkingPaid}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isMarkingPaid ? "Processing..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}