import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth.js";
import Nav from "@/components/Nav.js";

export default async function AppLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <>
      <Nav userName={user.name} />
      <div className="container">{children}</div>
    </>
  );
}
