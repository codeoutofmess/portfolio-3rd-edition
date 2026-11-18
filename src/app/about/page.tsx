import { redirect } from "next/navigation";

// About is a window on the home dial now.
export default function AboutPage() {
  redirect("/?view=about");
}
