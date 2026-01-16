"use client";

import { usePathname } from "next/navigation";
import { signIn, useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState, ReactNode } from "react";

interface PermissionGoogleProps {
  children: ReactNode;
  apiEndpoint: string;
  onPermissionsLoaded?: () => void;
}

const PermissionGoogle: React.FC<PermissionGoogleProps> = ({
  children,
  apiEndpoint,
  onPermissionsLoaded,
}) => {
  const pathname = usePathname();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const { data: session, status: sessionStatus, update } = useSession();

  const missingApiEndpointError = "API endpoint is not defined.";

  const checkPermission = useCallback(async () => {
    console.log('checkPermission called', { apiEndpoint, sessionStatus, hasChecked });
    
    // Prevent multiple checks
    if (hasChecked) {
      console.log('Already checked permissions, skipping...');
      return;
    }
    
    if (!apiEndpoint) {
      setError(missingApiEndpointError);
      setIsLoading(false);
      setHasPermission(false);
      setHasChecked(true);
      return;
    }
    if (sessionStatus === "unauthenticated") {
      setHasPermission(false);
      setIsLoading(false);
      setError(null);
      setHasChecked(true);
      return;
    }
    if (sessionStatus === "loading") {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Making permission check request to:', apiEndpoint);
      const response = await fetch(apiEndpoint);
      console.log('Permission check response status:', response.status);
      
      if (response.ok) {
        console.log('Permission check successful');
        setHasPermission(true);
        setError(null);
        setHasChecked(true);
        onPermissionsLoaded?.();
      } else if (response.status === 401) {
        console.log('Permission check: 401 Unauthorized');
        setHasPermission(false);
        setHasChecked(true);
      } else if (response.status === 403) {
        console.log('Permission check: 403 Forbidden');
        let errorData;
        try {
          errorData = await response.json();
          console.log('Permission check error data:', errorData);
        } catch {
          console.error(`Permission check for ${apiEndpoint}: 403 response was not JSON`);
          setError("You have insufficient permission for this feature");
          setHasPermission(false);
          setHasChecked(true);
          setIsLoading(false);
          return;
        }

        if (errorData && errorData.error === "GooglePermissionDenied") {
          console.log("Google permission denied, showing re-auth prompt");
          setError(errorData.message || "You have insufficient permission for this feature");
        } else {
          console.error(`Permission check for ${apiEndpoint}: Received 403 but not GooglePermissionDenied.`, errorData);
          setError("You have insufficient permission for this feature");
        }
        setHasPermission(false);
        setHasChecked(true);
      } else {
        console.error(`Permission check for ${apiEndpoint}: API error`, response.status);
        setError(`Error checking permissions for ${apiEndpoint}: Status ${response.status}.`);
        setHasPermission(false);
        setHasChecked(true);
      }
    } catch (err) {
      console.error(`Permission check for ${apiEndpoint}: Network or other error`, err);
      setError(`Failed to check permissions for ${apiEndpoint}. Please try again.`);
      setHasPermission(false);
      setHasChecked(true);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, sessionStatus, hasChecked]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Disable periodic refresh for now to avoid loops
  // Set up periodic token refresh check (every 4 minutes)
  // useEffect(() => {
  //   if (!hasPermission || sessionStatus !== "authenticated") return;
    
  //   const interval = setInterval(() => {
  //     // Silently check and refresh tokens in the background
  //     checkPermission(true);
  //   }, 4 * 60 * 1000); // 4 minutes

  //   return () => clearInterval(interval);
  // }, [hasPermission, sessionStatus, checkPermission]);

  // Call onPermissionsLoaded when permissions are ready
  useEffect(() => {
    if (hasPermission) {
      onPermissionsLoaded?.();
    }
  }, [hasPermission, onPermissionsLoaded]);

  const handleGrantAccess = async () => {
    setIsLoading(true);
    setError(null);
    setHasChecked(false); // Reset check flag to allow re-checking after auth
    try {
      // Sign out without redirecting, then sign in again with the new scopes
      await signOut({ redirect: false });
      await signIn("google", {
        callbackUrl: pathname,
      }, {
        prompt: "consent",
        access_type: "offline",
        scope: "openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
      });
    } catch (err) {
      console.error("Error during signIn:", err);
      setError("Failed to initiate sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResetGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/revoke-google', {
        method: 'POST'
      });
      
      if (response.ok) {
        // Force a page reload after revoke to clear any cached session
        window.location.reload();
      } else {
        setError("Failed to reset Google authentication. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error resetting Google auth:", err);
      setError("Failed to reset Google authentication. Please try again.");
      setIsLoading(false);
    }
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8 rounded-2xl bg-white/70 dark:bg-[#121216] backdrop-blur-sm border border-pink-200/60 dark:border-pink-500/20 shadow-lg w-full">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-pink-500 border-t-transparent"></div>
          <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
            Loading Google Permissions...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 rounded-2xl bg-white/70 dark:bg-[#121216] backdrop-blur-sm border border-red-200/60 dark:border-red-500/30 shadow-lg w-full">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.3),rgba(0,0,0,0))]"></div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-center sm:space-x-3 mb-4 sm:mb-6 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/20 dark:from-red-500/20 dark:to-red-500/30 flex items-center justify-center mb-2 sm:mb-0 flex-shrink-0 border border-red-200/50 dark:border-red-500/30">
            <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium text-sm sm:text-base">
            {error}
          </p>
        </div>

        <div className="relative flex flex-col gap-3 w-full max-w-xs sm:max-w-sm">
          <Button
            onClick={handleGrantAccess}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200 text-sm sm:text-base px-4 py-3 rounded-2xl font-medium"
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="truncate">Grant Google Access</span>
          </Button>

          {/* <Button
            onClick={handleResetGoogleAuth}
            variant="outline"
            className="w-full bg-white/50 dark:bg-[#1a1a1f] border-pink-200/60 dark:border-pink-500/20 text-gray-700 dark:text-gray-300 hover:bg-pink-50/50 dark:hover:bg-pink-500/10 hover:border-pink-400 dark:hover:border-pink-400 transition-all duration-200 text-sm sm:text-base px-4 py-3 rounded-2xl font-medium"
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="truncate">Reset & Re-authenticate</span>
          </Button> */}
        </div>
      </div>
    );
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 rounded-2xl bg-white/70 dark:bg-[#121216] backdrop-blur-sm border border-pink-200/60 dark:border-pink-500/20 shadow-xl w-full max-w-lg mx-auto">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      {/* Decorative Circles */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-pink-500/10 rounded-full opacity-50 blur-3xl"></div>
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-500/10 rounded-full opacity-50 blur-3xl"></div>

      <div className="relative mb-4 sm:mb-6 p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 border border-pink-200/50 dark:border-pink-500/30">
        <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </div>

      <h3 className="relative text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2 sm:mb-3 text-center">
        Google Access Required
      </h3>

      <p className="relative text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center mb-6 sm:mb-8 leading-relaxed px-2">
        This feature requires specific Google permissions to function properly.
        Please sign in with your Google account to grant permission.
      </p>

      <Button
        onClick={handleGrantAccess}
        className="relative bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3 text-base font-medium border-0 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200 w-full sm:w-auto rounded-2xl"
      >
        <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H1.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="truncate">Connect with Google</span>
      </Button>
    </div>
  );
};

export default PermissionGoogle;