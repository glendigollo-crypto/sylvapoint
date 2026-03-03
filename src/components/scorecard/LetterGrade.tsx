interface LetterGradeProps {
  grade: string;
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export function LetterGrade({ grade, size = "md", glow = false }: LetterGradeProps) {
  const gradeColor = getGradeColor(grade);
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-lg",
    lg: "h-16 w-16 text-2xl",
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg font-bold ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${gradeColor}15`,
        color: gradeColor,
        border: `2px solid ${gradeColor}40`,
        boxShadow: glow ? `0 0 12px ${gradeColor}30` : undefined,
      }}
    >
      {grade}
    </div>
  );
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "var(--grade-a)";
  if (grade.startsWith("B")) return "var(--grade-b)";
  if (grade.startsWith("C")) return "var(--grade-c)";
  if (grade.startsWith("D")) return "var(--grade-d)";
  return "var(--grade-f)";
}
