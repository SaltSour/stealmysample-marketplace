import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import NavbarClient from "./navbar-client";

const Navbar = async () => {
  const session = await getServerSession(authOptions);

  return <NavbarClient session={session} />;
};

export default Navbar; 