'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Image as ImageIcon, Film, LayoutPanelLeft, FileText, Share2, Heart } from 'lucide-react';

const GALLERY_TABS = [
  { label: 'Full gallery', icon: ImageIcon },
  { label: 'Floor plan', icon: LayoutPanelLeft },
  { label: 'Video tour', icon: Film },
  { label: 'Brochure', icon: FileText },
] as const;

interface ProjectGalleryProps {
  images: string[];
  title: string;
}

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<(typeof GALLERY_TABS)[number]['label']>('Full gallery');
  const [saved, setSaved] = useState(false);

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
              aria-label="Share project"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm transition-colors hover:text-primary"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Save project"
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {GALLERY_TABS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(label)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === label
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
