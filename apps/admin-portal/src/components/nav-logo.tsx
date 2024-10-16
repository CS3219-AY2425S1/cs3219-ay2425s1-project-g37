import { Link } from "@peerprep/ui/link";
import { Logo } from "@peerprep/ui/logo";

export function NavLogo() {
  return (
    <Link href="/" className="flex h-12 flex-row items-center">
      <Logo className="border-main-500 border-r pr-6" />
      <span className="select-none pl-6 text-2xl leading-none">Admin Portal</span>
    </Link>
  );
}
