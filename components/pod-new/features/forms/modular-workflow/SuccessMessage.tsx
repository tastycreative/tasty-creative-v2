"use client";

interface SuccessMessageProps {
  result: {
    task?: {
      id: string;
      teamName: string;
      priority: string;
    };
    workflow?: {
      id: string;
    };
  };
}

export function SuccessMessage({ result }: SuccessMessageProps) {
  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center mt-0.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            🎉 Workflow Created Successfully!
          </h4>
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <div className="flex items-center gap-2">
              <span className="font-medium">Task ID:</span>
              <span className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded font-mono text-xs">
                {result.task?.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Assigned to:</span>
              <span className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                {result.task?.teamName}
              </span>
              <span className="text-xs">({result.task?.priority} priority)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Workflow ID:</span>
              <span className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded font-mono text-xs">
                {result.workflow?.id}
              </span>
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-3 italic">
            Team members have been notified and can now start working on this content.
          </p>
        </div>
      </div>
    </div>
  );
}
