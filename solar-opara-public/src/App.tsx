import { useLayoutEffect } from "react";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Film } from "@/components/site/Film";
import { Experiences } from "@/components/site/Experiences";
import { StoryFilm } from "@/components/site/StoryFilm";
import { Gallery } from "@/components/site/Gallery";
import { Visit } from "@/components/site/Visit";
import { Pricing } from "@/components/site/Pricing";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Footer } from "@/components/site/Footer";
import { gallery } from "@/lib/site-content";
import { ReactLenis } from "lenis/react";

export default function App() {
  useLayoutEffect(() => {
    const anchor = window.location.hash.slice(1);
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "instant" });
  }, []);

  return (
    <>
      <ReactLenis
        root
        options={{
          autoRaf: true,
          anchors: { duration: 1.15, offset: -88 },
          lerp: 0.09,
          smoothWheel: true,
          stopInertiaOnNavigate: true,
          syncTouch: false,
          wheelMultiplier: 0.85,
          respectReducedMotion: true,
        }}
      />
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <About />
        <Film />
        <Experiences />
        <StoryFilm />
        <Gallery items={gallery} />
        <Visit />
        <Pricing />
        <BookingFlow />
      </main>
      <Footer />
    </>
  );
}
