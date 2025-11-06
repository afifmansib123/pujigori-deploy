"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  useGetDonationQuery, 
  useRedeemRewardMutation,
  useGetAuthUserQuery 
} from "@/state/api";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User, 
  Mail, 
  Calendar,
  Gift,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VerifyRewardPage() {
  const params = useParams();
  const donationId = params?.id as string;
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [canRedeem, setCanRedeem] = useState(false);

  const { data: donationData, isLoading: donationLoading, error, refetch } = useGetDonationQuery(donationId);
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const [redeemReward] = useRedeemRewardMutation();

  const donation = donationData?.data;

  // ✅ Simple check using projectCreator from donation
  useEffect(() => {
    if (!authLoading && !donationLoading && authUser && donation) {
      const isAdmin = authUser?.userRole === "admin";
      const userCognitoId = authUser?.userInfo?.cognitoId;
      const donationProjectCreator = donation.projectCreator; // ✅ Direct from donation!
      
      const isProjectCreator = userCognitoId && donationProjectCreator && 
                               userCognitoId === donationProjectCreator;
      
      console.log("Auth check:", {
        userCognitoId,
        donationProjectCreator,
        isProjectCreator,
        isAdmin,
        userRole: authUser?.userRole
      });
      
      setCanRedeem(isAdmin || isProjectCreator);
    }
  }, [authUser, donation, authLoading, donationLoading]);

  // Get reward value - handle multiple possible field names
  const rewardValue = donation?.rewardTier?.value || 
                     donation?.rewardValue || 
                     donation?.selectedReward?.value || 
                     0;

  const isExpired = donation?.createdAt
    ? (() => {
        const createdDate = new Date(donation.createdAt);
        const expiryDate = new Date(createdDate);
        expiryDate.setDate(expiryDate.getDate() + 30);
        return expiryDate < new Date();
      })()
    : false;

  const hasReward = rewardValue > 0 || donation?.rewardTier;
  
  const isValid = donation?.paymentStatus === "success" && 
                  donation?.rewardStatus === "pending" && 
                  hasReward &&
                  !isExpired;

  const handleRedeem = async () => {
    if (!canRedeem || !isValid) return;

    setIsRedeeming(true);
    try {
      await redeemReward({
        id: donationId,
        notes: `Redeemed by ${authUser?.userInfo?.name || 'Staff'}`,
        redeemedBy: authUser?.userInfo?._id
      }).unwrap();

      toast.success("Reward marked as redeemed successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to redeem reward");
    } finally {
      setIsRedeeming(false);
    }
  };

  // Show loading
  if (donationLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying reward...</p>
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
          <p className="text-gray-600">
            This reward code could not be found or is invalid.
          </p>
        </div>
      </div>
    );
  }

  const statusColor = isValid 
    ? "from-green-500 to-green-600" 
    : donation.rewardStatus === "redeemed"
    ? "from-blue-500 to-blue-600"
    : "from-red-500 to-red-600";

  const statusIcon = isValid 
    ? <CheckCircle className="h-16 w-16 text-white mx-auto mb-3" />
    : donation.rewardStatus === "redeemed"
    ? <Gift className="h-16 w-16 text-white mx-auto mb-3" />
    : <XCircle className="h-16 w-16 text-white mx-auto mb-3" />;

  const statusText = isValid 
    ? "✓ Valid Reward" 
    : donation.rewardStatus === "redeemed"
    ? "Already Redeemed"
    : isExpired 
    ? "Expired Reward"
    : "Invalid Reward";

  const statusSubtext = isValid 
    ? "Ready to redeem" 
    : donation.rewardStatus === "redeemed"
    ? `Redeemed on ${donation.redeemedAt ? new Date(donation.redeemedAt).toLocaleDateString() : 'Unknown date'}`
    : isExpired 
    ? "This reward has expired"
    : "This reward cannot be redeemed";

  const displayValue = rewardValue > 0 ? rewardValue : "Reward Included";

  // Get project title from populated project or fallback
  const projectTitle = typeof donation.project === 'object' 
    ? donation.project?.title 
    : "Unknown Project";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-6 text-center bg-gradient-to-r ${statusColor}`}>
            {statusIcon}
            <h2 className="text-2xl font-bold text-white mb-1">{statusText}</h2>
            <p className="text-white text-opacity-90 text-sm">{statusSubtext}</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Reward Value */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Reward Value</p>
              <p className="text-4xl font-bold text-green-600">
                {typeof displayValue === 'number' 
                  ? `৳${displayValue.toLocaleString()}`
                  : displayValue
                }
              </p>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase">Customer Name</p>
                  <p className="font-medium">
                    {donation.donorDisplayName || donation.donorEmail?.split('@')[0] || 'Anonymous'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email / Contact</p>
                  <p className="font-medium">{donation.donorEmail || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase">Valid Until</p>
                  <p className="font-medium">
                    {(() => {
                      const createdDate = new Date(donation.createdAt);
                      const expiryDate = new Date(createdDate);
                      expiryDate.setDate(expiryDate.getDate() + 30);
                      return expiryDate.toLocaleDateString();
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Original Donation Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Original Donation</span>
                <span className="font-semibold">৳{(donation.amount || 0).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Donated on {new Date(donation.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Staff Instructions */}
            {isValid && canRedeem && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Creator Instructions:</p>
                    <ol className="text-sm text-green-800 mt-2 space-y-1">
                      <li>1. Verify customer name or email matches</li>
                      <li>2. Provide reward worth {typeof displayValue === 'number' 
                        ? `৳${displayValue.toLocaleString()}`
                        : 'the promised reward'
                      }</li>
                      <li>3. Mark as redeemed below</li>
                      <li>4. Thank the customer!</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Redeem Button */}
            {isValid && canRedeem && (
              <Button
                onClick={handleRedeem}
                disabled={isRedeeming}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Mark as Redeemed
                  </>
                )}
              </Button>
            )}

            {/* Access Restricted Message */}
            {isValid && !canRedeem && authUser && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <p className="text-yellow-800 font-semibold mb-1">⚠️ Access Restricted</p>
                <p className="text-yellow-700">
                  Only the project creator or admin can redeem rewards. 
                  This reward belongs to project: <span className="font-semibold">{projectTitle}</span>
                </p>
              </div>
            )}

            {/* Not Logged In */}
            {isValid && !authUser && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-center">
                <p className="text-yellow-800">
                  Please log in as the project creator to redeem this reward.
                </p>
              </div>
            )}

            {/* Already Redeemed Status */}
            {donation.rewardStatus === "redeemed" && (
              <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200 text-center">
                <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="text-blue-900 font-semibold">This reward was already redeemed</p>
                {donation.redeemedAt && (
                  <p className="text-sm text-blue-700 mt-1">
                    on {new Date(donation.redeemedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Expired Status */}
            {isExpired && donation.rewardStatus !== "redeemed" && (
              <div className="bg-red-50 rounded-xl p-5 border-2 border-red-200 text-center">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <p className="text-red-900 font-semibold">This reward has expired</p>
                <p className="text-sm text-red-700 mt-1">
                  Rewards expire 30 days after donation
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>ID: {donation._id?.toString().slice(-8)}</span>
              <span>Project: {projectTitle}</span>
            </div>
          </div>
        </div>

        {/* Powered by footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Secured by <span className="font-bold text-green-600">PujiGori</span>
          </p>
        </div>
      </div>
    </div>
  );
}