"use client";

import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface MathTextProps {
  content: string;
}

export default function MathText({ content }: MathTextProps) {
  if (!content) return null;
  return <Latex>{content}</Latex>;
}
