import React from "react";
import { Amplify } from "aws-amplify";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useGetAuthUserQuery, useCreateUserMutation } from "@/state/api";
import CustomAuth from "./CustomAuth"; // Import your custom auth component

// Database sync component (keep this the same)
// Update your DatabaseSync component:
function DatabaseSync({ children }: { children: React.ReactNode }) {
  const { user } = useAuthenticator((context) => [context.user]);
  const { data: authUser, isLoading, error, refetch } = useGetAuthUserQuery(undefined, {
    skip: !user,
  });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [hasTriedCreation, setHasTriedCreation] = React.useState(false); // Add this

  useEffect(() => {
    const handleUserCreation = async () => {
      if (!user || isLoading || authUser || hasTriedCreation) return; // Check hasTriedCreation
      
      if (error && (error as any)?.status === "USER_NOT_IN_DB") {
        setHasTriedCreation(true); // Set flag to prevent retries
        
        const cognitoUser = (error as any).cognitoUser;
        const userRole = (error as any).userRole;
        const userAttributes = (error as any).userAttributes;
        
        console.log('Creating user with attributes:', userAttributes);
        
        try {
          let attributes = userAttributes;
          if (!attributes) {
            const { fetchUserAttributes } = await import('aws-amplify/auth');
            attributes = await fetchUserAttributes();
          }
          
          let userName = attributes.name || attributes.given_name || attributes.email?.split('@')[0] || cognitoUser.username || 'User';
          
          await createUser({
            cognitoId: cognitoUser.userId,
            name: userName,
            email: attributes.email || '',
            phoneNumber: attributes.phone_number || '',
            role: userRole || 'user',
          }).unwrap();
          
          console.log('User created successfully, refetching...');
          refetch();
        } catch (createError: any) {
          console.error('Failed to create user:', createError);
          if (createError.status !== 409) { // If not a conflict error, allow retry
            setHasTriedCreation(false);
          }
        }
      }
    };
    
    handleUserCreation();
  }, [user, error, isLoading, authUser, createUser, refetch, hasTriedCreation]);

  // Reset flag when user changes
  useEffect(() => {
    setHasTriedCreation(false);
  }, [user?.userId]);

  if (user && (isLoading || isCreating)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (user && error && (error as any)?.status !== "USER_NOT_IN_DB" && hasTriedCreation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <p>Failed to sync account. Please try refreshing the page.</p>
          <p className="text-sm mt-2">Error: {(error as any)?.error || 'Unknown error'}</p>
          <button 
            onClick={() => setHasTriedCreation(false)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const Auth = ({ children }: { children: React.ReactNode }) => {
  const { user: amplifyUser } = useAuthenticator((context) => [context.user]);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname.match(/^\/(signin|signup)$/);
  const isDashboardPage =
    pathname.startsWith("/user") ||
    pathname.startsWith("/creator") ||
    pathname.startsWith("/admin");

  // Configure Amplify only on client side
  useEffect(() => {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
          userPoolClientId:
            process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
          loginWith: {
            oauth: {
              domain: process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN!,
              scopes:['openid', 'email', 'profile'],
              redirectSignIn: [
                typeof window !== 'undefined'
                  ? window.location.origin + '/'
                  : 'https://pujigori-deploy.vercel.app/'
              ],
              redirectSignOut: [
                typeof window !== 'undefined'
                  ? window.location.origin + '/'
                  : 'https://pujigori-deploy.vercel.app/'
              ],
              responseType: "code",
              providers: ["Google"],
            },
          },
        },
      },
    });

    console.log("Amplify configured with:", {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID,
      domain: process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN,
    });
  }, []);

  // For non-auth and non-dashboard pages, just return children with DatabaseSync
  if (!isAuthPage && !isDashboardPage) {
    return <DatabaseSync>{children}</DatabaseSync>;
  }

  // For auth pages or dashboard pages, use the custom auth component
  return (
    <CustomAuth key={amplifyUser?.userId || "unauthenticated"}>
      <DatabaseSync>{children}</DatabaseSync>
    </CustomAuth>
  );
};

export default Auth;
