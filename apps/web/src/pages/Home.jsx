import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import projectRepository from "@/services/projectRepository.js";
import { ProjectCard } from "@/components/ProjectCard.jsx";
import { AppHeader } from "@/components/AppHeader.jsx";
import { EmptyState } from "@/components/EmptyState.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { showUndoToast } from "@/lib/undoToast.js";
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

  // Hides the just-created project from the list until navigate unmounts Home,
  // preventing a flash of the card before the transition to /project/:id.
  const [creatingProjectId, setCreatingProjectId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  // Optimistic overrides so a card changes section / disappears immediately,
  // instead of lagging a frame behind the useLiveQuery re-emit.
  const [optimisticCompletion, setOptimisticCompletion] = useState({});
  const [optimisticDeletedIds, setOptimisticDeletedIds] = useState(new Set());

  const projects = useLiveQuery(() => projectRepository.getAll(), []);

  // Drop an override once the live data agrees on completed-ness.
  useEffect(() => {
    if (!projects) return;
    setOptimisticCompletion((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = {};
      for (const p of projects) {
        if (!(p.id in prev)) continue;
        const realCompleted = p.completedAt !== null;
        const wantCompleted = prev[p.id] !== null;
        if (realCompleted !== wantCompleted) next[p.id] = prev[p.id];
      }
      return next;
    });
  }, [projects]);

  // Drop the override once the live query no longer returns the id (so Undo,
  // which restores it, becomes visible again).
  useEffect(() => {
    if (!projects) return;
    setOptimisticDeletedIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(
        [...prev].filter((id) => projects.some((p) => p.id === id)),
      );
      return next.size === prev.size ? prev : next;
    });
  }, [projects]);

  async function handleCreate() {
    const newProject = await projectRepository.create();
    setCreatingProjectId(newProject.id);
    navigate(`/project/${newProject.id}`);
  }

  async function handleToggleComplete(project) {
    const willComplete = project.completedAt === null;
    setOptimisticCompletion((prev) => ({
      ...prev,
      [project.id]: willComplete ? Date.now() : null,
    }));
    if (willComplete) {
      await projectRepository.complete(project.id);
    } else {
      await projectRepository.reopen(project.id);
    }
  }

  function handleRequestDelete(project) {
    setPendingDelete(project);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    setOptimisticDeletedIds((prev) => new Set(prev).add(id));
    await projectRepository.remove(id);
    showUndoToast(`Projeto "${name}" excluído`, () => {
      // Clear the override so Undo's restore shows even before the cleanup runs.
      setOptimisticDeletedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return projectRepository.undeleteProject(id);
    });
  }

  if (projects === undefined) return null;

  const merged = projects
    .filter((p) => !optimisticDeletedIds.has(p.id))
    .map((p) =>
      p.id in optimisticCompletion
        ? { ...p, completedAt: optimisticCompletion[p.id] }
        : p,
    );

  const sortedByUpdatedAt = [...merged].sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
  );
  const activeProjects = sortedByUpdatedAt.filter(
    (p) => p.completedAt === null && p.id !== creatingProjectId,
  );
  const completedProjects = sortedByUpdatedAt.filter(
    (p) => p.completedAt !== null,
  );
  const isEmpty = activeProjects.length === 0 && completedProjects.length === 0;

  return (
    <PageContainer className="max-w-300 mx-auto">
      <AppHeader />

      <div className="flex flex-col">
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
              onToggleComplete={handleToggleComplete}
              onDelete={handleRequestDelete}
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
                onToggleComplete={handleToggleComplete}
                onDelete={handleRequestDelete}
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

      <ConfirmDialog
        open={!!pendingDelete}
        title="Apagar projeto?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" e todas as suas voltas serão removidas.`
            : ""
        }
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </PageContainer>
  );
}
