"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Image,
  Calendar,
  Link2,
  User,
  DollarSign,
  Gamepad2,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Upload,
  Zap
} from "lucide-react";

export type SubmissionType = "otp" | "ptr";
export type PostType = "normal" | "game" | "poll" | "ppv_bundle";
export type GameType = "spin_wheel" | "drop_ball" | "dice";

interface FormData {
  submissionType: SubmissionType;
  postType: PostType;
  model: string;
  scheduledDate: string;
  driveLink: string;
  caption?: string;
  gameType?: GameType;
  pricingTiers?: { tier1: string; tier2: string; tier3: string; tier4: string };
  pollQuestion?: string;
  originalPollQuestion?: string;
  ppvPrice?: string;
}

const otpPostTypes = [
  {
    value: "normal" as PostType,
    label: "Normal Wall Post",
    description: "Standard content posts",
    icon: FileText,
    color: "from-purple-500 to-blue-500"
  },
  {
    value: "game" as PostType,
    label: "Game Wall Post",
    description: "Interactive gaming content",
    icon: Gamepad2,
    color: "from-pink-500 to-rose-500"
  },
  {
    value: "poll" as PostType,
    label: "Poll Wall Post",
    description: "Polling content for engagement",
    icon: BarChart3,
    color: "from-blue-500 to-cyan-500"
  }
];

const ptrPostTypes = [
  {
    value: "ppv_bundle" as PostType,
    label: "Poll PPV/Bundle Post",
    description: "Pay-per-view content from polls",
    icon: DollarSign,
    color: "from-pink-500 to-purple-500"
  }
];

const gameTypeOptions = [
  { value: "spin_wheel" as GameType, label: "🎡 Spin The Wheel" },
  { value: "drop_ball" as GameType, label: "🏀 Drop Ball" },
  { value: "dice" as GameType, label: "🎲 Dice" }
];

export default function DynamicWorkflowForm() {
  const { register, control, handleSubmit, formState: { errors, isValid }, setValue, watch } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      submissionType: "otp",
      postType: "normal"
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submissionType = useWatch({ control, name: "submissionType" });
  const postType = useWatch({ control, name: "postType" });

  // Get available post types based on submission type
  const availablePostTypes = submissionType === "otp" ? otpPostTypes : ptrPostTypes;
  const selectedPostType = availablePostTypes.find(option => option.value === postType);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    console.log("Form submitted:", data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const renderCommonFields = () => (
    <>
      {/* Model Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-900 dark:text-white">Model *</Label>
            <p className="text-xs text-gray-600 dark:text-gray-400">Select content creator</p>
          </div>
        </div>
        <Select onValueChange={(value) => setValue("model", value)}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select Model..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="model1">Model 1</SelectItem>
            <SelectItem value="model2">Model 2</SelectItem>
            <SelectItem value="model3">Model 3</SelectItem>
          </SelectContent>
        </Select>
        {errors.model && <p className="text-red-500 text-xs">{errors.model.message}</p>}
      </div>

      {/* Scheduled Date */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-900 dark:text-white">Scheduled Date *</Label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {postType === "poll" ? "PPV follow-up will be auto-scheduled 7-10 days later" :
               postType === "game" ? "Games are limited to 1 per model per month" :
               postType === "ppv_bundle" ? "Usually 7-10 days after original poll" :
               "System will find optimal slot if conflicts exist"}
            </p>
          </div>
        </div>
        <Input
          type="date"
          {...register("scheduledDate", { required: "Scheduled date is required" })}
          className="h-12"
        />
        {errors.scheduledDate && <p className="text-red-500 text-xs">{errors.scheduledDate.message}</p>}
      </div>

      {/* Drive Link */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
            <Link2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-900 dark:text-white">Drive Link *</Label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {postType === "normal" ? "Link to model's Wall Post folder" :
               postType === "game" ? "Game graphics, promotional images" :
               postType === "poll" ? "Images to accompany poll question" :
               "Preview images, promotional content"}
            </p>
          </div>
        </div>
        <Input
          type="url"
          placeholder="https://drive.google.com/drive/folders/..."
          {...register("driveLink", { required: "Drive link is required" })}
          className="h-12"
        />
        {errors.driveLink && <p className="text-red-500 text-xs">{errors.driveLink.message}</p>}
      </div>
    </>
  );

  const renderTypeSpecificFields = () => {
    switch (postType) {
      case "normal":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-900 dark:text-white">Caption</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">Optional: Add caption or leave blank for PG Team to create</p>
              </div>
            </div>
            <Textarea
              placeholder="Optional: Add caption or leave blank for PG Team to create"
              {...register("caption")}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs italic text-gray-500">PG Team will create/enhance if blank</p>
          </div>
        );

      case "game":
        return (
          <>
            {/* Game Type */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                  <Gamepad2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">Game Type *</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Select game mechanics</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {gameTypeOptions.map((game) => (
                  <button
                    key={game.value}
                    type="button"
                    onClick={() => setValue("gameType", game.value)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                      watch("gameType") === game.value
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                    }`}
                  >
                    <span className="text-sm font-medium">{game.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Tiers */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">Pricing Tiers (Up to 4)</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">PG Team will create caption: "1 spin = $10, 2 spins = $15, etc."</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-medium">$</div>
                  <Input
                    type="number"
                    placeholder="10"
                    {...register("pricingTiers.tier1")}
                    className="pl-8 h-12"
                  />
                  <Label className="text-xs text-gray-500 mt-1 block">Tier 1</Label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-medium">$</div>
                  <Input
                    type="number"
                    placeholder="20"
                    {...register("pricingTiers.tier2")}
                    className="pl-8 h-12"
                  />
                  <Label className="text-xs text-gray-500 mt-1 block">Tier 2</Label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-medium">$</div>
                  <Input
                    type="number"
                    placeholder="25"
                    {...register("pricingTiers.tier3")}
                    className="pl-8 h-12"
                  />
                  <Label className="text-xs text-gray-500 mt-1 block">Tier 3</Label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-medium">$</div>
                  <Input
                    type="number"
                    placeholder="30"
                    {...register("pricingTiers.tier4")}
                    className="pl-8 h-12"
                  />
                  <Label className="text-xs text-gray-500 mt-1 block">Tier 4</Label>
                </div>
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">Caption</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Optional: Add caption or leave blank for PG Team to create with game rules</p>
                </div>
              </div>
              <Textarea
                placeholder="Optional: Add caption or leave blank for PG Team to create with game rules"
                {...register("caption")}
                rows={4}
                className="resize-none"
              />
            </div>
          </>
        );

      case "poll":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-md">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-900 dark:text-white">Poll Question *</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">Clear, engaging question that leads to PPV opportunities</p>
              </div>
            </div>
            <Textarea
              placeholder="What content would you like to see next? What should I wear for my next photo shoot?"
              {...register("pollQuestion", { required: "Poll question is required" })}
              rows={4}
              className="resize-none"
            />
            {errors.pollQuestion && <p className="text-red-500 text-xs">{errors.pollQuestion.message}</p>}
          </div>
        );

      case "ppv_bundle":
        return (
          <>
            {/* Original Poll Question */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-md">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">Original Poll Question</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Reference the original poll question this PPV is based on</p>
                </div>
              </div>
              <Textarea
                placeholder="Reference the original poll question this PPV is based on"
                {...register("originalPollQuestion")}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs italic text-gray-500">Helps PG Team create connected caption</p>
            </div>

            {/* PPV Price */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">PPV Price *</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Single price for this PPV/Bundle</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 font-medium">$</div>
                <Input
                  type="number"
                  placeholder="25"
                  {...register("ppvPrice", { required: "PPV price is required" })}
                  className="pl-8 h-12"
                />
              </div>
              {errors.ppvPrice && <p className="text-red-500 text-xs">{errors.ppvPrice.message}</p>}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* OTP/PTR Selection */}
      <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Select Submission Type
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Choose between OTP (One-Time Post) or PTR (Pay-To-Reveal) content
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* OTP Button */}
            <button
              type="button"
              onClick={() => {
                setValue("submissionType", "otp");
                setValue("postType", "normal");
              }}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                submissionType === "otp"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg shadow-blue-500/25"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  submissionType === "otp"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25"
                    : "bg-gradient-to-br from-blue-400/20 to-blue-500/20 group-hover:from-blue-500 group-hover:to-blue-600"
                }`}>
                  <Upload className={`h-8 w-8 transition-colors duration-300 ${
                    submissionType === "otp" ? "text-white" : "text-blue-600 group-hover:text-white"
                  }`} />
                </div>

                <div className="text-center">
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${
                    submissionType === "otp"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  }`}>
                    OTP
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    One-Time Post
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Standard content workflow
                  </p>
                </div>
              </div>

              {submissionType === "otp" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </button>

            {/* PTR Button */}
            <button
              type="button"
              onClick={() => {
                setValue("submissionType", "ptr");
                setValue("postType", "ppv_bundle");
              }}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                submissionType === "ptr"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg shadow-purple-500/25"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/10"
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  submissionType === "ptr"
                    ? "bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25"
                    : "bg-gradient-to-br from-purple-400/20 to-purple-500/20 group-hover:from-purple-500 group-hover:to-purple-600"
                }`}>
                  <Zap className={`h-8 w-8 transition-colors duration-300 ${
                    submissionType === "ptr" ? "text-white" : "text-purple-600 group-hover:text-white"
                  }`} />
                </div>

                <div className="text-center">
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${
                    submissionType === "ptr"
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  }`}>
                    PTR
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Pay-To-Reveal
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Premium content workflow
                  </p>
                </div>
              </div>

              {submissionType === "ptr" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Post Type Selection */}
      <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Select {submissionType.toUpperCase()} Type
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the specific type of {submissionType === "otp" ? "one-time post" : "pay-to-reveal"} content
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePostTypes.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue("postType", option.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    postType === option.value
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center shadow-md mb-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {option.label}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Form Fields */}
      {postType && (
        <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {selectedPostType && (
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedPostType.color} flex items-center justify-center shadow-md`}>
                  <selectedPostType.icon className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedPostType?.label} Details
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Fill in the required fields for your {selectedPostType?.label.toLowerCase()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderCommonFields()}
            {renderTypeSpecificFields()}

            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
                  <Image className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">Attachments</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {postType === "game" ? "Game graphics, promotional images" :
                     postType === "poll" ? "Images to accompany poll question" :
                     postType === "ppv_bundle" ? "Preview images, promotional content" :
                     "Images, videos, documents"}
                  </p>
                </div>
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload or drag files here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {postType === "game" ? "Game graphics, promotional images" :
                   postType === "poll" ? "Images to accompany poll question" :
                   postType === "ppv_bundle" ? "Preview images, promotional content" :
                   "Images, videos, documents"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {postType && (
        <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`w-full h-14 text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] ${
                isSubmitted
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white"
                  : isValid && !isSubmitting
                    ? `bg-gradient-to-r ${selectedPostType?.color} hover:opacity-90 text-white shadow-lg`
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center justify-center gap-3">
                {isSubmitted ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Submitted Successfully!</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    <span>Creating Workflow...</span>
                  </>
                ) : (
                  <>
                    {selectedPostType && <selectedPostType.icon className="h-5 w-5" />}
                    <span>Submit {submissionType.toUpperCase()} & Create Workflow</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </span>
            </Button>

            <div className="flex items-center justify-center mt-4 gap-2">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isSubmitted
                    ? "bg-green-500"
                    : isSubmitting
                      ? "bg-blue-500 animate-pulse"
                      : isValid
                        ? "bg-blue-400"
                        : "bg-gray-400"
                }`}
              />
              <p
                className={`text-sm font-medium transition-colors duration-300 ${
                  isSubmitted
                    ? "text-green-600 dark:text-green-400"
                    : isSubmitting
                      ? "text-blue-600 dark:text-blue-400"
                      : isValid
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {isSubmitted
                  ? "Content submitted and workflow created!"
                  : isSubmitting
                    ? "Processing your submission..."
                    : isValid
                      ? "Ready to create workflow"
                      : "Please fill in all required fields"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}