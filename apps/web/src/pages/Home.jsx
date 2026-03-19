import { useState } from "react";
import { useNavigate } from "react-router";

import projectRepository from "@/services/projectRepository.js";
import { ProjectCard } from "@/components/ProjectCard.jsx";
import { AppHeader } from "@/components/AppHeader.jsx";
import { EmptyState } from "@/components/EmptyState.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useLiveQuery } from "dexie-react-hooks";

function NewProjectButton({ onCreate }) {
  return (
    <Button onClick={onCreate} className="mt-8 w-full">
      + Novo projeto
    </Button>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [creatingProjectId, setCreatingProjectId] = useState(null);

  const projects = useLiveQuery(() => projectRepository.getAll(), []);

  async function handleCreate() {
    const newProject = await projectRepository.create();
    setCreatingProjectId(newProject.id);
    navigate(`/project/${newProject.id}`);
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
    <main className="w-full max-w-300 mx-auto h-dvh flex flex-col">
      <AppHeader />

      <div className="px-8 flex flex-col">
        {!isEmpty && (
          <div className="md:self-end">
            <NewProjectButton onCreate={handleCreate} />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-6 w-full">
          {activeProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              actionLabel="Concluir"
              onAction={handleComplete}
            />
          ))}
        </div>

        {completedProjects.length > 0 && (
          <div className="flex flex-col gap-2 mt-8 w-full">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Concluídos
            </span>
            {completedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                actionLabel="Reabrir"
                onAction={handleReopen}
                className="opacity-50"
              />
            ))}
          </div>
        )}

        {isEmpty && (
          <EmptyState message="Nenhum projeto criado.">
            <NewProjectButton onCreate={handleCreate} />
          </EmptyState>
        )}
      </div>
    </main>
  );
}
