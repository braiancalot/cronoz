import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { EmptyState } from "@/components/EmptyState.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { Button } from "@/components/ui/button.jsx";

export function ProjectNotFound() {
  const navigate = useNavigate();

  return (
    <PageContainer className="items-center justify-center">
      <EmptyState message="Projeto não encontrado.">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeftIcon /> Voltar para a tela inicial
        </Button>
      </EmptyState>
    </PageContainer>
  );
}
