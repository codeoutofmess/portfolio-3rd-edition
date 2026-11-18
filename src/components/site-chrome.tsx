"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "@/components/home-chrome";

/** Every page but the home dial (which draws its own) gets the same top bar as the landing page. */
export function SiteChrome() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <TopBar fade />;
}
