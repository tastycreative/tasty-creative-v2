import PermissionGoogle from "@/components/PermissionGoogle";
import SWDPage from "@/components/SWDPage";
import React from "react";

const page = () => {
  return (
    <div>
      <title>SWD | Tasty Creative</title>
      <PermissionGoogle apiEndpoint="/api/google/swd-data">
        <SWDPage />
      </PermissionGoogle>
    </div>
  );
};

export default page;
