import FormsApp from "@/components/FormsApp";
import PermissionGoogle from "@/components/PermissionGoogle";
import React from "react";

const page = () => {
  return (
    <div>
      <PermissionGoogle
        apiEndpoint={`/api/forms/list?folderId=${process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FORMS_FOLDER_ID}`}
      >
        <FormsApp />
      </PermissionGoogle>
    </div>
  );
};

export default page;
