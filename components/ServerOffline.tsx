import { AlertCircle } from "lucide-react";
import React from "react";

const ServerOffline = () => {
  const handleTryAgain = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-4 shadow-md w-full p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-pink-200 dark:border-pink-500/20">
      <div className="flex items-center gap-3">
        <AlertCircle className="text-red-500" size={24} />
        <h2 className="text-lg font-semibold text-red-500 dark:text-red-400">
          Server is offline
        </h2>
      </div>
      <p className="text-gray-600 dark:text-gray-300">
        We&apos;re currently experiencing server connectivity issues. Our team
        has been notified and is working to resolve the problem.
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        For the meantime, you can submit a request to discord about your flyer request.
      </p>
      <div className="mt-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Please contact admin at{" "}
          <span className="text-pink-600 dark:text-pink-400">txl.tasty@gmail.com</span> for more
          information.
        </p>
      </div>
      <button
        onClick={handleTryAgain}
        className="mt-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-700 dark:hover:to-rose-700 text-white py-2 px-4 rounded-md self-start transition-colors duration-200"
      >
        Try Again
      </button>
    </div>
  );
};

export default ServerOffline;
