"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  const pillClass =
    "rounded-full border border-sylva-700 px-4 py-2 text-xs font-medium text-sylva-300 hover:text-white hover:border-sylva-500 transition-colors";

  return (
    <div className="flex items-center gap-2">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={pillClass}
      >
        Share on X
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={pillClass}
      >
        LinkedIn
      </a>
      <button onClick={handleCopy} className={pillClass}>
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="copied"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-grade-a"
            >
              Copied!
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Copy Link
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
