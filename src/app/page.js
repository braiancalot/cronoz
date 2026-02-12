"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import projectRepository from "@/services/projectRepository.js";
import { formatTime, hasHours } from "@/lib/stopwatch.js";

function NewProjectButton({ onCreate }) {
  return (
    <button
      onClick={onCreate}
      className="mt-8 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 px-5 py-2 rounded-lg transition-colors text-sm font-medium"
    >
      + Novo projeto
    </button>
  );
}

export default function Home() {
  const [projects, setProjects] = useState([]);
  const router = useRouter();
  const isEmpty = projects.length === 0;

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
        {!isEmpty && (
          <div className="self-end">
            <NewProjectButton onCreate={handleCreate} />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-6 w-full">
          {projects.map((project) => {
            const { hours, minutes, seconds } = formatTime(project.totalTime);

            return (
              <Link key={project.id} href={`/project/${project.id}`}>
                <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-lg hover:bg-neutral-800 active:bg-neutral-700 transition-colors">
                  <span>{project.name}</span>

                  <div className="flex font-medium items-center justify-center cursor-pointer">
                    {hasHours(hours) && (
                      <>
                        <span>{hours}</span>
                        <span className="opacity-50">:</span>
                      </>
                    )}
                    <span>{minutes}</span>
                    <span className="opacity-50">:</span>
                    <span>{seconds}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {isEmpty && (
          <div className="flex flex-col items-center">
            <p className="text-center text-neutral-500">
              Nenhum projeto criado.
            </p>

            <NewProjectButton onCreate={handleCreate} />
          </div>
        )}
      </div>
    </main>
  );
}
