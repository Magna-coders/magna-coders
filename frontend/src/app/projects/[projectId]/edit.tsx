"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/apiClient";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { projectId } = params as { projectId: string };
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/projects/${projectId}`);
        setForm(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchProject();
  }, [projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/projects/${projectId}`, {
        method: "PUT",
        data: {
          name: form.name,
          description: form.description,
          tags: form.tags,
          visibility: form.visibility,
          members: form.members,
        },
      });
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!form) return <div className="p-8">Project not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Project</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-bold">Name</label>
          <input name="name" value={form.name || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-bold">Description</label>
          <textarea name="description" value={form.description || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-bold">Tags (comma separated)</label>
          <input name="tags" value={form.tags || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-bold">Visibility</label>
          <input name="visibility" value={form.visibility || ""} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        {/* Add members editing UI as needed */}
        <div className="flex gap-4 mt-6">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => router.push(`/projects/${projectId}`)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
