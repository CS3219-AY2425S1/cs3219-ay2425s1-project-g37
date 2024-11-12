import type { Difficulty } from "@peerprep/schemas";

import { cn } from "./cn";

function Label({
  size,
  className,
  children,
}: {
  size: "base" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  if (size === "base")
    return <span className={cn("inline-block px-2 py-0.5 text-sm", className)}>{children}</span>;
  if (size === "lg")
    return <span className={cn("inline-block px-3 py-1.5", className)}>{children}</span>;
}

export function QuestionDifficultyLabel({
  size = "base",
  difficulty,
}: {
  size?: "base" | "lg";
  difficulty: Difficulty;
}) {
  switch (difficulty) {
    case "EASY":
      return (
        <Label size={size} className="bg-emerald-900 text-emerald-50">
          Easy
        </Label>
      );
    case "MEDIUM":
      return (
        <Label size={size} className="bg-yellow-900 text-yellow-50">
          Medium
        </Label>
      );
    case "HARD":
      return (
        <Label size={size} className="bg-red-900 text-red-50">
          Hard
        </Label>
      );
  }
}
