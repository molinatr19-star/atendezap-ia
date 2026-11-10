import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 rounded-md font-semibold">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <MessageCircle className="size-4" aria-hidden="true" />
      </span>
      <span>{siteConfig.name}</span>
    </Link>
  );
}
