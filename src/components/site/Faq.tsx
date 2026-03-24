'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence, type Variants } from 'framer-motion';
import { SiteContent } from '@/lib/types';
import { ChevronDown } from 'lucide-react';
import SectionBackground from './SectionBackground';

const CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Faq({ content }: { content: SiteContent }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section
      className="py-24 relative overflow-hidden"
      id="faq"
      style={{ background: 'linear-gradient(to bottom, #f5f9f7, #eaf5f0)' }}
    >
      <SectionBackground
        src={content.faqBackground}
        overlayStyle={{
          background:
            'linear-gradient(180deg, rgba(186,230,253,0.5) 0%, rgba(224,242,254,0.45) 50%, rgba(245,249,247,0.95) 100%)',
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
        <motion.div
          ref={ref}
          variants={CONTAINER}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Header */}
          <motion.div variants={ITEM} className="text-center mb-14">
            <div className="nature-glass inline-flex rounded-full px-4 py-1.5 mb-5">
              <span className="font-body font-medium text-xs text-primary tracking-widest uppercase">
                Got Questions?
              </span>
            </div>
            <h2
              className="font-heading italic mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#152033' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="font-body font-light text-sm leading-relaxed" style={{ color: 'rgba(21,32,51,0.6)' }}>
              Everything you need before booking. Can&apos;t find an answer?{' '}
              <a href="https://m.me/kamplambingan" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                Message us.
              </a>
            </p>
          </motion.div>

          {/* Accordion */}
          <div className="space-y-3">
            {content.faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.div key={i} variants={ITEM} className="nature-glass rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left select-none transition-colors hover:bg-primary/5"
                  >
                    <span className="font-body font-medium text-sm" style={{ color: '#152033' }}>
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ChevronDown className="w-4 h-4 text-primary flex-shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p
                          className="px-5 pb-5 font-body font-light text-sm leading-relaxed"
                          style={{ color: 'rgba(21,32,51,0.68)' }}
                        >
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
