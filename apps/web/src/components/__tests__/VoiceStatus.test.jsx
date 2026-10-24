import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceStatus } from "@/components/VoiceStatus.jsx";

describe("VoiceStatus", () => {
  it("shows the phrase being heard", () => {
    render(
      <VoiceStatus
        status="listening"
        message={{ text: "cronos pausar", isUnknown: false }}
      />,
    );

    expect(screen.getByText("cronos pausar")).toBeInTheDocument();
  });

  it("names an unknown command", () => {
    render(
      <VoiceStatus
        status="listening"
        message={{ text: "cronos desliga", isUnknown: true }}
      />,
    );

    expect(
      screen.getByText('Comando não reconhecido: "cronos desliga"'),
    ).toBeInTheDocument();
  });

  it("explains a blocked microphone only when its icon is tapped", () => {
    render(<VoiceStatus status="blocked" message={null} />);
    expect(screen.queryByText(/Microfone bloqueado/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Comandos de voz"));

    expect(screen.getByText(/Microfone bloqueado/)).toBeInTheDocument();
  });
});
