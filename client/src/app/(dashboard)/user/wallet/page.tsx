"use client";

import { useState } from "react";
import {
  useGetUserDonationsQuery,
  useGetDonationQRQuery,
  useUpdateDonorMessageMutation,
} from "@/state/api";
import { useGetAuthUserQuery } from "@/state/api";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Gift,
  QrCode,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Download,
  Eye,
  EyeOff,
  Edit2,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";

export default function UserDonationsPage() {
  const { data: authUser } = useGetAuthUserQuery();
  const userId = authUser?.userInfo?._id;

  const [selectedTab, setSelectedTab] = useState<"all" | "success" | "pending">("all");
  const [selectedDonation, setSelectedDonation] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrFormat, setQrFormat] = useState<"url" | "base64">("url");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  // Fetch user donations
  const {
    data: donationsData,
    isLoading: isDonationsLoading,
    refetch: refetchDonations,
  } = useGetUserDonationsQuery(
    {
      userId: userId || "",
      page: 1,
      limit: 50,
      status: selectedTab === "all" ? undefined : selectedTab,
    },
    {
      skip: !userId,
    }
  );

  // Fetch QR code for selected donation
  const {
    data: qrData,
    isLoading: isQRLoading,
  } = useGetDonationQRQuery(
    {
      id: selectedDonation || "",
      format: qrFormat,
    },
    {
      skip: !selectedDonation || !showQRModal,
    }
  );

  const [updateMessage, { isLoading: isUpdatingMessage }] = useUpdateDonorMessageMutation();

  const donations = donationsData?.data || [];
  const totalDonations = donations.length;
  const totalAmount = donations.reduce((sum: number, d: any) => sum + d.amount, 0);
  const totalRewards = donations.filter((d: any) => d.rewardValue > 0).length;

  const handleViewQR = (donationId: string) => {
    setSelectedDonation(donationId);
    setShowQRModal(true);
  };

  const handleDownloadQR = async () => {
    if (!qrData?.data?.qrCodeUrl) return;

    try {
      const response = await fetch(qrData.data.qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `donation-qr-${selectedDonation}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download QR code:", error);
    }
  };

  const handleEditMessage = (donation: any) => {
    setEditingMessage(donation._id);
    setMessageText(donation.message || "");
  };

  const handleSaveMessage = async (donationId: string) => {
    try {
      await updateMessage({
        id: donationId,
        message: messageText,
      }).unwrap();
      setEditingMessage(null);
      refetchDonations();
    } catch (error) {
      console.error("Failed to update message:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Success
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getRewardStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="text-xs text-yellow-600 font-medium">
            ⏳ Pending
          </span>
        );
      case "redeemed":
        return (
          <span className="text-xs text-green-600 font-medium">
            ✓ Redeemed
          </span>
        );
      case "expired":
        return (
          <span className="text-xs text-gray-500 font-medium">
            ⌛ Expired
          </span>
        );
      default:
        return null;
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to view your donations</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-semibold">My Donations & Rewards</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-200 rounded-lg">
                <Gift className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Donations</p>
                <p className="text-2xl font-bold text-blue-900">{totalDonations}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-200 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-green-900">৳{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-200 rounded-lg">
                <QrCode className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Rewards Earned</p>
                <p className="text-2xl font-bold text-purple-900">{totalRewards}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Donations
          </button>
          <button
            onClick={() => setSelectedTab("success")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === "success"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setSelectedTab("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Pending
          </button>
        </div>

        {/* Donations List */}
        {isDonationsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No donations yet
            </h3>
            <p className="text-gray-600">
              Start supporting projects to see your donations here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donations.map((donation: any) => (
              <div
                key={donation._id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
              >
                {/* Donation Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {donation.project?.title || "Project"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(donation.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {getStatusBadge(donation.paymentStatus)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        ৳{donation.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Transaction: {donation.transactionId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reward Section */}
                {donation.rewardValue > 0 && donation.paymentStatus === "success" && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-900">
                          Reward: ৳{donation.rewardValue}
                        </span>
                      </div>
                      {getRewardStatusBadge(donation.rewardStatus)}
                    </div>

                    {donation.rewardStatus === "pending" && (
                      <button
                        onClick={() => handleViewQR(donation._id)}
                        className="w-full mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <QrCode className="h-4 w-4" />
                        View QR Code
                      </button>
                    )}
                  </div>
                )}

                {/* Message Section */}
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    {editingMessage === donation._id ? (
                      <div className="flex-1">
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          maxLength={500}
                          placeholder="Add a message to your donation..."
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {messageText.length}/500
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingMessage(null)}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleSaveMessage(donation._id)}
                              disabled={isUpdatingMessage}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          {donation.message || "No message"}
                        </p>
                        {donation.paymentStatus === "success" && (
                          <button
                            onClick={() => handleEditMessage(donation)}
                            className="text-blue-600 hover:text-blue-700 text-xs mt-1 flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit message
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQRModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-16 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 mt-24">
            <div className="flex justify-between items-center mb-4 mt-14">
              <h3 className="text-lg font-semibold">Your Reward QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isQRLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : qrData?.data ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
                  {qrFormat === "url" && qrData.data.qrCodeUrl ? (
                    <Image
                      src={qrData.data.qrCodeUrl}
                      alt="Reward QR Code"
                      width={256}
                      height={256}
                      className="rounded-lg"
                    />
                  ) : qrFormat === "base64" && qrData.data.qrCode ? (
                    <img
                      src={qrData.data.qrCode}
                      alt="Reward QR Code"
                      className="rounded-lg"
                      width={256}
                      height={256}
                    />
                  ) : (
                    <p className="text-gray-500">QR code not available</p>
                  )}
                </div>

                {/* Reward Details Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="h-5 w-5 text-purple-600" />
                    <h4 className="font-bold text-purple-900">Your Reward Voucher</h4>
                  </div>
                  
                  <div className="space-y-3 bg-white rounded-lg p-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-600">Reward Value:</span>
                      <span className="text-xl font-bold text-green-600">
                        ৳{qrData.data.rewardValue.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-600">Donation Amount:</span>
                      <span className="font-semibold text-gray-900">
                        ৳{donations.find((d: any) => d._id === selectedDonation)?.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      {qrData.data.rewardStatus === "pending" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          ⏳ Ready to Redeem
                        </span>
                      ) : qrData.data.rewardStatus === "redeemed" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          ✓ Already Redeemed
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {qrData.data.rewardStatus}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valid Until:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(() => {
                          try {
                            const donation = donations.find((d: any) => d._id === selectedDonation);
                            const createdDate = new Date(donation?.createdAt);
                            const expiryDate = new Date(createdDate);
                            expiryDate.setDate(expiryDate.getDate() + 30);
                            return expiryDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            });
                          } catch {
                            return "N/A";
                          }
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Reward Tier Details */}
                  {(() => {
                    const donation = donations.find((d: any) => d._id === selectedDonation);
                    const rewardTierDetails = donation?.rewardTierDetails;
                    
                    if (rewardTierDetails) {
                      return (
                        <div className="mt-4 bg-white rounded-lg p-4 border border-purple-200">
                          <h5 className="font-semibold text-purple-900 mb-2">
                            🎁 {rewardTierDetails.title}
                          </h5>
                          <p className="text-sm text-gray-700 mb-3">
                            {rewardTierDetails.description}
                          </p>
                          {rewardTierDetails.items && rewardTierDetails.items.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-600 mb-1">Includes:</p>
                              {rewardTierDetails.items.map((item: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                  <span className="text-green-500">✓</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    How to Redeem
                  </h5>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Show this QR code to the project creator</li>
                    <li>They will scan and verify your reward</li>
                    <li>Collect your physical reward on-site</li>
                    <li>Status will update to "Redeemed"</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setQrFormat(qrFormat === "url" ? "base64" : "url")
                    }
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    {qrFormat === "url" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {qrFormat === "url" ? "Show Base64" : "Show URL"}
                  </button>
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Show this QR code at the project location to redeem your reward
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to load QR code</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}