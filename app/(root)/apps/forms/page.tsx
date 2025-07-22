import FormsApp from "@/components/FormsApp";
import PermissionGoogle from "@/components/PermissionGoogle";
import { Metadata } from "next";
import React from "react";
export const metadata: Metadata = {
  title: "Forms",
};

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
      <title>Forms | Tasty Creative</title>
      <PermissionGoogle
        apiEndpoint={`/api/forms/list`}
      >
        <FormsApp />
      </PermissionGoogle>
    </div>
  );
};

export default page;
