'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Film, LayoutPanelLeft, FileText, ExternalLink, Share2, Heart } from 'lucide-react';

type TabId = 'gallery' | 'floorPlan' | 'video';

interface ProjectGalleryProps {
  images: string[];
  title: string;
  /** project.floorPlanUrls — tab only shown when non-empty. */
  floorPlanUrls?: string[];
  /** project.videoUrl — free-text URL (ProjectForm.tsx's "Video / 3D
   *  Walkthrough URL" field), not guaranteed to be YouTube/Vimeo. Tab only
   *  shown when set. */
  videoUrl?: string | null;
  /** project.brochureUrl — opened directly in a new tab, not rendered inline
   *  (it's a PDF, not a display mode the media area can switch to). */
  brochureUrl?: string | null;
}

// Converts a YouTube/Vimeo watch/share URL into its embeddable iframe src.
// videoUrl is plain free text an admin pasted into ProjectForm.tsx, so this
// has to tolerate whatever URL shape actually got saved, not just one host.
function toEmbedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

// Previously GALLERY_TABS just toggled active/inactive styling — clicking
// "Floor plan"/"Video tour" never actually changed what the media area
// showed, it always kept rendering the same `images` gallery underneath.
// Now: Full gallery/Floor plan swap which real image array drives the main
// viewer + thumbnails, Video tour renders a real embed (or a fallback
// player/link), and tabs for data a project doesn't have are hidden rather
// than shown as more dead UI. Brochure isn't a display mode at all — it's a
// PDF, so it just opens in a new tab.
export function ProjectGallery({ images, title, floorPlanUrls = [], videoUrl, brochureUrl }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('gallery');
  const [saved, setSaved] = useState(false);

  const tabs: { id: TabId; label: string; icon: typeof ImageIcon }[] = [
    { id: 'gallery', label: 'Full gallery', icon: ImageIcon },
    ...(floorPlanUrls.length > 0 ? ([{ id: 'floorPlan', label: 'Floor plan', icon: LayoutPanelLeft }] as const) : []),
    ...(videoUrl ? ([{ id: 'video', label: 'Video tour', icon: Film }] as const) : []),
  ];

  function selectTab(id: TabId) {
    setActiveTab(id);
    setActiveIndex(0);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the share sheet — not an error worth surfacing.
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

  const displayImages = activeTab === 'floorPlan' ? floorPlanUrls : images;
  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : null;

  const overlayButtons = (
    <div className="absolute right-3 top-3 z-10 flex gap-2">
      <button
        type="button"
        aria-label="Share project"
        onClick={handleShare}
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
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {activeTab === 'video' && videoUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${title} video tour`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            // Not a recognized YouTube/Vimeo URL — fall back to a plain
            // HTML5 player, which works for a direct video file URL.
            <video src={videoUrl} controls className="absolute inset-0 h-full w-full" />
          )}
          {overlayButtons}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:h-[440px] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-auto sm:h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${activeIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <Image
                  src={displayImages[activeIndex] ?? displayImages[0]}
                  alt={title}
                  fill
                  priority
                  sizes="(min-width: 640px) 60vw, 100vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            {overlayButtons}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:h-full sm:grid-rows-2">
            {displayImages.map((image, index) => (
              <button
                key={image}
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
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        {brochureUrl && (
          <a
            href={brochureUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300"
          >
            <FileText className="h-3.5 w-3.5" />
            Brochure
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
