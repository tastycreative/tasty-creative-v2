"use client";

import React, { useState, useEffect, ReactNode, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

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
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status: sessionStatus } = useSession();

  const missingApiEndpointError = "API endpoint is not defined.";

  const checkPermission = useCallback(async () => {
    if (!apiEndpoint) {
      setError(missingApiEndpointError);
      setIsLoading(false);
      setHasPermission(false);
      return;
    }
    if (sessionStatus === "unauthenticated") {
      //console.log(
      //   "Permission check: User is not authenticated (session). Skipping API call."
      // );
      setHasPermission(false);
      setIsLoading(false);
      setError(null);
      return;
    }
    if (sessionStatus === "loading") {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        setHasPermission(true);
        onPermissionsLoaded?.();
      } else if (response.status === 401) {
        setHasPermission(false);
        //console.log(
        //   `Permission check for ${apiEndpoint}: User not authorized (401).`
        // );
      } else if (response.status === 403) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          console.error(
            `Permission check for ${apiEndpoint}: 403 response was not JSON`,
            await response.text()
          );
          setError("You have insufficient permission for this feature");
          setHasPermission(false);
          return;
        }

        if (errorData && errorData.error === "GooglePermissionDenied") {
          //console.log(
          //   `Permission check for ${apiEndpoint}: GooglePermissionDenied (403). Message: ${errorData.message}`
          // );
          setError("You have insufficient permission for this feature");
        } else {
          console.error(
            `Permission check for ${apiEndpoint}: Received 403 but not GooglePermissionDenied.`,
            errorData
          );
          setError("You have insufficient permission for this feature");
        }
        setHasPermission(false);
      } else {
        const errorText = await response.text();
        console.error(
          `Permission check for ${apiEndpoint}: API error`,
          response.status,
          errorText
        );
        setError(
          `Error checking permissions for ${apiEndpoint}: Status ${response.status}.`
        );
        setHasPermission(false);
      }
    } catch (err) {
      console.error(
        `Permission check for ${apiEndpoint}: Network or other error`,
        err
      );
      setError(
        `Failed to check permissions for ${apiEndpoint}. Please try again.`
      );
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, sessionStatus]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Call onPermissionsLoaded when permissions are ready
  useEffect(() => {
    if (hasPermission) {
      onPermissionsLoaded?.();
    }
  }, [hasPermission, onPermissionsLoaded]);

  const handleGrantAccess = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google");
    } catch (err) {
      console.error("Error during signIn:", err);
      setError("Failed to initiate sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 rounded-xl bg-transparent backdrop-blur-sm border border-white/10 shadow-lg w-full">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
            Loading Google Permissions...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 rounded-xl bg-transparent backdrop-blur-sm border border-red-200/30 dark:border-red-800/30 shadow-lg w-full">
        <div className="flex flex-col sm:flex-row items-center sm:space-x-2 mb-4 sm:mb-6 text-center sm:text-left">
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2 sm:mb-0 flex-shrink-0">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-700 dark:text-red-300 font-medium text-sm sm:text-base">
            {error}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-xs sm:max-w-sm">
          <Button 
            onClick={handleGrantAccess} 
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5"
          >
            <svg className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="truncate">Grant Google Access</span>
          </Button>
          
          {/* {error !== missingApiEndpointError && (
            <Button
              onClick={checkPermission}
              variant="outline"
              className="bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-200 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5 min-w-0"
            >
              <svg className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Retry</span>
              <span className="sm:hidden">↻</span>
            </Button>
          )} */}
        </div>
      </div>
    );
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 rounded-xl bg-transparent backdrop-blur-sm border border-white/10 dark:border-gray-700/30 shadow-xl w-full max-w-lg mx-auto">
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </div>
      
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-3 text-center">
        Google Access Required
      </h3>
      
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center mb-6 sm:mb-8 leading-relaxed px-2">
        This feature requires specific Google permissions to function properly. 
        Please sign in with your Google account to continue.
      </p>
      
      <Button 
        onClick={handleGrantAccess}
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-medium border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto min-w-0"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
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