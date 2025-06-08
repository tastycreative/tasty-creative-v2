import React from "react";

const Logo = ({ collapsed }: { collapsed?: boolean }) => {
  if (collapsed) {
    return (
      <div className="py-2 flex justify-center">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          TC
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <h1 className="text-xl lg:text-2xl select-none font-bold bg-gradient-to-b from-indigo-950 via-purple-500 to-indigo-950 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
        Tasty Creative
      </h1>
    </div>
  );
};

export default Logo;