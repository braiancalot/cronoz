import { toast } from "sonner";

export async function copyWithToast(text, label) {
  await navigator.clipboard.writeText(text);
  toast(`${label} copiado`, { position: "top-center" });
}
