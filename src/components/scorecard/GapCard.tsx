import { LetterGrade } from "./LetterGrade";

interface GapCardProps {
  rank: number;
  dimensionLabel: string;
  score: number;
  grade: string;
  quickWin: string;
}

export function GapCard({
  rank,
  dimensionLabel,
  score,
  grade,
  quickWin,
}: GapCardProps) {
  return (
    <div className="rounded-xl border border-sylva-700 bg-sylva-800/50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-amber-400">
            Gap #{rank}
          </span>
          <h3 className="mt-1 text-base font-semibold text-white">
            {dimensionLabel}
          </h3>
        </div>
        <LetterGrade grade={grade} size="sm" />
      </div>
      <p className="mt-3 text-sm text-sylva-300">
        Score: {score.toFixed(0)}/100
      </p>
      <div className="mt-3 rounded-lg bg-sylva-900/50 p-3">
        <p className="text-xs font-medium text-amber-400">Quick Win</p>
        <p className="mt-1 text-sm text-sylva-200">{quickWin}</p>
      </div>
    </div>
  );
}
