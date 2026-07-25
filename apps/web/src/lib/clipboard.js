import { toast } from "sonner";

function copiedMessage(label, plural) {
  return `${label} ${plural ? "copiados" : "copiado"}`;
}

export async function copyWithToast(text, label, { plural = false } = {}) {
  await navigator.clipboard.writeText(text);
  toast(copiedMessage(label, plural), { position: "top-center" });
}

// PiP-aware: copies through the window holding the clicked element, since the
// main document is unfocused there and its clipboard rejects. The toaster only
// exists in the main document, so the PiP window copies silently.
export async function copyFromEvent(
  event,
  text,
  label,
  { plural = false } = {},
) {
  event.stopPropagation();
  const view = event.currentTarget.ownerDocument.defaultView ?? window;
  await view.navigator.clipboard.writeText(text);
  if (view === window) {
    toast(copiedMessage(label, plural), { position: "top-center" });
  }
}
