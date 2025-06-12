import LaunchPrep from "@/components/LaunchPrep";
import PermissionGoogle from "@/components/PermissionGoogle";
import React from "react";

const Onboarding = () => {
  return (
    <div className=" w-full dark rounded-md">
      <title>Onboarding | Tasty Creative</title>
      <PermissionGoogle apiEndpoint="/api/google/onboarding">
        <LaunchPrep />
      </PermissionGoogle>
    </div>
  );
};

export default Onboarding;
