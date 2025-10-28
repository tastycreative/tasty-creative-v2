"use client";

import { UseFormRegister } from "react-hook-form";
import { ModularFormData, SubmissionType } from "./types";

interface SubmissionTypeSelectorProps {
  register: UseFormRegister<ModularFormData>;
  currentValue?: SubmissionType;
}

export function SubmissionTypeSelector({ register, currentValue }: SubmissionTypeSelectorProps) {
  const types = [
    { id: "otp", label: "OTP", desc: "One-Time Post - Flexible scheduling" },
    { id: "ptr", label: "PTR", desc: "Priority Tape Release - Model-specified dates" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
          1
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Choose Submission Type
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
        {types.map((type) => (
          <label
            key={type.id}
            className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:shadow-md ${
              currentValue === type.id
                ? "border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-950"
                : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
            }`}
          >
            <input
              type="radio"
              value={type.id}
              {...register("submissionType", { required: "Please select a submission type" })}
              className="sr-only"
            />
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center">
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {type.label}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {type.desc}
                  </div>
                </div>
              </div>
              {currentValue === type.id && (
                <div className="text-purple-600 dark:text-purple-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
