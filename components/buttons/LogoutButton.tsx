import Link from "next/link";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  return (
    <Link href="/">
      <Button variant="outline" size="sm" className="cursor-pointer">
       <LogOut size={15} /> Logout
      </Button>
    </Link>
  );
};

export default LogoutButton;
