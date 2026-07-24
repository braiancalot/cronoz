import { toast } from "sonner";

export async function copyWithToast(text, label) {
  await navigator.clipboard.writeText(text);
  toast(`${label} copiado`, { position: "top-center" });
}

// PiP-aware: copies through the window holding the clicked element, since the
// main document is unfocused there and its clipboard rejects. The toaster only
// exists in the main document, so the PiP window copies silently.
export async function copyFromEvent(event, text, label) {
  event.stopPropagation();
  const view = event.currentTarget.ownerDocument.defaultView ?? window;
  await view.navigator.clipboard.writeText(text);
  if (view === window) {
    toast(`${label} copiado`, { position: "top-center" });
  }
}
