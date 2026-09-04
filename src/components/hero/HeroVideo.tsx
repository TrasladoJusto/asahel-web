'use client';

import { useRef, useEffect, useState } from 'react';

interface HeroVideoProps {
  src: string;
  poster?: string;
}

export function HeroVideo({ src, poster }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const prevXRef = useRef<number | null>(null);
  const targetTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const sensitivity = 0.8;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoaded(true);
    };

    const handleSeeked = () => {
      isSeekingRef.current = false;
      if (targetTimeRef.current !== video.currentTime) {
        video.currentTime = targetTimeRef.current;
      }
    };

    const handleError = () => {
      setHasError(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isLoaded || isSeekingRef.current) return;

      const currentX = e.clientX;
      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      if (Math.abs(delta) < 0.5) return;

      const timeOffset = (delta / window.innerWidth) * sensitivity * duration;
      targetTimeRef.current = Math.max(0, Math.min(duration, video.currentTime + timeOffset));

      if (!isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = targetTimeRef.current;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isLoaded, duration]);

  return (
    <>
      {/* Dark fallback when video not loaded */}
      <div className="fixed inset-0 -z-20 w-full h-full bg-[var(--bg)]" aria-hidden="true" />
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={`fixed inset-0 -z-10 w-full h-full object-cover hero-video ${hasError ? 'hidden' : ''}`}
        muted
        playsInline
        preload="none"
        aria-hidden="true"
      />
    </>
  );
}