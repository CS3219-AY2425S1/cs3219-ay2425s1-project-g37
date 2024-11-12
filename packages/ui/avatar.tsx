import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "./cn";

export function Avatar({
  imageUrl,
  username,
  className,
}: {
  imageUrl: string;
  username: string;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "bg-main-800 grid size-12 select-none place-items-center overflow-clip rounded-full",
        className,
      )}
    >
      <AvatarPrimitive.Image
        src={imageUrl}
        alt={`@${username}'s avatar`}
        className="size-full object-cover"
      />
      <AvatarPrimitive.Fallback className="text-main-400" delayMs={300}>
        {username[0].toUpperCase()}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
