import Calendar from "@/components/Calendar";
import LaunchPrepNotification from "@/components/LaunchPrepNotification";
import PermissionGoogle from "@/components/PermissionGoogle"; // Import the new component
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-5">Dashboard</h1>
      <PermissionGoogle apiEndpoint="/api/notifications"> {/* Pass the apiEndpoint prop */}
        <LaunchPrepNotification />
      </PermissionGoogle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Calendar />
      </div>
    </div>
  );
}
