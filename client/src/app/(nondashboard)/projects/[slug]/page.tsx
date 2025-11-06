"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  useGetProjectQuery,
  useGetProjectDonationsQuery,
  useInitiatePaymentMutation,
  useGetAuthUserQuery,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  Users,
  Target,
  TrendingUp,
  MapPin,
  Calendar,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: authUser } = useGetAuthUserQuery();
  const userId = authUser?.userInfo?._id;

  const { data: projectData, isLoading: isProjectLoading } = useGetProjectQuery(slug);
  const { data: donationsData } = useGetProjectDonationsQuery(
    {
      projectId: projectData?.data?._id || "",
      page: 1,
      limit: 10,
      includeAnonymous: false,
    },
    { skip: !projectData?.data?._id }
  );

  const [initiatePayment, { isLoading: isProcessingPayment }] = useInitiatePaymentMutation();

  const project = projectData?.data;
  const donations = donationsData?.data || [];
  const recentDonations = project?.recentDonations || [];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
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

  const quickAmounts = [25, 200, 500, 1000, 1500, 100];

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleDonateClick = () => {
    setShowPaymentModal(true);
    const lowestTier = project?.rewardTiers?.sort(
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
  };

  const handleQuickAmountClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setPaymentForm({ ...paymentForm, amount });
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    const numValue = parseFloat(value) || 0;
    setPaymentForm({ ...paymentForm, amount: numValue });
  };

  const handlePaymentSubmit = async () => {
    if (!project) return;

    if (!userId) {
      alert("Please log in to make a donation");
      if (!paymentForm.customerName || !paymentForm.customerEmail) {
        alert("Please fill in your name and email");
        return;
      }
      return;
    }

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
        projectId: project._id,
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
      alert(error?.data?.message || "Payment initiation failed. Please try again.");
      console.error("Payment error:", error);
    }
  };

  const handleRewardTierChange = (tierId: string) => {
    const tier = project?.rewardTiers?.find((t: any) => t._id === tierId);
    setPaymentForm({
      ...paymentForm,
      rewardTierId: tierId,
      amount: tier?.minimumAmount || paymentForm.amount,
    });
    setSelectedAmount(null);
    setCustomAmount("");
  };

  const nextImage = () => {
    if (project?.images && project.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === project.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (project?.images && project.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? project.images.length - 1 : prev - 1
      );
    }
  };

  if (isProjectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const fundingProgress = project.targetAmount
    ? (project.currentAmount / project.targetAmount) * 100
    : 0;
  const daysRemaining = calculateDaysRemaining(project.endDate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/projects")}
            className="inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{project.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{project.shortDescription}</p>

              {/* Creator Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  {project.title.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guy is the owner of this investment to start an Agro-House</p>
                  <p className="text-sm font-medium text-gray-700">
                    Category: <span className="text-green-600">{project.category}</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-200 rounded-2xl overflow-hidden relative"
            >
              {project.images && project.images.length > 0 ? (
                <>
                  <div className="relative h-96 w-full">
                    {project.images.map((imageUrl: string, index: number) => (
                      <div
                        key={imageUrl + index}
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          index === currentImageIndex ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <img
                          src={imageUrl}
                          alt={`${project.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {project.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {project.images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📷</div>
                    <p>No images available</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Project Description Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <Tabs defaultValue="story" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="story">Story</TabsTrigger>
                  <TabsTrigger value="updates">Updates</TabsTrigger>
                  <TabsTrigger value="donations">Donations</TabsTrigger>
                </TabsList>

                <TabsContent value="story" className="mt-6">
                  <div className="prose max-w-none">
                    <h3 className="text-xl font-bold mb-4">About This Project</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {project.story}
                    </p>

                    <h3 className="text-xl font-bold mt-8 mb-4">Full Description</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {project.description}
                    </p>

                    <h3 className="text-xl font-bold mt-8 mb-4">Risks & Challenges</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {project.risks}
                    </p>

                    {project.tags && project.tags.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-xl font-bold mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="updates" className="mt-6">
                  {project.updates && project.updates.length > 0 ? (
                    <div className="space-y-6">
                      {project.updates.map((update: any, index: number) => (
                        <div key={index} className="border-b pb-6 last:border-b-0">
                          <h3 className="text-lg font-bold mb-2">{update.title}</h3>
                          <p className="text-sm text-gray-500 mb-3">
                            {new Date(update.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-gray-700">{update.content}</p>
                          {update.images && update.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-4">
                              {update.images.map((img: string, imgIdx: number) => (
                                <img
                                  key={imgIdx}
                                  src={img}
                                  alt={`Update ${imgIdx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>No updates yet. Check back later!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="donations" className="mt-6">
                  {recentDonations.length > 0 ? (
                    <div className="space-y-4">
                      {recentDonations.map((donation: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-gray-900">
                                {donation.isAnonymous
                                  ? "Anonymous"
                                  : donation.donorDisplayName || "Anonymous"}
                              </p>
                              <p className="font-bold text-green-600">
                                BDT {donation.amount?.toLocaleString()}
                              </p>
                            </div>
                            {donation.message && (
                              <p className="text-sm text-gray-600">{donation.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(donation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Be the first to support this project!</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Rewards Section */}
            {project.rewardTiers && project.rewardTiers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Rewards Offered to Donors</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {project.rewardTiers.map((tier: any, index: number) => (
                    <div
                      key={tier._id}
                      className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
                      style={{
                        transform: `translateY(${index * 10}px)`,
                      }}
                    >
                      <h3 className="text-xl font-bold mb-3">Tier {index + 1}</h3>
                      <p className="text-2xl font-bold mb-4">
                        BDT {tier.minimumAmount.toLocaleString()}+
                      </p>
                      <h4 className="font-semibold mb-2">{tier.title}</h4>
                      <p className="text-sm text-green-50 mb-4">{tier.description}</p>
                      {tier.items && tier.items.length > 0 && (
                        <ul className="text-sm space-y-1">
                          {tier.items.map((item: string, itemIdx: number) => (
                            <li key={itemIdx} className="flex items-start">
                              <span className="mr-2">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-4 pt-4 border-t border-green-500">
                        <p className="text-xs">
                          {tier.currentBackers}/{tier.maxBackers || "∞"} backers
                        </p>
                        {tier.estimatedDelivery && (
                          <p className="text-xs mt-1">
                            Estimated: {new Date(tier.estimatedDelivery).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Acquired Legal Documents */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex justify-center"
            >
              <Button className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-full">
                <FileCheck className="h-5 w-5 mr-2" />
                Acquired legal documents
              </Button>
            </motion.div>
          </div>

          {/* Right Column - Donation Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 sticky top-24"
            >
              {/* Funding Stats */}
              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <p className="text-3xl font-bold text-green-600">
                      Tk {project.currentAmount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">raised</p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 rounded-full border-4 border-green-600 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">
                        {Math.round(fundingProgress)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Tk {project.targetAmount?.toLocaleString()} goal • {project.backerCount || 0} invested
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{daysRemaining}</p>
                    <p className="text-xs text-gray-600">days left</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{project.backerCount || 0}</p>
                    <p className="text-xs text-gray-600">backers</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleDonateClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg rounded-xl"
                >
                  Donate Now
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-6 text-lg rounded-xl"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </Button>
              </div>

              {/* Recent Backers */}
              {recentDonations.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                      {recentDonations.length} people just invested
                    </p>
                    <Button variant="link" className="text-xs">
                      See all
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {recentDonations.slice(0, 3).map((donation: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {donation.isAnonymous ? "Anonymous" : donation.donorDisplayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Tk{donation.amount?.toLocaleString()} • Recent Donation
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    See top
                  </Button>
                </div>
              )}

              {/* Location & Category */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>
                    {project.location.district}, {project.location.division}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Target className="h-4 w-4 mr-2" />
                  <span className="capitalize">{project.category}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {new Date(project.startDate).toLocaleDateString()} -{" "}
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Modal - EXACT SAME AS USER PROJECTS PAGE */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Back This Project</DialogTitle>
            <DialogDescription>{project.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Reward Tiers */}
            {project.rewardTiers && project.rewardTiers.length > 0 && (
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
                  {project.rewardTiers.map((tier: any) => (
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
                      <div className="text-sm text-gray-600 mb-2">{tier.description}</div>
                      <div className="text-xs text-gray-500">
                        {tier.currentBackers}/{tier.maxBackers} backers
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support This Project Section */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Support this project
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmountClick(amount)}
                    className={`py-2 rounded-lg border-2 font-medium transition-colors ${
                      selectedAmount === amount
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 hover:border-green-600"
                    }`}
                  >
                    {amount} BDT
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Or enter custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                min="10"
                max="500000"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                A 3% processing fee will be added to your donation.
              </p>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Please Input</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <Input
                  type="text"
                  value={paymentForm.customerName}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, customerName: e.target.value })
                  }
                  required
                  disabled={paymentForm.isAnonymous}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  value={paymentForm.customerEmail}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, customerEmail: e.target.value })
                  }
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                <Input
                  type="tel"
                  value={paymentForm.customerPhone}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, customerPhone: e.target.value })
                  }
                  placeholder="01700000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address (Optional)</label>
                <Input
                  type="text"
                  value={paymentForm.customerAddress}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, customerAddress: e.target.value })
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
                  setPaymentForm({ ...paymentForm, isAnonymous: e.target.checked })
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
                {isProcessingPayment ? "Processing..." : "Pay"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}