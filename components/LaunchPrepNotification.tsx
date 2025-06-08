'use client'
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
  
      // Initial fetch
      fetchNotifications();
  
      // Poll every 5 seconds
      // eslint-disable-next-line prefer-const
      intervalId = setInterval(fetchNotifications, 5000);
  
      // Cleanup
      return () => clearInterval(intervalId);
    }, []);

  return (
    <>
      {Array.isArray(notifications) && notifications && (
        <div className="">
          {notifications.map(
            (notification: NotificationData, index: number) => (
              <div className="py-1" key={index}>
                <LaunchPrepDetails
                  modelDataLoading={false} // Replace with actual loading state if needed
                  selectedModelData={notification.editedData} // Passing the `editedData` from the notificationication
                  timestamp={notification.timestamp} // Passing the timestamp
                  editedBy={notification.editedBy} // Passing the editor's name
                  className="bg-black/20 dark"
                  dashboard={true} // Pass the dashboard prop to the component
                //   triggerTabChange={triggerTabChange} // Pass the handleTabChange function to the component
                />
              </div>
            )
          )}
        </div>
      )}
    </>
  );
};

export default LaunchPrepNotification;
