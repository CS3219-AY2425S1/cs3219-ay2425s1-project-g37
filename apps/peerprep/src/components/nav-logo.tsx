import { Link } from "@peerprep/ui/link";
import { Logo } from "@peerprep/ui/logo";

export function NavLogo({ forceNativeAnchor = false }) {
  return (
    <Link
      href="/"
      className="flex h-12 flex-row items-center"
      forceNativeAnchor={forceNativeAnchor}
    >
      <Logo />
    </Link>
  );
}
