import FormsApp from "@/components/FormsApp";
import PermissionGoogle from "@/components/PermissionGoogle";
import { Metadata } from "next";
import React from "react";
export const metadata: Metadata = {
  title: "Forms",
};

const page = () => {
  return (
    <div>
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
