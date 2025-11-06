// utils/authUtils.ts

import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";

interface CreateUserData {
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

interface FetchWithBQFunction {
  (arg: { url: string; method: string; body: CreateUserData }): Promise<any>;
  (url: string): Promise<any>;
}

/**
 * Create new user in database after Cognito signup
 */
export const createNewUserInDatabase = async (
  user: any,
  idToken: any,
  userRole: string,
  fetchWithBQ: FetchWithBQFunction
): Promise<any> => {
  try {
    // Get user attributes from Cognito
    const userAttributes = await fetchUserAttributes();
    
    const createUserResponse = await fetchWithBQ({
      url: "/auth/create-user",
      method: "POST",
      body: {
        cognitoId: user.userId,
        name: userAttributes.name || userAttributes.given_name || user.username || 'New User',
        email: userAttributes.email || idToken?.payload?.email || user.signInDetails?.loginId || '',
        phoneNumber: userAttributes.phone_number || '',
        role: userRole || 'user',
      },
    });

    if (createUserResponse.error) {
      throw new Error("Failed to create user record");
    }

    return createUserResponse;
  } catch (error) {
    console.error('Error creating user in database:', error);
    throw error;
  }
};

/**
 * Get user role from token with fallback
 */
export const getUserRoleFromToken = (idToken: any): string => {
  return idToken?.payload?.["custom:role"] || 'user';
};

/**
 * Check if user needs database registration
 * Safely checks for various error conditions
 */
export const needsDatabaseRegistration = (response: any): boolean => {
  if (!response || !response.error) {
    return false;
  }

  const error = response.error;

  // Check if it's a 404 error (user not found)
  if (typeof error === 'object') {
    // Handle FetchBaseQueryError structure
    if ('status' in error && error.status === 404) {
      return true;
    }
    
    // Handle custom error status
    if ('status' in error && typeof error.status === 'string') {
      return error.status === "CUSTOM_ERROR" || 
             error.status === "FETCH_ERROR";
    }

    // Check error message content
    if ('data' in error && error.data && typeof error.data === 'object') {
      const message = (error.data as any).message;
      if (typeof message === 'string' && message.includes('User not found')) {
        return true;
      }
    }
  }

  return false;
};