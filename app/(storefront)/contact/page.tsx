'use client';

import { motion } from 'framer-motion';
import ContactForm from '@/components/contact/ContactForm';
import FAQ from '@/components/contact/FAQ';

/* ─── Animation variants ─── */

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

/* ─── Contact Info Data ─── */

const contactDetails = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
    label: 'Phone',
    value: '+91 76609 30548',
    href: 'tel:+917660930548',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    label: 'WhatsApp',
    value: 'Chat with us',
    href: 'https://wa.me/917660930548?text=Hi%20Paint%20%26%20Keep!',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    label: 'Instagram',
    value: '@paintandkeep',
    href: 'https://instagram.com/paintandkeep',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    label: 'Email',
    value: 'hello@arixx.in',
    href: 'mailto:hello@arixx.in',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-light via-white to-paint-teal/5 py-16 md:py-20">
        <div className="container-page">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-display-md md:text-display-lg text-brand-dark font-heading"
            >
              Get in Touch
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-text-secondary leading-relaxed"
            >
              Have questions about our kits, birthday packages, or anything else?
              We&apos;d love to hear from you!
            </motion.p>
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div
          className="absolute top-6 right-10 w-14 h-14 bg-paint-orange/15 rounded-blob animate-float"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-6 left-8 w-18 h-18 bg-paint-purple/10 rounded-blob animate-float-delay"
          aria-hidden="true"
        />
      </section>

      {/* Contact Info + Form */}
      <section className="py-16 md:py-20 bg-surface">
        <div className="container-page">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left column: Contact details + Map */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="lg:col-span-2 space-y-8"
            >
              <motion.div variants={fadeInUp}>
                <h2 className="text-xl font-heading font-semibold text-brand-dark mb-6">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {contactDetails.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={
                        item.href.startsWith('http')
                          ? 'noopener noreferrer'
                          : undefined
                      }
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-secondary transition-colors group"
                    >
                      <span className="flex-shrink-0 w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center group-hover:bg-brand-primary group-hover:text-text-inverse transition-colors">
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">
                          {item.label}
                        </p>
                        <p className="text-text-primary font-medium">
                          {item.value}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Google Maps Embed */}
              <motion.div variants={fadeInUp}>
                <h3 className="text-lg font-heading font-semibold text-brand-dark mb-4">
                  Find Us
                </h3>
                <div className="rounded-2xl overflow-hidden shadow-card aspect-[4/3]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d243647.34203494!2d78.24323!3d17.4123487!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99daeaebd2c7%3A0xae93b78392bafbc2!2sHyderabad%2C%20Telangana%2C%20India!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Paint & Keep location - Hyderabad, India"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Right column: Contact Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeInUp}
              className="lg:col-span-3"
            >
              <div className="bg-surface-secondary rounded-2xl p-6 md:p-8 shadow-card">
                <h2 className="text-xl font-heading font-semibold text-brand-dark mb-6">
                  Send Us a Message
                </h2>
                <ContactForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-surface-secondary">
        <div className="container-page">
          <FAQ />
        </div>
      </section>
    </div>
  );
}
