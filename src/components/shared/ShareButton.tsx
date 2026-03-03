"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  score: number;
  grade: string;
}

export function ShareButton({ url, score, grade }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `I scored ${score}/100 (${grade}) on my GTM audit. Check yours:`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : url;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="flex items-center gap-3">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        Share on X
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        Share on LinkedIn
      </a>
      <button
        onClick={handleCopy}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
