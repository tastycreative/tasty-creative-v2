import { auth, signOut } from "@/auth";
import React from "react";

export const metadata = {
  title: "Dashboard",
  description: "Your personal dashboard",
};

const Dashboard = async () => {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-4">
      <img
        src={session.user.image || "/default-avatar.png"}
        alt={session.user.name || "User"}
        className="w-8 h-8 rounded-full"
      />
      <span>{session.user.name}</span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button type="submit">Sign Out</button>
      </form>
    </div>
  );
};

export default Dashboard;
