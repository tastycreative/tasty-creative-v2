"use client";
import React, { useEffect, useState } from "react";
import LaunchPrepDetails from "./LaunchPrepDetails";

const LaunchPrepNotification = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // //initial fetch
    fetchNotifications();

    // Poll every 5 seconds
    // eslint-disable-next-line prefer-const
    intervalId = setInterval(fetchNotifications, 5000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, []);

  // Empty state
  if (!notifications || notifications.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No notifications at this time
        </p>
      </div>
    );
  }

  // Simple single notification display
  const latestNotification = notifications[0];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <LaunchPrepDetails
        modelDataLoading={false}
        selectedModelData={latestNotification.editedData}
        timestamp={latestNotification.timestamp}
        editedBy={latestNotification.editedBy}
        className="bg-transparent border-0 shadow-none hover:shadow-none p-0"
        dashboard={true}
      />
    </div>
  );
};

export default LaunchPrepNotification;
