'use client';

/**
 * StorySubmissionForm - Form for customers to submit their community story.
 * Includes photo upload, name, age, review text, and artwork image upload.
 * Shows validation errors with data preservation and confirmation on success.
 *
 * Requirements: 8.2, 8.3, 8.4
 */

import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  name: string;
  age: string;
  reviewText: string;
  photo: File | null;
  artwork: File | null;
}

interface FormErrors {
  name?: string;
  age?: string;
  reviewText?: string;
  photo?: string;
  artwork?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ARTWORK_SIZE = 10 * 1024 * 1024; // 10MB

export default function StorySubmissionForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    reviewText: '',
    photo: null,
    artwork: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  // Client-side validation
  function validateForm(): FormErrors {
    const newErrors: FormErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must not exceed 50 characters';
    }

    // Age
    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(formData.age, 10);
      if (isNaN(age) || age < 1 || age > 120) {
        newErrors.age = 'Age must be between 1 and 120';
      }
    }

    // Review text
    if (!formData.reviewText.trim()) {
      newErrors.reviewText = 'Review text is required';
    } else if (formData.reviewText.trim().length < 10) {
      newErrors.reviewText = 'Review text must be at least 10 characters';
    } else if (formData.reviewText.trim().length > 1000) {
      newErrors.reviewText = 'Review text must not exceed 1000 characters';
    }

    // Photo
    if (!formData.photo) {
      newErrors.photo = 'Photo is required';
    } else {
      if (!ALLOWED_TYPES.includes(formData.photo.type)) {
        newErrors.photo = 'Photo must be JPEG or PNG';
      } else if (formData.photo.size > MAX_PHOTO_SIZE) {
        newErrors.photo = 'Photo must not exceed 5MB';
      }
    }

    // Artwork
    if (!formData.artwork) {
      newErrors.artwork = 'Artwork image is required';
    } else {
      if (!ALLOWED_TYPES.includes(formData.artwork.type)) {
        newErrors.artwork = 'Artwork must be JPEG or PNG';
      } else if (formData.artwork.size > MAX_ARTWORK_SIZE) {
        newErrors.artwork = 'Artwork must not exceed 10MB';
      }
    }

    return newErrors;
  }

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>, field: 'photo' | 'artwork') {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('age', formData.age.trim());
      submitData.append('reviewText', formData.reviewText.trim());
      submitData.append('photo', formData.photo!);
      submitData.append('artwork', formData.artwork!);

      const response = await fetch('/api/community-stories', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Server returned validation errors
        if (result.details?.errors) {
          setErrors(result.details.errors as FormErrors);
        } else {
          setErrors({ name: result.message || 'Submission failed. Please try again.' });
        }
        return;
      }

      // Success
      setSubmitSuccess(true);
      setFormData({ name: '', age: '', reviewText: '', photo: null, artwork: null });
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (artworkInputRef.current) artworkInputRef.current.value = '';
    } catch {
      setErrors({ name: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center py-12 px-8"
        role="status"
        aria-live="polite"
      >
        <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-brand-dark mb-2">
          Story Submitted Successfully!
        </h3>
        <p className="text-text-secondary max-w-md mx-auto">
          Thank you for sharing your story! It is now pending review by our team.
          Once approved, it will appear on this page for the community to enjoy.
        </p>
        <button
          type="button"
          onClick={() => setSubmitSuccess(false)}
          className="btn-primary mt-6 px-6 py-2.5"
        >
          Submit Another Story
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6" noValidate>
      <div>
        <h3 className="text-lg font-semibold text-brand-dark mb-1">
          Share Your Story
        </h3>
        <p className="text-sm text-text-secondary">
          Tell us about your Paint &amp; Keep experience! All submissions are reviewed before publishing.
        </p>
      </div>

      {/* Photo upload */}
      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-text-primary mb-1.5">
          Your Photo <span className="text-status-error">*</span>
        </label>
        <input
          ref={photoInputRef}
          id="photo"
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => handleFileChange(e, 'photo')}
          className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 file:cursor-pointer cursor-pointer"
          aria-describedby="photo-hint photo-error"
        />
        <p id="photo-hint" className="mt-1 text-xs text-text-muted">
          JPEG or PNG, max 5MB
        </p>
        <AnimatePresence>
          {errors.photo && (
            <motion.p
              id="photo-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 text-xs text-status-error"
              role="alert"
            >
              {errors.photo}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
          Name <span className="text-status-error">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          maxLength={50}
          placeholder="Your name"
          className={`input w-full ${errors.name ? 'border-status-error focus:ring-status-error' : ''}`}
          aria-invalid={!!errors.name}
          aria-describedby="name-error"
        />
        <AnimatePresence>
          {errors.name && (
            <motion.p
              id="name-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 text-xs text-status-error"
              role="alert"
            >
              {errors.name}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Age */}
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-text-primary mb-1.5">
          Age <span className="text-status-error">*</span>
        </label>
        <input
          id="age"
          name="age"
          type="number"
          value={formData.age}
          onChange={handleInputChange}
          min={1}
          max={120}
          placeholder="Your age"
          className={`input w-full max-w-[120px] ${errors.age ? 'border-status-error focus:ring-status-error' : ''}`}
          aria-invalid={!!errors.age}
          aria-describedby="age-error"
        />
        <AnimatePresence>
          {errors.age && (
            <motion.p
              id="age-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 text-xs text-status-error"
              role="alert"
            >
              {errors.age}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Review Text */}
      <div>
        <label htmlFor="reviewText" className="block text-sm font-medium text-text-primary mb-1.5">
          Your Story <span className="text-status-error">*</span>
        </label>
        <textarea
          id="reviewText"
          name="reviewText"
          value={formData.reviewText}
          onChange={handleInputChange}
          rows={5}
          maxLength={1000}
          placeholder="Share your experience with Paint & Keep (10-1000 characters)"
          className={`input w-full resize-y ${errors.reviewText ? 'border-status-error focus:ring-status-error' : ''}`}
          aria-invalid={!!errors.reviewText}
          aria-describedby="reviewText-hint reviewText-error"
        />
        <div className="flex justify-between mt-1">
          <p id="reviewText-hint" className="text-xs text-text-muted">
            10–1000 characters
          </p>
          <p className="text-xs text-text-muted">
            {formData.reviewText.length}/1000
          </p>
        </div>
        <AnimatePresence>
          {errors.reviewText && (
            <motion.p
              id="reviewText-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 text-xs text-status-error"
              role="alert"
            >
              {errors.reviewText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Artwork upload */}
      <div>
        <label htmlFor="artwork" className="block text-sm font-medium text-text-primary mb-1.5">
          Artwork Image <span className="text-status-error">*</span>
        </label>
        <input
          ref={artworkInputRef}
          id="artwork"
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => handleFileChange(e, 'artwork')}
          className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 file:cursor-pointer cursor-pointer"
          aria-describedby="artwork-hint artwork-error"
        />
        <p id="artwork-hint" className="mt-1 text-xs text-text-muted">
          JPEG or PNG, max 10MB — Photo of your finished artwork
        </p>
        <AnimatePresence>
          {errors.artwork && (
            <motion.p
              id="artwork-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 text-xs text-status-error"
              role="alert"
            >
              {errors.artwork}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full sm:w-auto px-8 py-3"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Your Story'
          )}
        </button>
      </div>
    </form>
  );
}
