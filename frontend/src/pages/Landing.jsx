import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/lib/api";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Services from "@/components/site/Services";
import Gallery from "@/components/site/Gallery";
import Reviews from "@/components/site/Reviews";
import BookingForm from "@/components/site/BookingForm";
import Footer from "@/components/site/Footer";

export default function Landing() {
  const [settings, setSettings] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get(`${API}/settings`).then((r) => setSettings(r.data));
    axios.get(`${API}/gallery`).then((r) => setGallery(r.data));
    axios.get(`${API}/reviews`).then((r) => setReviews(r.data));
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="landing-loading">
        <div className="h-10 w-10 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C0E]" data-testid="landing-page">
      {settings.is_placeholder && (
        <div
          className="bg-[#FF9500] text-[#0B0C0E] text-center text-xs font-mono-ui uppercase tracking-widest py-1.5 px-4"
          data-testid="placeholder-banner"
        >
          Preview — shop name, logo, contact info & photos are placeholders
        </div>
      )}
      <Header settings={settings} />
      <main>
        <Hero settings={settings} />
        <Services services={settings.services} />
        <Gallery items={gallery} />
        <Reviews items={reviews} />
        <BookingForm settings={settings} />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
