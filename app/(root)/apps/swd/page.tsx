import PermissionGoogle from "@/components/PermissionGoogle";
import SWDPage from "@/components/SWDPage";
import React from "react";

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
      <title>SWD | Tasty Creative</title>
      <PermissionGoogle apiEndpoint="/api/google/swd-data">
        <SWDPage />
      </PermissionGoogle>
    </div>
  );
};

export default page;
