import React, { useState } from "react";
import {
  signIn,
  signUp,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser
} from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import FooterSection from "../(nondashboard)/landing/FooterSection";
import Image from "next/image";
import { signInWithRedirect } from "aws-amplify/auth";

interface CustomAuthProps {
  children: React.ReactNode;
}

const CustomAuth: React.FC<CustomAuthProps> = ({ children }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

React.useEffect(() => {
  checkAuthState();
}, []);

// Add the new OAuth redirect handler useEffect here
// Add the new OAuth redirect handler useEffect here
React.useEffect(() => {
  const handleOAuthResponse = async () => {
    try {
      // Check if there's a code parameter in the URL (OAuth response)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        console.log('OAuth response detected, processing...', { code: code.substring(0, 8) + '...', state: state.substring(0, 8) + '...' });
        setIsGoogleLoading(true);
        
        // Clean the URL parameters immediately to prevent reprocessing
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Wait for Amplify to process the OAuth response
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            const session = await fetchAuthSession({ forceRefresh: true });
            
            if (session.tokens) {
              console.log('OAuth processing completed successfully');
              setIsAuthenticated(true);
              return; // Exit the function
            }
          } catch (error) {
            console.log(`Retry ${retries + 1}/${maxRetries}:`, error);
          }
          retries++;
        }
        
        // If we get here, OAuth processing failed
        console.error('OAuth processing failed after retries');
        setError('Failed to complete Google sign in');
      }
    } catch (error) {
      console.error('OAuth response error:', error);
      setError('Failed to process Google sign in');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  handleOAuthResponse();
}, []); // Empty dependency array - only run once

const checkAuthState = async () => {
  try {
    console.log('Checking auth state...');
    const session = await fetchAuthSession();
    console.log('Session:', session);
    
    if (session.tokens) {
      console.log('Valid tokens found, user is authenticated');
      setIsAuthenticated(true);
    } else {
      console.log('No valid tokens found');
      setIsAuthenticated(false);
    }
  } catch (error) {
    console.error('Auth check error:', error);
    setIsAuthenticated(false);
  }
};

  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
        <FooterSection />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      await signIn({ username, password });
      setIsAuthenticated(true);
      window.location.href = "/";
    } catch (error: any) {
      setError(error.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            name,
            "custom:role": role,
          },
        },
      });

      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setNeedsConfirmation(true);
        setTempUser({ username });
      }
    } catch (error: any) {
      setError(error.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const code = formData.get("code") as string;

    try {
      await confirmSignUp({
        username: tempUser.username,
        confirmationCode: code,
      });
      setNeedsConfirmation(false);
      setIsSignUp(false);
      setError("Account confirmed! Please sign in.");
    } catch (error: any) {
      setError(error.message || "Confirmation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Google signin

const handleGoogleSignIn = async () => {
  console.log('Google sign-in clicked');
  setIsGoogleLoading(true);
  setError("");

  try {
    console.log('Calling signInWithRedirect...');
    await signInWithRedirect({
      provider: "Google"
    });
    console.log('signInWithRedirect called successfully');
  } catch (error: any) {
    console.error("Google sign in error:", error);
    setError(`Google sign in failed: ${error.message}`);
    setIsGoogleLoading(false);
  }
};
  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
            <div className="text-center mb-6 mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Confirm your account
              </h2>
              <p className="text-gray-600 text-sm">
                Enter the confirmation code sent to your email
              </p>
            </div>

            <form onSubmit={handleConfirmSignUp} className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirmation Code
                </label>
                <input
                  type="text"
                  name="code"
                  id="code"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-all"
                  placeholder="Enter confirmation code"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 shadow-lg"
              >
                {isLoading ? "Confirming..." : "Confirm Account"}
              </button>
            </form>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[100vh]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden grid md:grid-cols-2">
              {/* Left Side - Form */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-[288px] h-[80px] rounded-lg flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="PujiGori Logo"
                        width={300}
                        height={85}
                        className="h-[85px] w-auto"
                      />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isSignUp ? "Create your account" : "Login to your account"}
                  </h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                {isSignUp ? (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-all"
                        placeholder="Your Full Name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        id="username"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-all"
                        placeholder="Choose a username"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-all"
                        placeholder="m@example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-all"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirm_password"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        id="confirm_password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-all"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Role
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="user"
                            required
                            className="text-green-500 focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Investor
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="creator"
                            required
                            className="text-green-500 focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Project Creator
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="admin"
                            required
                            className="text-green-500 focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            MasterAdmin
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-lg"
                    >
                      {isLoading ? "Creating Account..." : "Register"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email
                      </label>
                      <input
                        type="text"
                        name="username"
                        id="username"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="m@example.com"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Password
                        </label>
                        <a
                          href="#"
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-lg"
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                  </form>
                )}

                <div className="text-center mt-6">
                  <p className="text-gray-600 text-sm">
                    {isSignUp
                      ? "Already have an account? "
                      : "Register New Account? "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError("");
                      }}
                      className="text-green-500 hover:text-green-600 font-medium hover:underline cursor-pointer"
                    >
                      {isSignUp ? "Log in" : "Register"}
                    </button>
                  </p>
                </div>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGoogleLoading ? (
                      <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    ) : (
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {isGoogleLoading ? "Signing in..." : "Login with Google"}
                  </button>
                </div>
              </div>

              {/* Right Side - Hero Section with Image Placeholder */}
              <div className="bg-gray-200 p-8 lg:p-12 flex flex-col justify-center items-center relative">
                <div className="w-full max-w-sm h-80 bg-gray-300 rounded-lg flex items-center justify-center mb-8">
                  <div className="w-24 h-24 bg-gray-400 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="text-center text-gray-900">
                  <h1 className="text-2xl font-bold mb-6">
                    1st crowdfunding platform in Bangladesh for startups
                  </h1>

                  <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg">
                    DONATE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default CustomAuth;
