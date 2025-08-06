import PodComponent from "@/components/PodComponent";
import PermissionGoogle from "@/components/PermissionGoogle";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Scheduler POD",
};

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <title>Scheduler POD | Tasty Creative</title>
      <PermissionGoogle apiEndpoint="/api/pod">
        <PodComponent />
      </PermissionGoogle>
    </div>
  );
};

export default page;
