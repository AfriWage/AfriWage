'use client';

import { useEffect, useRef } from 'react';

export default function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // Loop smoothly back to beginning when it hits 10s
      if (video.currentTime >= 10) {
        video.currentTime = 0;
        video.play().catch(e => console.error("Video loop play error:", e));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="hero-video-bg"
        src="/hero-video.mp4"
      />
      {/* Dark overlay specifically for the video so text remains legible */}
      <div className="hero-video-overlay" />
    </>
  );
}
