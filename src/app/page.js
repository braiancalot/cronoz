"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import projectRepository from "@/services/projectRepository.js";

export default function Home() {
  const [projects, setProjects] = useState([]);
  const router = useRouter();

  useEffect(() => {
    setProjects(projectRepository.getAll()); // eslint-disable-line
  }, []);

  function handleCreate() {
    const newProject = projectRepository.create();
    router.push(`/project/${newProject.id}`);
  }

  return (
    <main className="w-full max-w-[1200] mx-auto h-dvh flex flex-col">
      <header className="flex py-4 items-center justify-center">
        <h1 className="text-lg font-bold tracking-tight">Cronoz</h1>
      </header>

      <div className="px-8 flex flex-col">
        <button
          onClick={handleCreate}
          className="mt-8 md:self-end bg-teal-600 hover:bg-teal-700 active:bg-teal-800 px-5 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          + Novo projeto
        </button>

        <div className="flex flex-col gap-2 mt-6 w-full">
          {projects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`}>
              <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-lg hover:bg-neutral-800 active:bg-neutral-700 transition-colors">
                <span>{project.name}</span>
                <span>{project.totalTime}</span>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <p className="text-center text-neutral-500">Nenhum projeto criado.</p>
        )}
      </div>
    </main>
  );
}
