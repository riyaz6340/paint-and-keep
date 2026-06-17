'use client';

/**
 * CheckoutSteps - Step indicator showing progress through checkout flow.
 * Steps: Address → Payment → Confirmation
 *
 * Requirements: 12.1, 12.2, 12.4, 12.9
 */

import { motion } from 'framer-motion';

export type CheckoutStep = 'address' | 'payment' | 'confirmation';

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
}

const steps: { id: CheckoutStep; label: string; icon: React.ReactNode }[] = [
  {
    id: 'address',
    label: 'Address',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'confirmation',
    label: 'Confirmation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function getStepStatus(stepId: CheckoutStep, currentStep: CheckoutStep): 'completed' | 'current' | 'upcoming' {
  const stepOrder: CheckoutStep[] = ['address', 'payment', 'confirmation'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(stepId);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id, currentStep);

          return (
            <li key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center w-full">
                {/* Step circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: status === 'current' ? 1.1 : 1,
                    backgroundColor:
                      status === 'completed'
                        ? '#28A745'
                        : status === 'current'
                          ? '#FF6B35'
                          : '#F1F3F5',
                    color:
                      status === 'upcoming' ? '#6C757D' : '#FFFFFF',
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center relative z-10"
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {status === 'completed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </motion.div>

                {/* Step label */}
                <span
                  className={`mt-2 text-xs sm:text-sm font-medium ${
                    status === 'current'
                      ? 'text-brand-primary'
                      : status === 'completed'
                        ? 'text-status-success'
                        : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 -mt-6 relative">
                  <div className="absolute inset-0 bg-surface-tertiary rounded-full" />
                  <motion.div
                    initial={false}
                    animate={{
                      width: status === 'completed' ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-y-0 left-0 bg-status-success rounded-full"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
