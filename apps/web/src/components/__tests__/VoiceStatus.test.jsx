import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("warns that the microphone is blocked", () => {
    render(<VoiceStatus status="blocked" message={null} />);

    expect(screen.getByText("Microfone bloqueado")).toBeInTheDocument();
  });
});
