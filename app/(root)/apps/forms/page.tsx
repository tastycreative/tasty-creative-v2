import FormsApp from "@/components/FormsApp";
import PermissionGoogle from "@/components/PermissionGoogle";
import React from "react";

const page = () => {
  return (
    <div>
      <PermissionGoogle
        apiEndpoint={`/api/forms/list`}
      >
        <FormsApp />
      </PermissionGoogle>
    </div>
  );
};

export default page;
