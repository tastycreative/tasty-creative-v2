import LaunchPrep from "@/components/LaunchPrep";
import PermissionGoogle from "@/components/PermissionGoogle";
import React from "react";

const Onboarding = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-pink-50 rounded-md">
      <title>Onboarding | Tasty Creative</title>
      <PermissionGoogle apiEndpoint="/api/google/onboarding">
        <LaunchPrep />
      </PermissionGoogle>
    </div>
  );
};

export default Onboarding;
