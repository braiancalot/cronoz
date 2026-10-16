import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom polyfills for Radix primitives (ScrollArea uses ResizeObserver).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

// jsdom has no scrollIntoView. ProjectFilters calls it on every chip tap.
Element.prototype.scrollIntoView ??= function scrollIntoViewStub() {};

afterEach(() => {
  cleanup();
});
