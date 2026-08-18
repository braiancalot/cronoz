import { useRef, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";

import { TagChip } from "@/components/tag/TagChip.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  MAX_TAG_LENGTH,
  hasTag,
  normalizeTag,
  suggestTags,
  tagKey,
} from "@/lib/tags.js";

export function TagManagerDialog({
  open,
  onOpenChange,
  projectName,
  tags,
  allTags,
  onAdd,
  onRemove,
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const normalizedQuery = normalizeTag(query);
  const exactMatch = allTags.find((tag) => tag.key === tagKey(normalizedQuery));
  const suggestions = suggestTags(allTags, query)
    .filter((tag) => !hasTag(tags, tag.name))
    .slice(0, 6);
  const canCreate =
    normalizedQuery && !exactMatch && !hasTag(tags, normalizedQuery);
  const emptyMessage = normalizedQuery
    ? "Essa tag já está aplicada."
    : allTags.length === 0
      ? "Digite um nome para criar a primeira tag."
      : "Todas as tags disponíveis já estão aplicadas.";

  function handleOpenChange(nextOpen) {
    if (!nextOpen) setQuery("");
    onOpenChange(nextOpen);
  }

  function addTag(name) {
    onAdd(name);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!normalizedQuery) return;
    if (exactMatch && !hasTag(tags, exactMatch.name)) {
      addTag(exactMatch.name);
      return;
    }
    if (canCreate) addTag(normalizedQuery);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto overscroll-contain p-4 sm:gap-5 sm:p-6 [&>[data-slot=dialog-close]]:size-11 sm:[&>[data-slot=dialog-close]]:size-9">
        <DialogHeader className="pr-10 sm:pr-8">
          <DialogTitle>Tags do projeto</DialogTitle>
          <DialogDescription>
            Organize “{projectName}” com tags.
          </DialogDescription>
        </DialogHeader>

        {tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Aplicadas
            </span>
            <div className="flex min-h-8 flex-wrap content-start items-start gap-1.5">
              {tags.map((tag) => (
                <TagChip
                  key={tag}
                  name={tag}
                  className="h-7 px-2.5 sm:h-5 sm:px-2"
                  onRemove={onRemove}
                />
              ))}
            </div>
          </div>
        )}

        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <Label htmlFor="tag-search">Adicionar tag</Label>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="tag-search"
              value={query}
              maxLength={MAX_TAG_LENGTH}
              autoComplete="off"
              placeholder="Buscar ou criar"
              className="h-11 pl-9 sm:h-9"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div
            aria-label="Sugestões de tags"
            className="-mx-2 flex max-h-40 flex-col gap-1 overflow-y-auto px-2 sm:max-h-52"
          >
            {suggestions.map((tag) => (
              <Button
                key={tag.key}
                type="button"
                variant="ghost"
                pressEffect="none"
                aria-label={`Adicionar tag ${tag.name}`}
                className="min-h-11 w-full justify-start gap-2 px-2 sm:min-h-10"
                onClick={() => addTag(tag.name)}
              >
                <TagChip name={tag.name} />
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {tag.count} {tag.count === 1 ? "projeto" : "projetos"}
                </span>
              </Button>
            ))}

            {canCreate && (
              <Button
                type="submit"
                variant="ghost"
                pressEffect="none"
                className="min-h-11 w-full justify-start gap-2 px-3 text-left sm:min-h-10"
              >
                <PlusIcon className="size-4 shrink-0" />
                <span className="min-w-0 truncate">
                  Criar “{normalizedQuery}”
                </span>
              </Button>
            )}

            {suggestions.length === 0 && !canCreate && (
              <span className="px-3 py-2 text-sm text-muted-foreground">
                {emptyMessage}
              </span>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            className="h-11 w-full sm:h-9 sm:w-auto"
            onClick={() => handleOpenChange(false)}
          >
            Pronto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
