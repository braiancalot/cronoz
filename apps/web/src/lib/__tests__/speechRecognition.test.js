import { describe, it, expect, vi } from "vitest";
import { installLocalModel } from "@/lib/speechRecognition.js";

function fakeRecognition({ availability, installs = true }) {
  return {
    available: vi.fn(async () => availability),
    install: vi.fn(async () => installs),
  };
}

describe("installLocalModel", () => {
  it("downloads a model the browser offers", async () => {
    const Recognition = fakeRecognition({ availability: "downloadable" });

    expect(await installLocalModel(Recognition)).toBe(true);
    expect(Recognition.install).toHaveBeenCalledWith({
      langs: ["pt-BR"],
      processLocally: true,
    });
  });

  it("skips the download when the model is already there", async () => {
    const Recognition = fakeRecognition({ availability: "available" });

    expect(await installLocalModel(Recognition)).toBe(true);
    expect(Recognition.install).not.toHaveBeenCalled();
  });

  it("reports failure when the language has no local model", async () => {
    const Recognition = fakeRecognition({ availability: "unavailable" });

    expect(await installLocalModel(Recognition)).toBe(false);
    expect(Recognition.install).not.toHaveBeenCalled();
  });

  it("reports failure when the download fails", async () => {
    const Recognition = fakeRecognition({ availability: "downloadable" });
    Recognition.install.mockRejectedValue(new DOMException("", "NetworkError"));

    expect(await installLocalModel(Recognition)).toBe(false);
  });

  it("reports failure on a browser without on-device recognition", async () => {
    expect(await installLocalModel(class {})).toBe(false);
  });
});
