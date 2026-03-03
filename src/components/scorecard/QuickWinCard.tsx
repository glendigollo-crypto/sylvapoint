interface QuickWinCardProps {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "quick" | "moderate" | "involved";
  dimensionLabel: string;
}

const impactColors = {
  high: "text-grade-a bg-grade-a/10",
  medium: "text-amber-500 bg-amber-500/10",
  low: "text-sylva-400 bg-sylva-400/10",
};

const effortLabels = {
  quick: "< 1 hour",
  moderate: "1-4 hours",
  involved: "1+ days",
};

export function QuickWinCard({
  title,
  description,
  impact,
  effort,
  dimensionLabel,
}: QuickWinCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-sylva-50">{title}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${impactColors[impact]}`}>
          {impact} impact
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Dimension: {dimensionLabel}</span>
        <span>Effort: {effortLabels[effort]}</span>
      </div>
    </div>
  );
}
