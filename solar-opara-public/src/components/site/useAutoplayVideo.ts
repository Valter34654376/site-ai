import { useEffect, useRef, useState } from "react";

export function playVideo(player: HTMLVideoElement) {
  if (player.paused) void player.play().catch(() => {});
}

export function toggleVideoPause(player: HTMLVideoElement) {
  const pause = player.autoplay;
  player.autoplay = !pause;
  if (pause) player.pause();
  else playVideo(player);
  return pause;
}

export function useAutoplayVideo(eager = false) {
  const video = useRef<HTMLVideoElement>(null);
  const [loadSource, setLoadSource] = useState(eager);

  useEffect(() => {
    const player = video.current;
    if (!player) return;

    player.defaultMuted = true;
    const resume = () => {
      if (document.hidden || !player.autoplay || !player.hasAttribute("src")) return;
      if (player.controls && player.played.length > 0) return;
      playVideo(player);
    };

    let observer: IntersectionObserver | undefined;
    if (!eager && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        setLoadSource(true);
        resume();
      }, { rootMargin: "240px 0px" });
      observer.observe(player);
    } else {
      setLoadSource(true);
    }

    resume();
    player.addEventListener("canplay", resume);
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      observer?.disconnect();
      player.removeEventListener("canplay", resume);
      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [eager]);

  return { video, loadSource };
}
