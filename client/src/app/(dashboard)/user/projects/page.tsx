"use client";

import { useState } from "react";
import {
  useGetProjectsQuery,
  useInitiatePaymentMutation,
  useGetAuthUserQuery,
} from "@/state/api";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import Link from "next/link";
import { Search, Heart, Clock, TrendingUp } from "lucide-react";

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

export default function UserProjectsPage() {
  const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
  const userId = authUser?.userInfo?._id;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Payment modal state
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 100,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    isAnonymous: false,
    message: "",
    rewardTierId: "",
  });

  const { data: projectsData, isLoading } = useGetProjectsQuery({
    page: currentPage,
    limit: 12,
    status: "active",
    category: categoryFilter === "all" ? undefined : categoryFilter,
    search: searchTerm || undefined,
  });

  const [initiatePayment, { isLoading: isProcessingPayment }] =
    useInitiatePaymentMutation();

  const projects = projectsData?.data || [];
  const meta = projectsData?.meta;

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleBackProject = (project: any) => {
    setSelectedProject(project);
    const lowestTier = project.rewardTiers?.sort(
      (a: any, b: any) => a.minimumAmount - b.minimumAmount
    )[0];
    setPaymentForm({
      amount: lowestTier?.minimumAmount || 100,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      isAnonymous: false,
      message: "",
      rewardTierId: lowestTier?._id || "",
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedProject) return;

    if (!userId) {
      alert("Please log in to make a donation");

      if (!paymentForm.customerName || !paymentForm.customerEmail) {
        alert("Please fill in your name and email");
        return;
      }
      return;
    }

    // Validation
    if (!paymentForm.customerName || !paymentForm.customerEmail) {
      alert("Please fill in your name and email");
      return;
    }

    if (paymentForm.amount < 10) {
      alert("Minimum donation amount is BDT 10");
      return;
    }

    try {
      const result = await initiatePayment({
        projectId: selectedProject._id,
        amount: paymentForm.amount,
        rewardTierId: paymentForm.rewardTierId || undefined,
        customerName: paymentForm.customerName,
        customerEmail: paymentForm.customerEmail,
        customerPhone: paymentForm.customerPhone || undefined,
        customerAddress: paymentForm.customerAddress || undefined,
        isAnonymous: paymentForm.isAnonymous,
        message: paymentForm.message || undefined,
      }).unwrap();

      if (result.data?.paymentGateway) {
        window.location.href = result.data.paymentGateway;
      }
    } catch (error: any) {
      alert(
        error?.data?.message || "Payment initiation failed. Please try again."
      );
      console.error("Payment error:", error);
    }
  };

  const handleRewardTierChange = (tierId: string) => {
    const tier = selectedProject?.rewardTiers?.find(
      (t: any) => t._id === tierId
    );
    setPaymentForm({
      ...paymentForm,
      rewardTierId: tierId,
      amount: tier?.minimumAmount || paymentForm.amount,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-semibold">Discover Projects</h1>
      </header>

      <main className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-64">
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
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {projects.length} active projects
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-96 bg-white rounded-lg animate-pulse border"
              />
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
                    className="bg-white rounded-lg border overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    <Link href={`/user/projects/${project.slug}`}>
                      <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-500 overflow-hidden cursor-pointer">
                        {project.images?.[0] ? (
                          <img
                            src={project.images[0]}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                      </div>
                    </Link>

                    <div className="p-5 space-y-4">
                      <Link href={`/user/projects/${project.slug}`}>
                        <div className="cursor-pointer">
                          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.shortDescription}
                          </p>
                        </div>
                      </Link>

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
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{project.backerCount || 0} backers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{daysRemaining} days left</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.preventDefault();
                          handleBackProject(project);
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Back This Project
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
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
          <div className="text-center py-16 bg-white rounded-lg border">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Back This Project</DialogTitle>
            <DialogDescription>{selectedProject?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Reward Tiers */}
            {selectedProject?.rewardTiers &&
              selectedProject.rewardTiers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Reward Tier (Optional)
                  </label>
                  <div className="space-y-2">
                    <div
                      onClick={() => handleRewardTierChange("")}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        !paymentForm.rewardTierId
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium">No Reward</div>
                      <div className="text-sm text-gray-600">
                        Support without selecting a reward tier
                      </div>
                    </div>
                    {selectedProject.rewardTiers.map((tier: any) => (
                      <div
                        key={tier._id}
                        onClick={() => handleRewardTierChange(tier._id)}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          paymentForm.rewardTierId === tier._id
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{tier.title}</div>
                          <div className="text-green-600 font-bold">
                            BDT {tier.minimumAmount.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {tier.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tier.currentBackers}/{tier.maxBackers} backers
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Donation Amount (BDT) *
              </label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    amount: Number(e.target.value),
                  })
                }
                min="10"
                max="500000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: BDT 10 | Maximum: BDT 500,000
              </p>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name *
                </label>
                <Input
                  type="text"
                  value={paymentForm.customerName}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      customerName: e.target.value,
                    })
                  }
                  required
                  disabled={paymentForm.isAnonymous}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={paymentForm.customerEmail}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      customerEmail: e.target.value,
                    })
                  }
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone (Optional)
                </label>
                <Input
                  type="tel"
                  value={paymentForm.customerPhone}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      customerPhone: e.target.value,
                    })
                  }
                  placeholder="01700000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address (Optional)
                </label>
                <Input
                  type="text"
                  value={paymentForm.customerAddress}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      customerAddress: e.target.value,
                    })
                  }
                  placeholder="Dhaka, Bangladesh"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Message (Optional)
              </label>
              <textarea
                value={paymentForm.message}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, message: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                maxLength={500}
                placeholder="Share why you're supporting this project..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {paymentForm.message.length}/500 characters
              </p>
            </div>

            {/* Anonymous */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={paymentForm.isAnonymous}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    isAnonymous: e.target.checked,
                  })
                }
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="anonymous" className="text-sm">
                Make this donation anonymous
              </label>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Donation Amount:</span>
                <span className="font-medium">
                  BDT {paymentForm.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Admin Fee (3%):</span>
                <span className="font-medium">
                  BDT {Math.round(paymentForm.amount * 0.03).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Project Receives:</span>
                <span className="font-medium text-green-600">
                  BDT {Math.round(paymentForm.amount * 0.97).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1"
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePaymentSubmit}
                disabled={isProcessingPayment}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessingPayment ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
