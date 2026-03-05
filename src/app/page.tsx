import { getContent } from '@/actions/content';
import Navbar from '@/components/site/Navbar';
import Hero from '@/components/site/Hero';
import Features from '@/components/site/Features';
import Activities from '@/components/site/Activities';
import Gallery from '@/components/site/Gallery';
import Packages from '@/components/site/Packages';
import Villas from '@/components/site/Villas';
import Reviews from '@/components/site/Reviews';
import Faq from '@/components/site/Faq';
import BookSection from '@/components/site/BookSection';
import Footer from '@/components/site/Footer';
import NavbarClient from '@/components/site/NavbarClient';
import ChatWidget from '@/components/site/ChatWidget';

export default async function Home() {
  const content = await getContent();
  return (
    <>
      <Navbar content={content} />
      <main>
        <Hero content={content} />
        <Features content={content} />
        <Activities content={content} />
        <Gallery content={content} />
        <Packages content={content} />
        <Villas content={content} />
        <Reviews content={content} />
        <Faq content={content} />
        <BookSection content={content} />
      </main>
      <Footer content={content} />
      <NavbarClient />
      <ChatWidget />
    </>
  );
}
