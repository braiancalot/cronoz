import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import projectRepository from "@/services/projectRepository.js";
import {
  PROJECT_TIME_WIDTH,
  ProjectCard,
} from "@/components/project/ProjectCard.jsx";
import { ProjectFilters } from "@/components/tag/ProjectFilters.jsx";
import { TagManagerDialog } from "@/components/tag/TagManagerDialog.jsx";
import { AppHeader } from "@/components/AppHeader.jsx";
import { EmptyState } from "@/components/EmptyState.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { useHideTags } from "@/hooks/useHideTags.js";
import {
  addTagToList,
  collectTags,
  filterProjects,
  removeTagFromList,
  tagKey,
} from "@/lib/tags.js";
import { anyReachesAnHour, calculateTotalTime } from "@/lib/stopwatch.js";
import { showUndoToast, UNDO_ON_LIST } from "@/lib/undoToast.js";
import { cn } from "@/lib/utils.js";
import { useLiveQuery } from "dexie-react-hooks";

const PROJECT_LIST_CLASS = "flex w-full flex-col gap-3 @min-[40rem]:gap-2";

function NewProjectButton({ onCreate }) {
  return (
    <Button onClick={onCreate} className="mt-8 w-full">
      + Novo projeto
    </Button>
  );
}

function sameTags(left = [], right = []) {
  return (
    left.length === right.length &&
    left.every((tag, index) => tagKey(tag) === tagKey(right[index]))
  );
}

function ProjectList({
  projects,
  timeWidth,
  hideTags,
  onManageTags,
  onToggleComplete,
  onDelete,
}) {
  return (
    <div className="@container w-full">
      <div className={PROJECT_LIST_CLASS}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            timeWidth={timeWidth}
            hideTags={hideTags}
            onManageTags={onManageTags}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const ignoreMs = useIgnoreMilliseconds();
  const hideTags = useHideTags();

  // Hides the just-created project from the list until navigate unmounts Home,
  // preventing a flash of the card before the transition to /project/:id.
  const [creatingProjectId, setCreatingProjectId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  // Optimistic overrides so a card changes section / disappears immediately,
  // instead of lagging a frame behind the useLiveQuery re-emit.
  const [optimisticCompletion, setOptimisticCompletion] = useState({});
  const [optimisticDeletedIds, setOptimisticDeletedIds] = useState(new Set());
  const [optimisticTags, setOptimisticTags] = useState({});
  const [managedProjectId, setManagedProjectId] = useState(null);
  const [selectedTagKeys, setSelectedTagKeys] = useState([]);
  const [completedOnly, setCompletedOnly] = useState(false);

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

  // Keep the dialog and card in sync immediately, then discard each override
  // once Dexie's live query emits the same list.
  useEffect(() => {
    if (!projects) return;
    setOptimisticTags((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = {};
      for (const [id, tags] of Object.entries(prev)) {
        const project = projects.find((candidate) => candidate.id === id);
        if (project && !sameTags(project.tags, tags)) next[id] = tags;
      }
      return next;
    });
  }, [projects]);

  // A deleted last use removes the tag from the derived vocabulary. Drop its
  // filter too, so the user is not left with an invisible active criterion.
  useEffect(() => {
    if (!projects) return;
    const available = new Set(collectTags(projects).map((tag) => tag.key));
    setSelectedTagKeys((current) => {
      const next = current.filter((key) => available.has(key));
      return next.length === current.length ? current : next;
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
    showUndoToast(
      `Projeto "${name}" excluído`,
      () => {
        // Clear the override so Undo's restore shows even before the cleanup runs.
        setOptimisticDeletedIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return projectRepository.undeleteProject(id);
      },
      UNDO_ON_LIST,
    );
  }

  function updateOptimisticTags(id, transform) {
    setOptimisticTags((current) => {
      const stored =
        current[id] ??
        projects.find((project) => project.id === id)?.tags ??
        [];
      const tags = transform(stored);
      return tags === stored ? current : { ...current, [id]: tags };
    });
  }

  async function handleAddTag(id, name) {
    updateOptimisticTags(id, (tags) => addTagToList(tags, name));
    await projectRepository.addTag({ id, name });
  }

  async function handleRemoveTag(id, name) {
    updateOptimisticTags(id, (tags) => removeTagFromList(tags, name));
    await projectRepository.removeTag({ id, name });
  }

  function toggleTagFilter(key) {
    setSelectedTagKeys((current) =>
      current.includes(key)
        ? current.filter((selected) => selected !== key)
        : [...current, key],
    );
  }

  function clearFilters() {
    setSelectedTagKeys([]);
    setCompletedOnly(false);
  }

  if (projects === undefined) return null;

  const merged = projects
    .filter((p) => !optimisticDeletedIds.has(p.id))
    .map((project) => ({
      ...project,
      ...(project.id in optimisticCompletion
        ? { completedAt: optimisticCompletion[project.id] }
        : {}),
      ...(project.id in optimisticTags
        ? { tags: optimisticTags[project.id] }
        : {}),
    }));

  const sortedByUpdatedAt = [...merged].sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
  );
  const listProjects = sortedByUpdatedAt.filter(
    (project) => project.id !== creatingProjectId,
  );
  const allTags = hideTags ? [] : collectTags(listProjects);
  // Only useful when it can exclude something: some completed, some not.
  // Lives in the tags filter row, so it hides along with the rest of tags too.
  const showCompletedFilter =
    !hideTags &&
    listProjects.some((project) => project.completedAt !== null) &&
    listProjects.some((project) => project.completedAt === null);
  const effectiveCompletedOnly = showCompletedFilter && completedOnly;
  const filteredProjects = filterProjects(listProjects, {
    tagKeys: hideTags ? [] : selectedTagKeys,
    completed: effectiveCompletedOnly ? true : undefined,
  });
  const activeProjects = filteredProjects.filter(
    (p) => p.completedAt === null && p.id !== creatingProjectId,
  );
  const completedProjects = filteredProjects.filter(
    (p) => p.completedAt !== null,
  );
  const isEmpty = listProjects.length === 0;
  const hasActiveFilters =
    (!hideTags && selectedTagKeys.length > 0) || effectiveCompletedOnly;
  const hasFilterOptions = allTags.length > 0 || showCompletedFilter;
  const noFilteredProjects =
    !isEmpty && activeProjects.length === 0 && completedProjects.length === 0;
  const timeWidth = anyReachesAnHour(
    listProjects.map((project) =>
      calculateTotalTime(project.stopwatch, { ignoreMs }),
    ),
  )
    ? PROJECT_TIME_WIDTH.withHours
    : PROJECT_TIME_WIDTH.short;
  const managedProject = merged.find(
    (project) => project.id === managedProjectId,
  );

  return (
    <PageContainer className="max-w-300 mx-auto">
      <AppHeader />

      <div className="flex flex-col">
        {!isEmpty && (
          <div className="md:self-end">
            <NewProjectButton onCreate={handleCreate} />
          </div>
        )}

        {!isEmpty && hasFilterOptions && (
          <ProjectFilters
            tags={allTags}
            selectedTagKeys={selectedTagKeys}
            completedOnly={effectiveCompletedOnly}
            showCompletedFilter={showCompletedFilter}
            className="mt-6"
            onToggleTag={toggleTagFilter}
            onToggleCompleted={() => setCompletedOnly((current) => !current)}
            onClear={clearFilters}
          />
        )}

        {activeProjects.length > 0 && (
          <div className={cn(hasFilterOptions ? "mt-4" : "mt-6")}>
            <ProjectList
              projects={activeProjects}
              timeWidth={timeWidth}
              hideTags={hideTags}
              onManageTags={(project) => setManagedProjectId(project.id)}
              onToggleComplete={handleToggleComplete}
              onDelete={handleRequestDelete}
            />
          </div>
        )}

        {completedProjects.length > 0 && (
          <div
            className={cn(
              "flex w-full flex-col",
              activeProjects.length > 0
                ? "mt-8"
                : hasFilterOptions
                  ? "mt-4"
                  : "mt-6",
            )}
          >
            <span className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Concluídos
            </span>
            <ProjectList
              projects={completedProjects}
              timeWidth={timeWidth}
              hideTags={hideTags}
              onManageTags={(project) => setManagedProjectId(project.id)}
              onToggleComplete={handleToggleComplete}
              onDelete={handleRequestDelete}
            />
          </div>
        )}

        {noFilteredProjects && (
          <div className="mt-6 flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 text-center">
            <span className="text-sm text-muted-foreground">
              Nenhum projeto com esses filtros.
            </span>
            {hasActiveFilters && (
              <Button
                variant="link"
                size="sm"
                className="h-auto px-0"
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
            )}
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

      {managedProject && (
        <TagManagerDialog
          open
          projectName={managedProject.name}
          tags={managedProject.tags ?? []}
          allTags={allTags}
          onOpenChange={(open) => {
            if (!open) setManagedProjectId(null);
          }}
          onAdd={(name) => handleAddTag(managedProject.id, name)}
          onRemove={(name) => handleRemoveTag(managedProject.id, name)}
        />
      )}
    </PageContainer>
  );
}
