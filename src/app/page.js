"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import projectRepository from "@/services/projectRepository.js";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { useLiveQuery } from "dexie-react-hooks";

function NewProjectButton({ onCreate }) {
  return (
    <button
      onClick={onCreate}
      className="mt-8 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 px-5 py-2 rounded-lg transition-colors text-sm font-medium w-full"
    >
      + Novo projeto
    </button>
  );
}

export default function Home() {
  const router = useRouter();

  const [creatingProjectId, setCreatingProjectId] = useState(null);

  const projects = useLiveQuery(() => projectRepository.getAll(), []);

  async function handleCreate() {
    const newProject = await projectRepository.create();
    setCreatingProjectId(newProject.id);
    router.push(`/project/${newProject.id}`);
  }

  async function handleComplete(e, id) {
    e.preventDefault();
    await projectRepository.complete(id);
  }

  async function handleReopen(e, id) {
    e.preventDefault();
    await projectRepository.reopen(id);
  }

  if (projects === undefined) return null;

  const activeProjects = projects.filter(
    (p) => p.completedAt === null && p.id !== creatingProjectId,
  );
  const completedProjects = projects.filter((p) => p.completedAt !== null);
  const isEmpty = activeProjects.length === 0 && completedProjects.length === 0;

  return (
    <main className="w-full max-w-[1200] mx-auto h-dvh flex flex-col">
      <header className="flex py-4 justify-center">
        <h1 className="text-lg font-bold tracking-tight">Cronoz</h1>
      </header>

      <div className="px-8 flex flex-col">
        {!isEmpty && (
          <div className="md:self-end">
            <NewProjectButton onCreate={handleCreate} />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-6 w-full">
          {activeProjects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`}>
              <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-lg hover:bg-neutral-800 active:bg-neutral-700 transition-colors">
                <span>{project.name}</span>
                <div className="flex items-center gap-4">
                  <FormattedTime time={project.stopwatch.totalTime} />
                  <button
                    onClick={(e) => handleComplete(e, project.id)}
                    className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {completedProjects.length > 0 && (
          <div className="flex flex-col gap-2 mt-8 w-full">
            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              Concluídos
            </span>
            {completedProjects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-lg hover:bg-neutral-800 active:bg-neutral-700 transition-colors opacity-50">
                  <span>{project.name}</span>
                  <div className="flex items-center gap-4">
                    <FormattedTime time={project.stopwatch.totalTime} />
                    <button
                      onClick={(e) => handleReopen(e, project.id)}
                      className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
                    >
                      Reabrir
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center">
            <p className="text-center text-neutral-500">
              Nenhum projeto criado.
            </p>
            <div>
              <NewProjectButton onCreate={handleCreate} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
