'use client';

/**
 * Paint & Keep - Admin CMS Page
 *
 * Content Management System admin interface for editing homepage sections
 * and static page content without code changes.
 *
 * Sections:
 * - Hero: headline, subheadline, images, CTAs
 * - Best Sellers: select featured products
 * - About: brand story, mission, vision, team photos
 * - FAQ: add/edit/delete/reorder entries
 *
 * Supports preview mode and publish with validation.
 *
 * Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8
 */

import { useState, useEffect, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────── */

interface HeroCTA {
  label: string;
  url: string;
}

interface HeroContent {
  headline: string;
  subheadline: string;
  images: string[];
  ctas: HeroCTA[];
}

interface BestSellersContent {
  productIds: string[];
}

interface AboutContent {
  brandStory: string;
  mission: string;
  vision: string;
  teamPhotos: string[];
}

interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface FAQContent {
  entries: FAQEntry[];
}

interface CMSSection {
  id?: string;
  section: string;
  content: HeroContent | BestSellersContent | AboutContent | FAQContent | null;
  version: number;
  isPublished: boolean;
  publishedAt: string | null;
  updatedBy: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ProductOption {
  id: string;
  name: string;
  slug: string;
}

/* ─── Constants ────────────────────────────────────────────────────────── */

type TabType = 'hero' | 'best_sellers' | 'about' | 'faq';

const TABS: { key: TabType; label: string }[] = [
  { key: 'hero', label: 'Hero Section' },
  { key: 'best_sellers', label: 'Best Sellers' },
  { key: 'about', label: 'About Page' },
  { key: 'faq', label: 'FAQ' },
];

/* ─── Main Page Component ──────────────────────────────────────────────── */

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<TabType>('hero');
  const [sections, setSections] = useState<Record<string, CMSSection>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch all sections on mount
  const fetchSections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/cms');
      if (!res.ok) throw new Error('Failed to load CMS content');
      const data = await res.json();

      const sectionsMap: Record<string, CMSSection> = {};
      for (const section of data.sections) {
        sectionsMap[section.section] = section;
      }
      setSections(sectionsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // Clear messages on tab change
  useEffect(() => {
    setSuccessMessage(null);
    setValidationErrors([]);
    setError(null);
  }, [activeTab]);

  // Save draft
  const handleSave = useCallback(
    async (content: unknown) => {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      setValidationErrors([]);

      try {
        const res = await fetch(`/api/admin/cms/${activeTab}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, publish: false }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save');

        setSections((prev) => ({
          ...prev,
          [activeTab]: data.section,
        }));
        setSuccessMessage('Draft saved successfully');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setIsSaving(false);
      }
    },
    [activeTab]
  );

  // Publish
  const handlePublish = useCallback(
    async (content: unknown) => {
      setIsPublishing(true);
      setError(null);
      setSuccessMessage(null);
      setValidationErrors([]);

      try {
        const res = await fetch(`/api/admin/cms/${activeTab}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, publish: true }),
        });

        const data = await res.json();

        if (res.status === 422) {
          setValidationErrors(data.validationErrors || []);
          setError('Cannot publish: validation errors found');
          // Still update the section (saved as draft)
          if (data.section) {
            setSections((prev) => ({
              ...prev,
              [activeTab]: data.section,
            }));
          }
          return;
        }

        if (!res.ok) throw new Error(data.message || 'Failed to publish');

        setSections((prev) => ({
          ...prev,
          [activeTab]: data.section,
        }));
        setSuccessMessage('Published! Changes will reflect on storefront within 60 seconds.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Publish failed');
      } finally {
        setIsPublishing(false);
      }
    },
    [activeTab]
  );

  const currentSection = sections[activeTab];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit homepage sections and page content. Changes are saved as drafts until published.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {sections[tab.key]?.isPublished && (
                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-400" title="Published" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <p className="font-medium mb-2">Validation errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((ve, idx) => (
              <li key={idx}>
                <span className="font-mono text-xs">{ve.field}</span>: {ve.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : (
        <>
          {/* Section Editors */}
          {activeTab === 'hero' && (
            <HeroEditor
              content={currentSection?.content as HeroContent | null}
              onSave={handleSave}
              onPublish={handlePublish}
              isSaving={isSaving}
              isPublishing={isPublishing}
              isPreviewOpen={isPreviewOpen}
              setIsPreviewOpen={setIsPreviewOpen}
            />
          )}
          {activeTab === 'best_sellers' && (
            <BestSellersEditor
              content={currentSection?.content as BestSellersContent | null}
              onSave={handleSave}
              onPublish={handlePublish}
              isSaving={isSaving}
              isPublishing={isPublishing}
            />
          )}
          {activeTab === 'about' && (
            <AboutEditor
              content={currentSection?.content as AboutContent | null}
              onSave={handleSave}
              onPublish={handlePublish}
              isSaving={isSaving}
              isPublishing={isPublishing}
              isPreviewOpen={isPreviewOpen}
              setIsPreviewOpen={setIsPreviewOpen}
            />
          )}
          {activeTab === 'faq' && (
            <FAQEditor
              content={currentSection?.content as FAQContent | null}
              onSave={handleSave}
              onPublish={handlePublish}
              isSaving={isSaving}
              isPublishing={isPublishing}
            />
          )}

          {/* Version info */}
          {currentSection && (
            <div className="mt-6 text-xs text-gray-400 flex gap-4">
              <span>Version: {currentSection.version}</span>
              {currentSection.publishedAt && (
                <span>Last published: {new Date(currentSection.publishedAt).toLocaleString()}</span>
              )}
              <span>
                Status:{' '}
                <span className={currentSection.isPublished ? 'text-green-600' : 'text-yellow-600'}>
                  {currentSection.isPublished ? 'Published' : 'Draft'}
                </span>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}


/* ─── Hero Section Editor ──────────────────────────────────────────────── */

interface EditorProps {
  onSave: (content: unknown) => Promise<void>;
  onPublish: (content: unknown) => Promise<void>;
  isSaving: boolean;
  isPublishing: boolean;
}

interface HeroEditorProps extends EditorProps {
  content: HeroContent | null;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
}

function HeroEditor({ content, onSave, onPublish, isSaving, isPublishing, isPreviewOpen, setIsPreviewOpen }: HeroEditorProps) {
  const [headline, setHeadline] = useState(content?.headline || '');
  const [subheadline, setSubheadline] = useState(content?.subheadline || '');
  const [images, setImages] = useState<string[]>(content?.images || []);
  const [ctas, setCtas] = useState<HeroCTA[]>(content?.ctas || []);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (content) {
      setHeadline(content.headline || '');
      setSubheadline(content.subheadline || '');
      setImages(content.images || []);
      setCtas(content.ctas || []);
    }
  }, [content]);

  const getContent = (): HeroContent => ({
    headline,
    subheadline,
    images,
    ctas,
  });

  const addImage = () => {
    if (newImageUrl.trim() && images.length < 5) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addCTA = () => {
    if (ctas.length < 3) {
      setCtas([...ctas, { label: '', url: '' }]);
    }
  };

  const updateCTA = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...ctas];
    updated[index] = { ...updated[index], [field]: value };
    setCtas(updated);
  };

  const removeCTA = (index: number) => {
    setCtas(ctas.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Preview Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          {isPreviewOpen ? 'Close Preview' : 'Preview'}
        </button>
      </div>

      {/* Preview Panel */}
      {isPreviewOpen && (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Preview</h3>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">{headline || '(No headline)'}</h1>
            <p className="text-lg text-gray-600 mt-2">{subheadline || '(No subheadline)'}</p>
            {images.length > 0 && (
              <div className="flex gap-2 mt-4">
                {images.map((img, i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200 rounded border text-xs flex items-center justify-center overflow-hidden">
                    <span className="truncate px-1">{img.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            )}
            {ctas.length > 0 && (
              <div className="flex gap-2 mt-4">
                {ctas.map((cta, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                    {cta.label || '(no label)'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Headline <span className="text-gray-400">({headline.length}/100)</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value.slice(0, 100))}
          placeholder="e.g. LESS SCREEN TIME. MORE CREATIVE TIME."
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
          maxLength={100}
        />
      </div>

      {/* Subheadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subheadline <span className="text-gray-400">({subheadline.length}/250)</span>
        </label>
        <textarea
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value.slice(0, 250))}
          placeholder="Describe the brand value proposition..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
          maxLength={250}
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hero Images <span className="text-gray-400">({images.length}/5)</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">JPEG, PNG, or WebP. Max 5MB each.</p>
        <div className="space-y-2">
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-600 truncate bg-gray-50 px-3 py-1.5 rounded">
                {img}
              </span>
              <button
                onClick={() => removeImage(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Image URL..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                onClick={addImage}
                disabled={!newImageUrl.trim()}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Call-to-Action Buttons <span className="text-gray-400">({ctas.length}/3)</span>
        </label>
        <div className="space-y-3">
          {ctas.map((cta, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <input
                type="text"
                value={cta.label}
                onChange={(e) => updateCTA(i, 'label', e.target.value.slice(0, 40))}
                placeholder="Button label (max 40)"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
                maxLength={40}
              />
              <input
                type="text"
                value={cta.url}
                onChange={(e) => updateCTA(i, 'url', e.target.value)}
                placeholder="Target URL"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                onClick={() => removeCTA(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          {ctas.length < 3 && (
            <button
              onClick={addCTA}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              + Add CTA Button
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => onSave(getContent())}
          disabled={isSaving || isPublishing}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => onPublish(getContent())}
          disabled={isSaving || isPublishing}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}


/* ─── Best Sellers Editor ──────────────────────────────────────────────── */

interface BestSellersEditorProps extends EditorProps {
  content: BestSellersContent | null;
}

function BestSellersEditor({ content, onSave, onPublish, isSaving, isPublishing }: BestSellersEditorProps) {
  const [productIds, setProductIds] = useState<string[]>(content?.productIds || []);
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    if (content) {
      setProductIds(content.productIds || []);
    }
  }, [content]);

  // Fetch available products
  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const res = await fetch('/api/products?limit=50&sort=popular');
        if (res.ok) {
          const data = await res.json();
          setAvailableProducts(
            (data.products || []).map((p: { id: string; name: string; slug: string }) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
            }))
          );
        }
      } catch {
        // silently fail — products can be added by ID
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  const getContent = (): BestSellersContent => ({ productIds });

  const toggleProduct = (productId: string) => {
    if (productIds.includes(productId)) {
      setProductIds(productIds.filter((id) => id !== productId));
    } else if (productIds.length < 12) {
      setProductIds([...productIds, productId]);
    }
  };

  const filteredProducts = availableProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Featured Products <span className="text-gray-400">({productIds.length}/12, min 4)</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Select 4-12 products to feature in the Best Sellers section.
        </p>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 mb-3 text-sm"
        />

        {/* Selected Products */}
        {productIds.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Selected:</p>
            <div className="flex flex-wrap gap-2">
              {productIds.map((id) => {
                const product = availableProducts.find((p) => p.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {product?.name || id}
                    <button
                      onClick={() => toggleProduct(id)}
                      className="ml-1 text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Products List */}
        {isLoadingProducts ? (
          <div className="text-sm text-gray-400 py-4">Loading products...</div>
        ) : (
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredProducts.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">No products found</p>
            ) : (
              filteredProducts.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={productIds.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    disabled={!productIds.includes(product.id) && productIds.length >= 12}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{product.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => onSave(getContent())}
          disabled={isSaving || isPublishing}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => onPublish(getContent())}
          disabled={isSaving || isPublishing}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}


/* ─── About Page Editor ────────────────────────────────────────────────── */

interface AboutEditorProps extends EditorProps {
  content: AboutContent | null;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
}

function AboutEditor({ content, onSave, onPublish, isSaving, isPublishing, isPreviewOpen, setIsPreviewOpen }: AboutEditorProps) {
  const [brandStory, setBrandStory] = useState(content?.brandStory || '');
  const [mission, setMission] = useState(content?.mission || '');
  const [vision, setVision] = useState(content?.vision || '');
  const [teamPhotos, setTeamPhotos] = useState<string[]>(content?.teamPhotos || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  useEffect(() => {
    if (content) {
      setBrandStory(content.brandStory || '');
      setMission(content.mission || '');
      setVision(content.vision || '');
      setTeamPhotos(content.teamPhotos || []);
    }
  }, [content]);

  const getContent = (): AboutContent => ({
    brandStory,
    mission,
    vision,
    teamPhotos,
  });

  const addPhoto = () => {
    if (newPhotoUrl.trim() && teamPhotos.length < 20) {
      setTeamPhotos([...teamPhotos, newPhotoUrl.trim()]);
      setNewPhotoUrl('');
    }
  };

  const removePhoto = (index: number) => {
    setTeamPhotos(teamPhotos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Preview Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          {isPreviewOpen ? 'Close Preview' : 'Preview'}
        </button>
      </div>

      {isPreviewOpen && (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Preview</h3>
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-400">Brand Story</h4>
              <p className="text-sm text-gray-700 mt-1">{brandStory || '(empty)'}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-400">Mission</h4>
              <p className="text-sm text-gray-700 mt-1">{mission || '(empty)'}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-400">Vision</h4>
              <p className="text-sm text-gray-700 mt-1">{vision || '(empty)'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Brand Story */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Brand Story <span className="text-gray-400">({brandStory.length}/5000)</span>
        </label>
        <textarea
          value={brandStory}
          onChange={(e) => setBrandStory(e.target.value.slice(0, 5000))}
          placeholder="Tell the Paint & Keep brand story..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
          maxLength={5000}
        />
      </div>

      {/* Mission */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mission <span className="text-gray-400">({mission.length}/1000)</span>
        </label>
        <textarea
          value={mission}
          onChange={(e) => setMission(e.target.value.slice(0, 1000))}
          placeholder="Our mission is..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
          maxLength={1000}
        />
      </div>

      {/* Vision */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vision <span className="text-gray-400">({vision.length}/1000)</span>
        </label>
        <textarea
          value={vision}
          onChange={(e) => setVision(e.target.value.slice(0, 1000))}
          placeholder="Our vision is..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
          maxLength={1000}
        />
      </div>

      {/* Team Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team Photos <span className="text-gray-400">({teamPhotos.length}/20)</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">JPEG, PNG, or WebP. Max 5MB each.</p>
        <div className="space-y-2">
          {teamPhotos.map((photo, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-600 truncate bg-gray-50 px-3 py-1.5 rounded">
                {photo}
              </span>
              <button
                onClick={() => removePhoto(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          {teamPhotos.length < 20 && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Photo URL..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                onClick={addPhoto}
                disabled={!newPhotoUrl.trim()}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => onSave(getContent())}
          disabled={isSaving || isPublishing}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => onPublish(getContent())}
          disabled={isSaving || isPublishing}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}


/* ─── FAQ Editor ───────────────────────────────────────────────────────── */

interface FAQEditorProps extends EditorProps {
  content: FAQContent | null;
}

function FAQEditor({ content, onSave, onPublish, isSaving, isPublishing }: FAQEditorProps) {
  const [entries, setEntries] = useState<FAQEntry[]>(content?.entries || []);

  useEffect(() => {
    if (content) {
      setEntries(content.entries || []);
    }
  }, [content]);

  const getContent = (): FAQContent => ({ entries });

  const addEntry = () => {
    if (entries.length >= 50) return;
    const newEntry: FAQEntry = {
      id: `faq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      question: '',
      answer: '',
      order: entries.length,
    };
    setEntries([...entries, newEntry]);
  };

  const updateEntry = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const deleteEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    // Re-index order
    setEntries(updated.map((e, i) => ({ ...e, order: i })));
  };

  const moveEntry = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === entries.length - 1) return;

    const updated = [...entries];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    // Re-index order
    setEntries(updated.map((e, i) => ({ ...e, order: i })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            FAQ Entries <span className="text-gray-400">({entries.length}/50)</span>
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            Add, edit, delete, and reorder FAQ entries for the Contact page.
          </p>
        </div>
        {entries.length < 50 && (
          <button
            onClick={addEntry}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            + Add Entry
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No FAQ entries yet. Click &ldquo;Add Entry&rdquo; to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">
                  #{index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveEntry(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveEntry(index, 'down')}
                    disabled={index === entries.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => deleteEntry(index)}
                    className="p-1 text-red-400 hover:text-red-600 ml-2"
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Question <span className="text-gray-400">({entry.question.length}/200)</span>
                </label>
                <input
                  type="text"
                  value={entry.question}
                  onChange={(e) => updateEntry(index, 'question', e.target.value.slice(0, 200))}
                  placeholder="Enter question..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Answer <span className="text-gray-400">({entry.answer.length}/2000)</span>
                </label>
                <textarea
                  value={entry.answer}
                  onChange={(e) => updateEntry(index, 'answer', e.target.value.slice(0, 2000))}
                  placeholder="Enter answer..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                  maxLength={2000}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => onSave(getContent())}
          disabled={isSaving || isPublishing}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => onPublish(getContent())}
          disabled={isSaving || isPublishing}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
