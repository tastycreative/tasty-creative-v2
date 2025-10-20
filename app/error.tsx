'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-950 dark:via-red-950/20 dark:to-slate-950">
      <Card className="w-full max-w-md shadow-2xl border-destructive/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg animate-pulse">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-base">
            We encountered an unexpected error. Don't worry, your data is safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs font-mono text-destructive break-words">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => window.location.reload()}
              size="lg"
              className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground pt-2">
            If this problem persists, please contact support
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
