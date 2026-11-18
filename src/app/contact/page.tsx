import { redirect } from "next/navigation";

// Contact is a window on the home dial now.
export default function ContactPage() {
  redirect("/?view=contact");
}
