import { redirect } from "next/navigation";

// The Library lives in the Studio now (its grid of spools, with Edit to delete). Old links land there.
export default function LibraryPage() {
  redirect("/studio");
}
