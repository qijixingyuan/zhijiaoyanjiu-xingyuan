"use client";

import { useState, useEffect } from "react";
import { CollegeDetail, PolicyItem } from "@/types";
import CollegeDetailContent from "./CollegeDetailContent";

interface Props {
  college: CollegeDetail | null;
  relatedPolicies: PolicyItem[];
  policiesLoading: boolean;
  onClose: () => void;
}

export default function CollegeDetailModal({
  college,
  relatedPolicies,
  policiesLoading,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState("info");

  // Reset tab when switching colleges
  useEffect(() => {
    setActiveTab("info");
  }, [college]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!college) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[720px] max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-[#0C2340] pr-8 truncate">
            {college.name}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <CollegeDetailContent
            college={college}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            relatedPolicies={relatedPolicies}
            policiesLoading={policiesLoading}
          />
        </div>
      </div>
    </div>
  );
}
