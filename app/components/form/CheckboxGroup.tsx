"use client";

import { forwardRef } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps<T extends FieldValues> {
  label: string;
  options: CheckboxOption[];
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: string;
  required?: boolean;
}

export function CheckboxGroup<T extends FieldValues>({
  label,
  options,
  name,
  register,
  error,
  required = false
}: CheckboxGroupProps<T>) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              value={option.value}
              {...register(name)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
