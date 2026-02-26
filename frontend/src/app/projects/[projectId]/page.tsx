"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/services/apiClient";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { projectId } = params as { projectId: string };
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const [members, setMembers] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/projects/${projectId}`);
        setProject(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchProject();
  }, [projectId]);

  useEffect(() => {
    async function fetchTabData() {
      if (!projectId) return;
      setTabLoading(true);
      setTabError(null);
      try {
        if (tab === "members") {
          const data = await apiFetch<any>(`/projects/${projectId}/members`);
          setMembers(data.members || []);
        } else if (tab === "files") {
          const data = await apiFetch<any>(`/projects/${projectId}/files`);
          setFiles(data.files || []);
        } else if (tab === "tasks") {
          const data = await apiFetch<any>(`/projects/${projectId}/tasks`);
          setTasks(data.tasks || []);
        } else if (tab === "activity") {
          const data = await apiFetch<any>(`/projects/${projectId}/activity`);
          setActivity(data.activity || []);
        }
      } catch (err: any) {
        setTabError(err?.message || "Failed to load data");
      } finally {
        setTabLoading(false);
      }
    }
    if (tab !== "overview") fetchTabData();
  }, [tab, projectId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!project) return <div className="p-8">Project not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">{project.name || project.title}</h1>
      <p className="mb-4 text-gray-600">{project.description}</p>
      <div className="mb-4">
        <span className="font-bold">Visibility:</span> {project.visibility || "-"}
      </div>
      <div className="mb-4">
        <span className="font-bold">Tags:</span> {project.tags?.join(", ") || "-"}
      </div>
      <div className="mb-4">
        <span className="font-bold">Owner:</span> {project.ownerId || "-"}
      </div>
      <div className="mb-4">
        <span className="font-bold">Members:</span> {project.members?.length || 0}
        {project.members && project.members.length > 0 && (
          <ul className="list-disc ml-6 mt-2">
            {project.members.map((m: any) => (
              <li key={m.id}>{m.name || m.email || m.id} ({m.role || "member"})</li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-4 mt-8 border-b pb-2">
        <button onClick={() => setTab("overview")} className={tab === "overview" ? "font-bold" : ""}>Overview</button>
        <button onClick={() => setTab("members")} className={tab === "members" ? "font-bold" : ""}>Members</button>
        <button onClick={() => setTab("files")} className={tab === "files" ? "font-bold" : ""}>Files</button>
        <button onClick={() => setTab("tasks")} className={tab === "tasks" ? "font-bold" : ""}>Tasks</button>
        <button onClick={() => setTab("activity")} className={tab === "activity" ? "font-bold" : ""}>Activity</button>
      </div>
      {tab !== "overview" && tabLoading && <div className="mt-4">Loading...</div>}
      {tab !== "overview" && tabError && <div className="mt-4 text-red-500">{tabError}</div>}
      {tab === "overview" && (
        <>
          <div className="mb-4">
            <span className="font-bold">Visibility:</span> {project.visibility || "-"}
          </div>
          <div className="mb-4">
            <span className="font-bold">Tags:</span> {project.tags?.join(", ") || "-"}
          </div>
          <div className="mb-4">
            <span className="font-bold">Owner:</span> {project.ownerId || "-"}
          </div>
          <div className="mb-4">
            <span className="font-bold">Members:</span> {project.members?.length || 0}
            {project.members && project.members.length > 0 && (
              <ul className="list-disc ml-6 mt-2">
                {project.members.map((m: any) => (
                  <li key={m.id}>{m.name || m.email || m.id} ({m.role || "member"})</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      {tab === "members" && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">Members</h2>
          <ul>
            {members.map((m: any) => (
              <li key={m.id}>{m.name || m.email || m.id} ({m.role || "member"})</li>
            ))}
          </ul>
        </div>
      )}
      {tab === "files" && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">Files</h2>
          <ul>
            {files.map((f: any) => (
              <li key={f.id || f.name}>{f.name} ({f.type || f.mimeType || "file"})</li>
            ))}
          </ul>
        </div>
      )}
      {tab === "tasks" && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">Tasks</h2>
          <ul>
            {tasks.map((t: any) => (
              <li key={t.id}>{t.title || t.name} - {t.status || "open"}</li>
            ))}
          </ul>
        </div>
      )}
      {tab === "activity" && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">Activity</h2>
          <ul>
            {activity.map((a: any, i: number) => (
              <li key={a.id || i}>{a.description || a.type || JSON.stringify(a)}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-4 mt-8">
        <Link href={`/projects/${projectId}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded">Edit</Link>
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={async () => {
          if (!confirm("Delete this project?")) return;
          try {
            await apiFetch(`/projects/${projectId}`, { method: "DELETE" });
            router.push("/projects");
          } catch (err: any) {
            alert(err?.message || "Failed to delete project");
          }
        }}>Delete</button>
      </div>
    </div>
  );
}
