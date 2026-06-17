'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'What age groups are your painting kits suitable for?',
    answer:
      'Our kits cater to a wide range of ages! We have kits designed for children aged 4–6, 7–9, 10–12, teens, adults, and even family packs that everyone can enjoy together. Each kit clearly lists the recommended age group and difficulty level.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Standard delivery within India typically takes 5–7 business days. Express shipping options are available at checkout for faster delivery (2–3 business days). You will receive a tracking number once your order is shipped.',
  },
  {
    question: 'Can I return or exchange a kit?',
    answer:
      'Yes! We accept returns and exchanges within 14 days of delivery for unopened kits in their original packaging. If your kit arrives damaged or has missing components, please contact us within 48 hours and we will send a replacement at no extra cost.',
  },
  {
    question: 'Do you offer birthday party packages?',
    answer:
      'Absolutely! We offer curated birthday party packages for groups of all sizes. Each package includes painting kits, party supplies, and optional add-ons like custom name labels and goodie bags. Visit our Birthday Packages page or contact us for a custom quote.',
  },
  {
    question: 'Are your paints safe and non-toxic?',
    answer:
      'Yes, all paints included in our kits are certified non-toxic, washable, and safe for children. They meet international safety standards (EN 71 and ASTM D-4236). Our kits are designed with child safety as the top priority.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section aria-labelledby="faq-heading" className="w-full">
      <h2
        id="faq-heading"
        className="text-display-sm text-brand-dark text-center mb-8"
      >
        Frequently Asked Questions
      </h2>
      <div className="max-w-3xl mx-auto space-y-3">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="bg-surface rounded-2xl shadow-card overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between px-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
              id={`faq-question-${index}`}
            >
              <span className="font-heading font-semibold text-text-primary text-lg pr-4">
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 text-brand-primary"
                aria-hidden="true"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-text-secondary leading-relaxed">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
