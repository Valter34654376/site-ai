import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Experiences } from "@/components/site/Experiences";
import { Gallery } from "@/components/site/Gallery";
import { Visit } from "@/components/site/Visit";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Footer } from "@/components/site/Footer";
import { gallery } from "@/lib/site-content";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <About />
        <Experiences />
        <Gallery items={gallery} />
        <Visit />
        <BookingFlow />
      </main>
      <Footer />
    </>
  );
}
