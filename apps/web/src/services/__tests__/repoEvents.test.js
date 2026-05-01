import { describe, expect, it, vi } from "vitest";
import { emitMutation, onMutation } from "@/services/repoEvents.js";

describe("repoEvents", () => {
  it("invokes the handler on emit", () => {
    const handler = vi.fn();
    const unsubscribe = onMutation(handler);

    emitMutation();

    expect(handler).toHaveBeenCalledOnce();

    unsubscribe();
  });

  it("supports multiple subscribers", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onMutation(a);
    const unsubB = onMutation(b);

    emitMutation();

    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();

    unsubA();
    unsubB();
  });

  it("stops invoking the handler after unsubscribe", () => {
    const handler = vi.fn();
    const unsubscribe = onMutation(handler);

    emitMutation();
    unsubscribe();
    emitMutation();

    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not affect other subscribers when one unsubscribes", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onMutation(a);
    const unsubB = onMutation(b);

    unsubA();
    emitMutation();

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();

    unsubB();
  });
});
