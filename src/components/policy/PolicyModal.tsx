"use client";

import { useEffect } from "react";
import { PolicyItem } from "@/types";

interface PolicyModalProps {
  policy: PolicyItem | null;
  onClose: () => void;
}

export default function PolicyModal({ policy, onClose }: PolicyModalProps) {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!policy) return null;

  const typeLabel: Record<string, string> = {
    "发展规划": "bg-blue-50 text-blue-700", "经费保障": "bg-green-50 text-green-700",
    "专业设置": "bg-orange-50 text-orange-700", "质量评估": "bg-purple-50 text-purple-700",
    "招生就业": "bg-cyan-50 text-cyan-700", "对口援助": "bg-pink-50 text-pink-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-[640px] max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 pr-8">{policy.title}</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Meta tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {policy.type && (
              <span className={`px-2.5 py-1 text-xs rounded-full ${typeLabel[policy.type] || "bg-gray-50 text-gray-600"}`}>
                {policy.type}
              </span>
            )}
            {policy.province && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{policy.province}</span>
            )}
            {policy.publishDate && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700">📅 {policy.publishDate}</span>
            )}
          </div>

          {/* Detail fields */}
          <dl className="space-y-3 text-sm">
            {policy.department && (
              <div className="flex">
                <dt className="w-20 text-gray-500 shrink-0">发文部门</dt>
                <dd className="text-gray-800">{policy.department}</dd>
              </div>
            )}
            {policy.docNumber && (
              <div className="flex">
                <dt className="w-20 text-gray-500 shrink-0">发文字号</dt>
                <dd className="text-gray-800">{policy.docNumber}</dd>
              </div>
            )}
            {policy.sourceOrg && (
              <div className="flex">
                <dt className="w-20 text-gray-500 shrink-0">来源机构</dt>
                <dd className="text-gray-800">{policy.sourceOrg}</dd>
              </div>
            )}
            {policy.summary && (
              <div className="flex">
                <dt className="w-20 text-gray-500 shrink-0">政策摘要</dt>
                <dd className="text-gray-700 leading-relaxed">{policy.summary}</dd>
              </div>
            )}
          </dl>

          {/* Links */}
          <div className="mt-6 space-y-2">
            {policy.url && (
              <a
                href={policy.url}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                查看原文链接
              </a>
            )}
            {policy.downloadUrl && (
              <a
                href={policy.downloadUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载政策文件
              </a>
            )}
            {!policy.url && !policy.downloadUrl && (
              <p className="text-sm text-gray-400 text-center py-4">暂无原文链接和下载链接</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
