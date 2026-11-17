import { useEffect, useState } from "react";

export function BrandIntro() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let frame = 0;
    const start = () => {
      frame = requestAnimationFrame(() => setRunning(true));
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className={`brand-intro ${running ? "is-running" : ""}`}
      aria-hidden="true"
    >
      <div className="brand-intro-lockup">
        <img
          src="/media/brand/solar-opara-opening-mark.svg"
          width="512"
          height="512"
          alt=""
        />
        <div>
          <strong>Solar Opará</strong>
          <span>Pirapora · Minas Gerais</span>
        </div>
      </div>
      <p>Espaço para celebrações</p>
    </div>
  );
}
