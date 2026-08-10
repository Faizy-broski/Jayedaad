'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Share2, Heart } from 'lucide-react';

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

// Previously also rendered a Full gallery/Video tour/360 tour/Floor plan/
// Virtual tour tab bar — removed: those media types belong to Projects
// (developments), which have real per-field data for them (floorPlanUrls,
// videoUrl, see ProjectGallery.tsx, now functional there), not to
// individual property listings, which only ever have plain photos.
export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  // Previously a dead button (no onClick at all). Native share sheet where
  // supported (mobile browsers, most desktop browsers now); copies the link
  // instead on browsers without the Web Share API (older desktop Safari/
  // Firefox). window.location.href, not a prop, since this is always
  // rendered client-side on the listing's own detail page.
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the share sheet, or the platform rejected it —
        // not an error worth surfacing either way.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy link — please copy it from the address bar.');
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-1 gap-2 sm:h-[440px] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-auto sm:h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <Image
                src={images[activeIndex]}
                alt={title}
                fill
                priority
                sizes="(min-width: 640px) 60vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              type="button"
              aria-label="Share listing"
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm transition-colors hover:text-primary"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Save listing"
              onClick={() => setSaved((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm transition-colors hover:text-primary"
            >
              <Heart className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:h-full sm:grid-rows-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl transition-opacity sm:aspect-auto sm:h-full ${
                activeIndex === index ? 'ring-2 ring-primary' : 'hover:opacity-90'
              }`}
            >
              <Image src={image} alt="" fill sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
