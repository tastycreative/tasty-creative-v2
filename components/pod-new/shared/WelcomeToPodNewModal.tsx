"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  LayoutGrid,
  Activity,
  Users,
  Sheet,
  Settings,
  Check,
} from "lucide-react";

interface WelcomeToPodNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss?: (permanent: boolean) => void;
}

const slides = [
  {
    id: 1,
    title: "Welcome to POD-NEW! 🎉",
    subtitle: "We've completely redesigned your POD Management experience",
    icon: Sparkles,
    iconColor: "from-pink-500 to-purple-500",
    content: (
      <div className="space-y-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-8">
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>
          <div className="relative grid grid-cols-2 gap-4 text-center">
            <div className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Before
              </div>
              <div className="text-3xl font-bold text-gray-400">5</div>
              <div className="text-xs text-gray-400 mt-1">Basic Pages</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg">
              <div className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Now
              </div>
              <div className="text-3xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                15+
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                Powerful Features
              </div>
            </div>
          </div>
        </div>

        <ul className="space-y-3">
          {[
            "12+ new pages and features",
            "Modern gallery-themed design",
            "Enhanced productivity tools",
            "Zero breaking changes - everything you know still works!",
          ].map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full">
                <Check className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 flex-1">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 2,
    title: "Organized Navigation",
    subtitle: "Everything in its place, easy to find",
    icon: LayoutGrid,
    iconColor: "from-blue-500 to-cyan-500",
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Your sidebar is now organized into logical groups for faster access:
        </p>
        <div className="grid gap-3">
          {[
            {
              title: "CORE",
              items: "Dashboard, Board, Workspace, Generative AI",
              color: "pink",
            },
            {
              title: "CONTENT & SCHEDULE",
              items: "Schedule Content, Live, Calendar",
              color: "blue",
            },
            {
              title: "WORKFLOW",
              items: "OTP/PTR, Forms",
              color: "purple",
            },
            {
              title: "MANAGEMENT",
              items: "My Models, Team",
              color: "emerald",
            },
          ].map((section) => (
            <div
              key={section.title}
              className={`p-4 bg-gradient-to-br from-${section.color}-50 to-${section.color}-100 dark:from-${section.color}-900/20 dark:to-${section.color}-800/30 rounded-lg border border-${section.color}-200/50 dark:border-${section.color}-500/30`}
            >
              <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                {section.title}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {section.items}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "POD Workflow Dashboard",
    subtitle: "Track progress at a glance",
    icon: Activity,
    iconColor: "from-emerald-500 to-green-500",
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Your new command center provides real-time insights:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Overall Progress",
              value: "2/972",
              color: "pink",
              icon: "📊",
            },
            { label: "Total Models", value: "81", color: "emerald", icon: "👥" },
            {
              label: "Onboarding",
              value: "1",
              color: "blue",
              icon: "🎓",
            },
            {
              label: "Tasks/Model",
              value: "12",
              color: "purple",
              icon: "📋",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden p-4 bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-lg border border-gray-200/60 dark:border-gray-700/60"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {stat.label}
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Pro Tip:</strong> Use the{" "}
            <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">
              View Onboarding
            </span>{" "}
            button for quick access to model onboarding tracking!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Visual Task Board",
    subtitle: "Manage tasks with drag & drop",
    icon: Sheet,
    iconColor: "from-purple-500 to-pink-500",
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          New Kanban-style board for effortless task management:
        </p>
        <div className="space-y-3">
          {[
            {
              title: "Drag & Drop",
              desc: "Move tasks between columns to update status",
              icon: "🎯",
            },
            {
              title: "Advanced Filters",
              desc: "Search by model, priority, status, assignee",
              icon: "🔍",
            },
            {
              title: "Rich Details",
              desc: "Attachments, comments, activity history",
              icon: "📎",
            },
            {
              title: "Column Management",
              desc: "Customize workflow stages to match your process",
              icon: "⚙️",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="text-2xl">{feature.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {feature.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Even More Features!",
    subtitle: "Explore everything POD-NEW has to offer",
    icon: Users,
    iconColor: "from-orange-500 to-red-500",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "📊", title: "Sheets Integration", desc: "Sync with Google" },
            { icon: "👤", title: "Enhanced Models", desc: "Advanced search" },
            { icon: "🎓", title: "Onboarding", desc: "Track progress" },
            { icon: "📝", title: "Modular Forms", desc: "OTP/PTR made easy" },
            { icon: "⚙️", title: "Admin Dashboard", desc: "Team analytics" },
            { icon: "🎤", title: "AI Voice", desc: "Text-to-speech" },
            { icon: "💰", title: "Pricing Guide", desc: "Quick reference" },
            { icon: "🎨", title: "Gallery", desc: "Media library" },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-3 bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-lg border border-gray-200/60 dark:border-gray-700/60"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">
                {feature.title}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {feature.desc}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
          <p className="text-sm text-gray-800 dark:text-gray-200 text-center">
            <strong>📚 Want to learn more?</strong>
            <br />
            Check out the full{" "}
            <a
              href="/POD_NEW_USER_GUIDE.md"
              target="_blank"
              className="underline font-semibold"
            >
              User Guide
            </a>{" "}
            and{" "}
            <a
              href="/POD_NEW_RELEASE_NOTES.md"
              target="_blank"
              className="underline font-semibold"
            >
              Release Notes
            </a>
          </p>
        </div>
      </div>
    ),
  },
];

export function WelcomeToPodNewModal({
  isOpen,
  onClose,
  onDismiss,
}: WelcomeToPodNewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    if (dontShowAgain && onDismiss) {
      onDismiss(true);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    if (dontShowAgain && onDismiss) {
      onDismiss(true);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="relative">
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`p-3 bg-gradient-to-br ${slide.iconColor} rounded-xl`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                {slide.title}
              </DialogTitle>
              <DialogDescription className="text-base mt-1 text-gray-700 dark:text-gray-300">
                {slide.subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="py-4">{slide.content}</div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-8 bg-gradient-to-r from-pink-500 to-purple-500"
                  : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <label
              htmlFor="dont-show-again"
              className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
            >
              Don't show again
            </label>
          </div>

          <div className="flex items-center gap-2">
            {currentSlide === 0 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
            )}
            {currentSlide > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {currentSlide === slides.length - 1 ? (
                "Start Exploring"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
