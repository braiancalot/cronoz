import { ArrowLeftIcon, CopyIcon } from "@phosphor-icons/react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import { EmptyState } from "@/components/EmptyState.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { LapsOverview } from "@/components/laps/LapsOverview.jsx";
import { ProjectNotFound } from "@/components/project/ProjectNotFound.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useHidePrice } from "@/hooks/useHidePrice.js";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { useProjectReadout } from "@/hooks/useProjectReadout.js";
import { useHourlyPrice } from "@/providers/SettingsProvider.jsx";
import { copyWithToast } from "@/lib/clipboard.js";
import { formatBrl } from "@/lib/currency.js";
import { formatLapsSummaryText, summarizeLaps } from "@/lib/lapsSummary.js";
import { calculateTotalPrice } from "@/lib/stopwatch.js";

export default function LapsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, project, splitTime } = useProjectReadout(id);
  const ignoreMs = useIgnoreMilliseconds();
  const hidePrice = useHidePrice();
  const hourlyPrice = useHourlyPrice();

  if (isLoading) return null;
  if (!project) return <ProjectNotFound />;

  const rows = summarizeLaps({
    laps: project.stopwatch.laps,
    currentLapTime: splitTime,
    ignoreMs,
  });
  const totalTime = rows.at(-1)?.cumulativeTime ?? 0;
  const priceFormatted = formatBrl(calculateTotalPrice(totalTime, hourlyPrice));

  // Popping, not pushing, so the phone's back gesture doesn't bounce between the two pages.
  function handleBack(event) {
    if (location.key === "default") return;
    event.preventDefault();
    navigate(-1);
  }

  function handleCopy() {
    const text = formatLapsSummaryText({
      projectName: project.name,
      rows,
      totalTime,
      price: hidePrice ? null : priceFormatted,
    });
    copyWithToast(text, "Resumo");
  }

  return (
    <PageContainer className="items-center">
      <header className="w-full h-16 flex items-center justify-between gap-4 shrink-0">
        <div className="flex flex-1 min-w-0 items-center gap-1 justify-start">
          <Link
            to={`/project/${id}`}
            replace
            onClick={handleBack}
            className="-ml-3 p-3"
          >
            <ArrowLeftIcon className="size-5" />
          </Link>
          <h1 className="min-w-0 truncate text-lg font-medium">
            {project.name}
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={rows.length === 0}
          title={
            hidePrice
              ? "Copiar resumo (voltas e total)"
              : "Copiar resumo (voltas, total e valor)"
          }
          onClick={handleCopy}
        >
          <CopyIcon />
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState message="Nenhuma volta ainda." />
        </div>
      ) : (
        <div className="flex flex-1 flex-col w-full min-h-0 pb-4">
          <LapsOverview rows={rows} />
        </div>
      )}
    </PageContainer>
  );
}
