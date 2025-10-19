import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, Clock } from "lucide-react";

const page = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <Wrench className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
          Live Stream is under construction
        </h1>
        <p className="text-muted-foreground mb-6">
          We’re building this page right now. Check back soon for live tools and
          features.
        </p>
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Clock className="h-4 w-4" />
          <span>ETA: Soon</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Notify me later</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default page;