"use client";

import React, { useState, useEffect, ReactNode, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface PermissionGoogleProps {
  children: ReactNode;
  apiEndpoint: string;
}

const PermissionGoogle: React.FC<PermissionGoogleProps> = ({
  children,
  apiEndpoint,
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
      console.log(
        "Permission check: User is not authenticated (session). Skipping API call."
      );
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
      } else if (response.status === 401) {
        setHasPermission(false);
        console.log(
          `Permission check for ${apiEndpoint}: User not authorized (401).`
        );
      } else if (response.status === 403) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Response was not JSON - set custom permission message
          console.error(
            `Permission check for ${apiEndpoint}: 403 response was not JSON`,
            await response.text()
          );
          setError("You have insufficient permission for this feature");
          setHasPermission(false);
          return;
        }

        if (errorData && errorData.error === "GooglePermissionDenied") {
          console.log(
            `Permission check for ${apiEndpoint}: GooglePermissionDenied (403). Message: ${errorData.message}`
          );
          setError("You have insufficient permission for this feature");
        } else {
          // For any other 403 error, show the custom message
          console.error(
            `Permission check for ${apiEndpoint}: Received 403 but not GooglePermissionDenied.`,
            errorData
          );
          setError("You have insufficient permission for this feature");
        }
        setHasPermission(false);
      } else {
        // Handle other non-200, non-401, non-403 errors
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
    return <div className="text-center p-4">Loading Google Permissions...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 border border-red-300 rounded-md bg-transparent text-center">
        <p className="text-red-700 mb-3">Error: {error}</p>
        <Button onClick={handleGrantAccess} variant="destructive" className="mb-4 dark:text-green-700 border-green-300 border text-green-300">
          Grant Google Access / Sign In
        </Button>
        {error !== missingApiEndpointError && (
          <Button
            onClick={checkPermission}
            variant="outline"
            className="mt-2 text-xs"
          >
            Retry Check
          </Button>
        )}
      </div>
    );
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        This feature requires specific Google permissions. Please sign in with
        Google and grant access.
      </p>
      <Button onClick={handleGrantAccess}>Grant Google Access / Sign In</Button>
    </div>
  );
};

export default PermissionGoogle;
