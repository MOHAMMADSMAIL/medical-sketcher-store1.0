'use client';
import { useState } from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement>;

export default function ImageWithFallback({ alt = '', className, ...props }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div aria-label={alt} className={`${className ?? ''} bg-[#e9e5d8]`} />;
  return <img {...props} alt={alt} className={className} onError={() => setFailed(true)} />;
}
