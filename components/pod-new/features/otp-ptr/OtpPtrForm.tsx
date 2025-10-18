"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileUpload, { LocalFilePreview, uploadAllLocalFiles } from "@/components/ui/FileUpload";
import { useContentSubmissionStore } from "@/lib/stores/contentSubmissionStore";
import ModelsDropdownList from "@/components/ModelsDropdownList";
import {
  Upload,
  Zap,
  FileText,
  Image,
  Link2,
  User,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Calendar,
  DollarSign,
} from "lucide-react";

interface OtpPtrFormProps {
  localFiles: LocalFilePreview[];
  setLocalFiles: React.Dispatch<React.SetStateAction<LocalFilePreview[]>>;
  onSubmit: () => void;
}

export default function OtpPtrForm({ localFiles, setLocalFiles, onSubmit }: OtpPtrFormProps) {
  const {
    submissionType,
    formData,
    attachments,
    isSubmitting,
    isSubmitted,
    setSubmissionType,
    updateFormData,
    setAttachments,
    isFormValid
  } = useContentSubmissionStore();

  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/15 to-pink-50/30 dark:from-blue-950/15 dark:via-purple-950/8 dark:to-pink-950/15 rounded-3xl" />

      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-gray-700/60 shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-gray-50/90 via-white/50 to-gray-50/90 dark:from-gray-800/90 dark:via-gray-900/50 dark:to-gray-800/90 backdrop-blur-xl px-10 py-8 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create New Submission
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-base mt-1">
                    Submit your content with automated workflow processing
                  </p>
                </div>
              </div>
            </div>

            {/* Modern Type Toggle */}
            <div className="relative">
              <div className="flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-2 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <div
                  className={`absolute inset-y-2 w-[calc(50%-4px)] bg-gradient-to-r ${
                    submissionType === "otp"
                      ? "from-blue-500 to-blue-600 left-2"
                      : "from-purple-500 to-purple-600 left-[calc(50%+2px)]"
                  } rounded-xl shadow-lg transition-all duration-500 ease-out`}
                />

                <button
                  onClick={() => setSubmissionType("otp")}
                  className={`relative z-10 px-8 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 min-w-[120px] justify-center ${
                    submissionType === "otp"
                      ? "text-white"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  <span>OTP</span>
                </button>
                <button
                  onClick={() => setSubmissionType("ptr")}
                  className={`relative z-10 px-8 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 min-w-[120px] justify-center ${
                    submissionType === "ptr"
                      ? "text-white"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Zap className="h-5 w-5" />
                  <span>PTR</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {/* Main Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Form Fields */}
            <div className="lg:col-span-2 space-y-8">
              {/* First Row: Model Selection and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Model Selection */}
                <div className="group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <label className="text-base font-semibold text-gray-900 dark:text-white block">
                        Model Selection
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                        Choose your content creator
                      </p>
                    </div>
                  </div>
                  <ModelsDropdownList
                    value={formData.modelName}
                    onValueChange={(value) =>
                      updateFormData("modelName", value)
                    }
                    placeholder="Choose your model..."
                    className="h-12 w-full text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md transition-all duration-300 focus:border-pink-500 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>

                {/* Priority */}
                <div className="group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <label className="text-base font-semibold text-gray-900 dark:text-white block">
                        Priority Level
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                        Set processing urgency
                      </p>
                    </div>
                  </div>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      updateFormData("priority", value)
                    }
                  >
                    <SelectTrigger className="h-12 w-full text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md transition-all duration-300 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20">
                      <SelectValue placeholder="Select priority level..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border shadow-lg bg-white dark:bg-gray-900">
                      <SelectItem
                        value="urgent"
                        className="text-sm py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                          <div>
                            <div className="font-medium text-red-700 dark:text-red-400">
                              Urgent
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Rush delivery
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="high" className="text-sm py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                          <div>
                            <div className="font-medium text-orange-700 dark:text-orange-400">
                              High
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Next in queue
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="normal"
                        className="text-sm py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                          <div>
                            <div className="font-medium text-blue-700 dark:text-blue-400">
                              Normal
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Standard processing
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="low" className="text-sm py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
                          <div>
                            <div className="font-medium text-gray-700 dark:text-gray-400">
                              Low
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              When available
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Drive Link */}
              <div className="group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Link2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <label className="text-base font-semibold text-gray-900 dark:text-white block">
                      Google Drive Link
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                      Share folder or file URL
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.driveLink}
                    onChange={(e) =>
                      updateFormData("driveLink", e.target.value)
                    }
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full h-12 pl-4 pr-12 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Content Description */}
              <div className="group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <label className="text-base font-semibold text-gray-900 dark:text-white block">
                      Content Description
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                      Describe your content in detail
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <Textarea
                    value={formData.contentDescription}
                    onChange={(e) =>
                      updateFormData(
                        "contentDescription",
                        e.target.value
                      )
                    }
                    placeholder="e.g. Alanna x Keiran Lee BG Scene - 40 min tape!"
                    rows={4}
                    className="w-full text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none p-3"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                    <span className="font-medium">
                      {formData.contentDescription.length}
                    </span>
                    <span>chars</span>
                  </div>
                </div>
              </div>

              {/* PTR-Specific Fields */}
              {submissionType === 'ptr' && (
                <>
                  {/* Release Date and Time */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <label className="text-base font-semibold text-gray-900 dark:text-white block">
                          Release Date & Time
                        </label>
                        <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                          When should this content be released?
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Release Date */}
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.releaseDate}
                          onChange={(e) =>
                            updateFormData("releaseDate", e.target.value)
                          }
                          className="w-full h-12 px-4 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all duration-300"
                        />
                      </div>
                      {/* Release Time */}
                      <div className="relative">
                        <input
                          type="time"
                          value={formData.releaseTime}
                          onChange={(e) =>
                            updateFormData("releaseTime", e.target.value)
                          }
                          className="w-full h-12 px-4 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Minimum Price */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <label className="text-base font-semibold text-gray-900 dark:text-white block">
                          Minimum Price
                        </label>
                        <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                          Set the minimum price for this content
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-medium">
                        $
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.minimumPrice}
                        onChange={(e) =>
                          updateFormData("minimumPrice", e.target.value)
                        }
                        placeholder="50.00"
                        className="w-full h-12 pl-8 pr-4 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Screenshots */}
            <div className="lg:col-span-1">
              <div className="group h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Image className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <label className="text-base font-semibold text-gray-900 dark:text-white block">
                      Screenshots
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                      Upload images (max 5)
                    </p>
                  </div>
                </div>
                <div className=" border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/50 h-[calc(100%-4rem)]">
                  <FileUpload
                    attachments={attachments}
                    onAttachmentsChange={setAttachments}
                    localFiles={localFiles}
                    onLocalFilesChange={setLocalFiles}
                    uploadOnSubmit={true}
                    maxFiles={5}
                    acceptedTypes={[
                      "image/jpeg",
                      "image/png",
                      "image/gif",
                      "image/webp",
                    ]}
                    className="border-none bg-transparent h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="relative bg-gray-50/80 dark:bg-gray-800/80 px-8 py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Button
              onClick={(e) => {
                console.log("🔥 Button clicked!", e);
                onSubmit();
              }}
              disabled={!isFormValid() || isSubmitting}
              className={`w-full h-14 text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group shadow-lg ${
                isSubmitted
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white"
                  : isFormValid() && !isSubmitting
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {!isSubmitted && isFormValid() && !isSubmitting && (
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
              <span className="relative flex items-center justify-center gap-3">
                {isSubmitted ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Submitted Successfully!</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    {submissionType === "otp" ? (
                      <Upload className="h-5 w-5" />
                    ) : (
                      <Zap className="h-5 w-5" />
                    )}
                    <span>
                      Submit {submissionType.toUpperCase()} & Create
                      Workflow
                    </span>
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
                      : isFormValid()
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
                      : isFormValid()
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {isSubmitted
                  ? "Content submitted and task created!"
                  : isSubmitting
                    ? "Processing your submission..."
                    : isFormValid()
                      ? "Ready to submit your content"
                      : "Please fill in all required fields"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}