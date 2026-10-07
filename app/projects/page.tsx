import { permanentRedirect } from "next/navigation";

/** Side projects now live on the Work page. Keeps old links working. */
export default function ProjectsPage() {
  permanentRedirect("/work#side-projects");
}
