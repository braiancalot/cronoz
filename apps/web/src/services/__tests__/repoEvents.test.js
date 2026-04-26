import { describe, expect, it, vi } from "vitest";
import { emitMutation, onMutation } from "@/services/repoEvents.js";

describe("repoEvents", () => {
  it("invokes the handler with the source on emit", () => {
    const handler = vi.fn();
    const unsubscribe = onMutation(handler);

    emitMutation("project");

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ source: "project" });

    unsubscribe();
  });

  it("supports multiple subscribers", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onMutation(a);
    const unsubB = onMutation(b);

    emitMutation("settings");

    expect(a).toHaveBeenCalledWith({ source: "settings" });
    expect(b).toHaveBeenCalledWith({ source: "settings" });

    unsubA();
    unsubB();
  });

  it("stops invoking the handler after unsubscribe", () => {
    const handler = vi.fn();
    const unsubscribe = onMutation(handler);

    emitMutation("project");
    unsubscribe();
    emitMutation("project");

    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not affect other subscribers when one unsubscribes", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onMutation(a);
    const unsubB = onMutation(b);

    unsubA();
    emitMutation("project");

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();

    unsubB();
  });
});
