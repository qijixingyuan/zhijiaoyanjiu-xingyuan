"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CollegeDetail, PolicyItem } from "@/types";
import CollegeDetailContent from "@/components/college/CollegeDetailContent";

export default function CollegeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [college, setCollege] = useState<CollegeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/colleges/${id}`)
      .then((r) => r.json())
      .then((data) => { setCollege(data.error ? null : data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!college) return;
    setPoliciesLoading(true);
    fetch(`/api/policies?keyword=${encodeURIComponent(college.name.substring(0, 4))}&limit=20`)
      .then((r) => r.json())
      .then((json) => { setPolicies(json.data || []); setPoliciesLoading(false); })
      .catch(() => setPoliciesLoading(false));
  }, [college]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!college) {
    return <div className="text-center py-20 text-[#5A6A85] text-sm">院校未找到</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <a href="/" onClick={(e) => { e.preventDefault(); window.history.back(); }}
          className="text-sm text-[#1A56A0] hover:underline">← 返回</a>
      </div>

      <div className="bg-white border border-[#D8E2F0] rounded-lg p-6">
        <CollegeDetailContent
          college={college}
          activeTab={tab}
          onTabChange={setTab}
          relatedPolicies={policies}
          policiesLoading={policiesLoading}
        />
      </div>
    </div>
  );
}
