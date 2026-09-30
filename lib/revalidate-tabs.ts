import { revalidatePath } from "next/cache";
import { TAB_HREFS } from "@/lib/motion";

export function revalidateTabs() {
  for (const href of TAB_HREFS) revalidatePath(href);
}
