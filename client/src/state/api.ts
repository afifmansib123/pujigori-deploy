import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

// Interface User object
interface User {
  cognitoInfo: {
    signInDetails?: any;
    username: string;
    userId: string;
  };
  userInfo: any;
  userRole: string;
}

type UserRole = "user" | "creator" | "admin";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      try {
        const session = await fetchAuthSession();
        const { idToken } = session.tokens ?? {};
        if (idToken) {
          headers.set("Authorization", `Bearer ${idToken}`);
        }
      } catch (error) {
        console.error("Failed to get auth session:", error);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    "User",
    "Project",
    "Upload",
    "Payment",
    "AdminStats",
    "Donation",
    "PaymentRequest",
  ],
  endpoints: (build) => ({
    // Auth related endpont

    getAuthUser: build.query<User, void>({
      queryFn: async () => {
        try {
          const session = await fetchAuthSession();
          const { idToken } = session.tokens ?? {};

          if (!idToken) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "No valid session found",
              },
            };
          }

          const user = await getCurrentUser();

          // Get user role from token
          const userRole =
            (idToken?.payload?.["custom:role"] as UserRole) || "user";

          // Handle user attributes for both OAuth and regular users
          let userAttributes = {};

          try {
            // Try to fetch user attributes (works for regular Cognito users)
            const { fetchUserAttributes } = await import("aws-amplify/auth");
            userAttributes = await fetchUserAttributes();
            console.log("Fetched user attributes via API:", userAttributes);
          } catch (attributeError) {
            console.log(
              "Could not fetch user attributes via API (likely OAuth user), using token payload:",
              attributeError
            );

            // For OAuth users, extract info from JWT token payload
            userAttributes = {
              email: idToken.payload.email as string,
              name:
                (idToken.payload.name as string) ||
                (idToken.payload.given_name as string) ||
                (idToken.payload.email as string)?.split("@")[0] ||
                "User",
              given_name: idToken.payload.given_name as string,
              family_name: idToken.payload.family_name as string,
              phone_number: idToken.payload.phone_number as string,
            };
          }

          console.log("Final user attributes:", userAttributes);
          console.log("User from getCurrentUser:", user);

          // Check if user exists in database
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/profile/${user.userId}`,
              {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
              }
            );

            if (!response.ok) {
              if (response.status === 404) {
                // Parse the error response to get more details
                const errorData = await response.json();

                // Check if this is specifically a "needs registration" error
                if (
                  errorData.errors &&
                  errorData.errors[0]?.needsRegistration
                ) {
                  return {
                    error: {
                      status: "USER_NOT_IN_DB",
                      cognitoUser: user,
                      userRole,
                      userAttributes,
                    },
                  } as any;
                }
              }

              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            }

            const userProfile = await response.json();

            return {
              data: {
                cognitoInfo: {
                  signInDetails: user.signInDetails,
                  username: user.username,
                  userId: user.userId,
                },
                userInfo: userProfile.data,
                userRole,
              },
            };
          } catch (dbError) {
            console.error("Database check error:", dbError);
            // Database check failed, return error for user creation
            return {
              error: {
                status: "USER_NOT_IN_DB",
                cognitoUser: user,
                userRole,
                userAttributes,
              },
            };
          }
        } catch (error: any) {
          console.error("getAuthUser error:", error);
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Could not fetch user data",
            },
          };
        }
      },
      providesTags: ["User"],
    }),

    /* ----------------------------User Related Endpoints--------------------------------------------*/

    // Separate endpoint to get user profile
    getUserProfile: build.query<any, string>({
      query: (userId) => `/auth/profile/${userId}`,
      providesTags: ["User"],
    }),

    // Manual user creation
    createUser: build.mutation<
      any,
      {
        cognitoId: string;
        name: string;
        email: string;
        phoneNumber?: string;
        role?: string;
      }
    >({
      query: (userData) => ({
        url: "/auth/create-user",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),

    // Update user profile
    updateUserProfile: build.mutation<any, { userId: string; data: any }>({
      query: ({ userId, data }) => ({
        url: `/auth/profile/${userId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    //get all users

    getAllUsers: build.query<
      any,
      {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
      }
    >({
      query: (filters = {}) => ({
        url: "/auth/users",
        params: filters,
      }),
      providesTags: ["User"],
    }),

    //update user role

    updateUserRole: build.mutation<any, { userId: string; role: string }>({
      query: ({ userId, role }) => ({
        url: `/auth/users/${userId}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["User"],
    }),

    /* ----------------------------Admin Related Endpoints--------------------------------------------*/

    //admin's get dashboard

    getDashboard: build.query<any, { period?: number }>({
      query: ({ period = 30 } = {}) => ({
        url: "/admin/dashboard",
        params: { period },
      }),
      providesTags: ["AdminStats"],
    }),

    //admin's get payment requests

    getPaymentRequests: build.query<
      any,
      {
        page?: number;
        limit?: number;
        status?: string;
        minAmount?: number;
        maxAmount?: number;
        sortBy?: string;
        sortOrder?: string;
      }
    >({
      query: (params = {}) => ({
        url: "/admin/payment-requests",
        params,
      }),
      providesTags: ["PaymentRequest"],
    }),

    // delete users permanatly

    // Add this to your endpoints in createApi
    deleteUser: build.mutation<any, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    /* ----------------------------Project Related Endpoints--------------------------------------------*/

    // get all projects

    getProjects: build.query<
      any,
      {
        page?: number;
        limit?: number;
        category?: string;
        status?: string;
        division?: string;
        search?: string;
        sort?: string;
        sortOrder?: string;
        featured?: boolean;
      }
    >({
      query: (filters = {}) => ({
        url: "/projects",
        params: filters,
      }),
      providesTags: ["Project"],
    }),

    // Get projects by creator

    getProjectsByCreator: build.query<
      any,
      {
        creatorId: string;
        page?: number;
        limit?: number;
        status?: string;
      }
    >({
      query: ({ creatorId, ...params }) => ({
        url: `/projects/creator/${creatorId}`,
        params,
      }),
      providesTags: (result, error, { creatorId }) => [
        { type: "Project", id: `creator-${creatorId}` },
      ],
    }),

    // create project

    createProject: build.mutation<
      any,
      {
        title: string;
        description: string;
        shortDescription: string;
        category: string;
        targetAmount: number;
        startDate: string;
        endDate: string;
        location: { district: string; division: string };
        story: string;
        risks: string;
        images?: string[];
        videoUrl?: string;
        rewardTiers?: any[];
        tags?: string[];
      }
    >({
      query: (projectData) => ({
        url: "/projects",
        method: "POST",
        body: projectData,
      }),
      invalidatesTags: ["Project"],
    }),

    // get trending projects -> Can show on homepage

    getTrendingProjects: build.query<any, { limit?: number }>({
      query: ({ limit = 6 } = {}) => ({
        url: "/projects/trending",
        params: { limit },
      }),
      providesTags: ["Project"],
    }),

    // get projects by category -> Can use on search page

    getProjectsByCategory: build.query<any, void>({
      query: () => "/projects/categories",
      providesTags: ["Project"],
    }),

    // get project by slug -> Use this to get single project infos, this also has donation related info in the controller as if target , current amount etc

    getProject: build.query<any, string>({
      query: (slug) => `/projects/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Project", id: slug }],
    }),

    // update project by id -> creator id has to match logged in id to update

    updateProject: build.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/projects/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Project", id }],
    }),

    // delete project by id

    deleteProject: build.mutation<any, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),

    // what updates were done to the project

    getProjectUpdates: build.query<any, string>({
      query: (id) => `/projects/${id}/updates`,
      providesTags: (result, error, id) => [
        { type: "Project", id: `${id}-updates` },
      ],
    }),

    // add more updates to the project

    addProjectUpdate: build.mutation<
      any,
      {
        id: string;
        data: { title: string; content: string; images?: string[] };
      }
    >({
      query: ({ id, data }) => ({
        url: `/projects/${id}/updates`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: `${id}-updates` },
      ],
    }),

    // get statistics of project by id -> all info DONATION related data

    getProjectStats: build.query<any, string>({
      query: (id) => `/projects/${id}/stats`,
      providesTags: (result, error, id) => [
        { type: "Project", id: `${id}-stats` },
      ],
    }),

    /* ----------------------------S3 / Files Related Endpoints --------------------------------------------*/

    // uplod multiple files - Upload images role based

    uploadMultipleFiles: build.mutation<
      any,
      {
        files: File[];
        folder?: string;
        resize?: string;
        quality?: number;
      }
    >({
      query: ({ files, folder = "uploads", resize, quality }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("folder", folder);
        if (resize) formData.append("resize", resize);
        if (quality) formData.append("quality", quality.toString());

        return {
          url: "/upload/multiple",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Upload"],
    }),

    /* ----------------------------Payment Related Endpoints --------------------------------------------*/

    //initiatePayment endpoint

    initiatePayment: build.mutation<
      any,
      {
        projectId: string;
        amount: number;
        rewardTierId?: string;
        customerName: string;
        customerEmail: string;
        customerPhone?: string;
        customerAddress?: string;
        isAnonymous?: boolean;
        message?: string;
      }
    >({
      query: (paymentData) => ({
        url: "/payments/initiate",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Payment"],
    }),

    // get payment methods

    getPaymentMethods: build.query<any, void>({
      query: () => "/payments/methods",
    }),

    // get payment status -> status and data of certain transactions : use this to check payment status

    getPaymentStatus: build.query<any, string>({
      query: (transactionId) => `/payments/${transactionId}/status`,
      providesTags: (result, error, transactionId) => [
        { type: "Payment", id: transactionId },
      ],
    }),

    // get payment statistics - Admin Use Only

    getPaymentStatistics: build.query<
      any,
      { startDate?: string; endDate?: string }
    >({
      query: (params = {}) => ({
        url: "/payments/statistics",
        params,
      }),
      providesTags: ["AdminStats"],
    }),

    // initiate a refund -> Admin Use Only

    initiateRefund: build.mutation<
      any,
      { transactionId: string; reason?: string }
    >({
      query: ({ transactionId, reason }) => ({
        url: `/payments/${transactionId}/refund`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { transactionId }) => [
        { type: "Payment", id: transactionId },
      ],
    }),

    // varify a payment -> Admin Use Only

    verifyPayment: build.mutation<
      any,
      { transactionId: string; validationId: string; amount?: number }
    >({
      query: (data) => ({
        url: "/payments/verify",
        method: "POST",
        body: data,
      }),
    }),

    /* ----------------------------Donation Related Endpoints --------------------------------------------*/

    // get all donations details

    getDonations: build.query<
      any,
      {
        page?: number;
        limit?: number;
        projectId?: string;
        status?: string;
        minAmount?: number;
        maxAmount?: number;
        startDate?: string;
        endDate?: string;
        hasReward?: boolean;
        sort?: string;
        sortOrder?: string;
      }
    >({
      query: (filters = {}) => ({
        url: "/donations",
        params: filters,
      }),
      providesTags: ["Donation"],
    }),

    // get donation by id

    getDonation: build.query<any, string>({
      query: (id) => `/donations/${id}`,
      providesTags: (result, error, id) => [{ type: "Donation", id }],
    }),

    //  get individual project donations / payment related informations

    getProjectDonations: build.query<
      any,
      {
        projectId: string;
        page?: number;
        limit?: number;
        status?: string;
        includeAnonymous?: boolean;
      }
    >({
      query: ({ projectId, ...params }) => ({
        url: `/donations/project/${projectId}`,
        params,
      }),
      providesTags: (result, error, { projectId }) => [
        { type: "Donation", id: `project-${projectId}` },
      ],
    }),

    // get donations done by a user by the userid

    getUserDonations: build.query<
      any,
      {
        userId: string;
        page?: number;
        limit?: number;
        status?: string;
      }
    >({
      query: ({ userId, ...params }) => ({
        url: `/donations/user/${userId}`,
        params,
      }),
      providesTags: (result, error, { userId }) => [
        { type: "Donation", id: `user-${userId}` },
      ],
    }),

    // most recent donations made

    getRecentDonations: build.query<
      any,
      { limit?: number; includeAnonymous?: boolean }
    >({
      query: (params = {}) => ({
        url: "/donations/recent",
        params,
      }),
      providesTags: ["Donation"],
    }),

    // donation qr by donation id -> this will be the ffirst api to generate a reward baseed qr for donations made.

    getDonationQR: build.query<any, { id: string; format?: string }>({
      query: ({ id, format = "url" }) => ({
        url: `/donations/${id}/qr`,
        params: { format },
      }),
      providesTags: (result, error, { id }) => [
        { type: "Donation", id: `${id}-qr` },
      ],
    }),

    // redeem rewards by donation id

    redeemReward: build.mutation<
      any,
      { id: string; notes?: string; redeemedBy?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/donations/${id}/redeem`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Donation", id }],
    }),

    // get pending rewards

    getPendingRewards: build.query<
      any,
      {
        page?: number;
        limit?: number;
        projectId?: string;
        minValue?: number;
        createdAfter?: string;
      }
    >({
      query: (params = {}) => ({
        url: "/donations/rewards/pending",
        params,
      }),
      providesTags: ["Donation"],
    }),

    // get donation statistics of project by project id

    getDonationStatistics: build.query<
      any,
      {
        projectId?: string;
        startDate?: string;
        endDate?: string;
        groupBy?: string;
      }
    >({
      query: (params = {}) => ({
        url: "/donations/statistics",
        params,
      }),
      providesTags: ["AdminStats"],
    }),

    // update doner's message by donation id

    updateDonorMessage: build.mutation<any, { id: string; message?: string }>({
      query: ({ id, message }) => ({
        url: `/donations/${id}/message`,
        method: "POST",
        body: { message },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Donation", id }],
    }),

    // ==================== PAYMENT REQUEST ENDPOINTS (CREATOR) ====================
    createPaymentRequest: build.mutation<
      any,
      {
        projectId: string;
        requestedAmount: number;
        bankDetails: {
          accountHolder: string;
          bankName: string;
          accountNumber: string;
          routingNumber?: string;
          branchName: string;
        };
      }
    >({
      query: (data) => ({
        url: "/payment-requests",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PaymentRequest", "Project"],
    }),

    getCreatorPaymentRequests: build.query<
      any,
      {
        page?: number;
        limit?: number;
        status?: string;
      }
    >({
      query: (params = {}) => ({
        url: "/payment-requests/creator",
        params,
      }),
      providesTags: ["PaymentRequest"],
    }),

    getProjectPaymentRequests: build.query<any, string>({
      query: (projectId) => `/payment-requests/project/${projectId}`,
      providesTags: (result, error, projectId) => [
        { type: "PaymentRequest", id: `project-${projectId}` },
      ],
    }),

    getPaymentRequest: build.query<any, string>({
      query: (id) => `/payment-requests/${id}`,
      providesTags: (result, error, id) => [{ type: "PaymentRequest", id }],
    }),

    // ==================== ADMIN PAYMENT REQUEST ACTIONS ====================
    approvePaymentRequest: build.mutation<
      any,
      { requestId: string; notes?: string }
    >({
      query: ({ requestId, notes }) => ({
        url: `/admin/payment-requests/${requestId}/approve`,
        method: "POST",
        body: { notes },
      }),
      invalidatesTags: ["PaymentRequest", "AdminStats", "Project"],
    }),

    rejectPaymentRequest: build.mutation<
      any,
      { requestId: string; reason: string }
    >({
      query: ({ requestId, reason }) => ({
        url: `/admin/payment-requests/${requestId}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["PaymentRequest", "AdminStats"],
    }),

    markPaymentAsPaid: build.mutation<
      any,
      {
        requestId: string;
        notes?: string;
        transactionReference?: string;
      }
    >({
      query: ({ requestId, notes, transactionReference }) => ({
        url: `/admin/payment-requests/${requestId}/mark-paid`,
        method: "POST",
        body: { notes, transactionReference },
      }),
      invalidatesTags: ["PaymentRequest", "AdminStats", "Project"],
    }),

    // ==================== ADMIN PROJECT MANAGEMENT ====================
    getAdminProjects: build.query<
      any,
      {
        page?: number;
        limit?: number;
        status?: string;
        category?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
        includeInactive?: boolean;
      }
    >({
      query: (params = {}) => ({
        url: "/admin/projects",
        params,
      }),
      providesTags: ["Project"],
    }),

    updateProjectStatus: build.mutation<
      any,
      {
        projectId: string;
        status: string;
        reason?: string;
      }
    >({
      query: ({ projectId, status, reason }) => ({
        url: `/admin/projects/${projectId}/status`,
        method: "PUT",
        body: { status, reason },
      }),
      invalidatesTags: ["Project", "AdminStats"],
    }),

    // ==================== ADMIN DONATIONS ====================
    getAdminDonations: build.query<
      any,
      {
        page?: number;
        limit?: number;
        status?: string;
        projectId?: string;
        minAmount?: number;
        maxAmount?: number;
        flagged?: boolean;
        sortBy?: string;
        sortOrder?: string;
      }
    >({
      query: (params = {}) => ({
        url: "/admin/donations",
        params,
      }),
      providesTags: ["Donation"],
    }),

    // ==================== ADMIN ANALYTICS ====================
    getAdminAnalytics: build.query<
      any,
      {
        period?: string;
        groupBy?: string;
      }
    >({
      query: (params = {}) => ({
        url: "/admin/analytics",
        params,
      }),
      providesTags: ["AdminStats"],
    }),

    getFinancialReport: build.query<
      any,
      {
        startDate: string;
        endDate: string;
        format?: string;
      }
    >({
      query: (params) => ({
        url: "/admin/reports/financial",
        params,
      }),
      providesTags: ["AdminStats"],
    }),

    // Inside your endpoints in createApi

    // Get available balance for a specific project
    getProjectBalance: build.query<any, string>({
      query: (projectId) => `/payment-requests/project/${projectId}/balance`,
      providesTags: (result, error, projectId) => [
        { type: "PaymentRequest", id: `balance-${projectId}` },
        { type: "Donation", id: `project-${projectId}` },
      ],
    }),

    // Get balances for all creator's projects
    getCreatorBalances: build.query<any, void>({
      query: () => "/payment-requests/creator/balances",
      providesTags: ["PaymentRequest", "Donation", "Project"],
    }),

    //below is closing tag for all endpoints
  }),
});

export const {
  useGetAuthUserQuery,
  useGetUserProfileQuery,
  useCreateUserMutation,
  useUpdateUserProfileMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useGetTrendingProjectsQuery,
  useGetProjectsByCategoryQuery,
  useGetProjectQuery,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectUpdatesQuery,
  useAddProjectUpdateMutation,
  useGetProjectStatsQuery,
  useGetProjectsByCreatorQuery,
  useInitiatePaymentMutation,
  useGetPaymentMethodsQuery,
  useGetPaymentStatusQuery,
  useGetPaymentStatisticsQuery,
  useInitiateRefundMutation,
  useVerifyPaymentMutation,
  useGetDonationsQuery,
  useGetDonationQuery,
  useGetProjectDonationsQuery,
  useGetUserDonationsQuery,
  useGetRecentDonationsQuery,
  useGetDonationQRQuery,
  useRedeemRewardMutation,
  useGetPendingRewardsQuery,
  useGetDonationStatisticsQuery,
  useUpdateDonorMessageMutation,
  useGetDashboardQuery,
  useGetPaymentRequestsQuery,
  useUploadMultipleFilesMutation,
  useCreatePaymentRequestMutation,
  useGetCreatorPaymentRequestsQuery,
  useGetProjectPaymentRequestsQuery,
  useGetPaymentRequestQuery,
  useApprovePaymentRequestMutation,
  useRejectPaymentRequestMutation,
  useMarkPaymentAsPaidMutation,
  useGetAdminProjectsQuery,
  useUpdateProjectStatusMutation,
  useGetAdminDonationsQuery,
  useGetAdminAnalyticsQuery,
  useGetFinancialReportQuery,
  useGetProjectBalanceQuery,
  useGetCreatorBalancesQuery,
  useDeleteUserMutation,
} = api;
