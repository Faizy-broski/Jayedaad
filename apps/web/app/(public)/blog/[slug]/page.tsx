'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useBlogPostViewModel } from '@jayedaad/core';
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, Clock, Newspaper } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Client-fetched (not generateStaticParams + mock array like
// listings/[slug] and developments/[slug]) because posts are real,
// admin-authored data that changes at runtime — same reasoning as every
// other viewmodel-backed detail page in this codebase.
export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const { post, isLoading } = useBlogPostViewModel(params.slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-24 sm:pb-10 sm:pt-28 lg:pt-32">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-6 h-3 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-3 h-9 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="mt-2 h-9 w-2/3 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-8 aspect-video w-full animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-24 text-center sm:pt-28 lg:pt-32">
        <Newspaper className="mb-3 h-10 w-10 text-slate-300" />
        <h1 className="text-lg font-semibold text-slate-900">Article not found</h1>
        <p className="mt-1 text-sm text-slate-500">This article may have been unpublished or moved.</p>
        <Link
          href="/blog"
          className="mt-5 flex items-center gap-1.5 rounded-full bg-heading-gradient px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    // pt is clearance for the Header, which is fixed/floating (out of flow)
    // on this route instead of the plain in-flow sticky bar — see
    // isHeroRoute() in components/layout/Header.tsx.
    <div className="pb-16 pt-24 sm:pb-20 sm:pt-28 lg:pt-32">
      <article className="mx-auto max-w-3xl px-4">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/blog" className="hover:text-primary">
            Blog
          </Link>
          {post.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span>{post.category.name}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="line-clamp-1 text-slate-700">{post.title}</span>
        </nav>

        <Reveal>
          {post.category && (
            <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">{post.category.name}</span>
          )}
          <h1 className="heading-1 mt-2 text-slate-900">{post.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.publishedAt)}
              </span>
            )}
            {post.readTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            )}
          </div>
        </Reveal>

        {post.coverImageUrl && (
          <Reveal delay={0.05}>
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 768px, 100vw"
                priority
                className="object-cover"
              />
            </div>
          </Reveal>
        )}

        <Reveal delay={0.1}>
          {/* content is Super Admin-authored TipTap HTML, not public-submitted —
              same trust level as any other admin-authored field rendered
              elsewhere in this codebase. */}
          <div
            className="prose prose-slate mt-8 max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-primary prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </Reveal>

        <Reveal delay={0.1} className="mt-12 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <Link href="/blog" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Blog
          </Link>
          <Link
            href="/listings"
            className="flex items-center gap-1.5 rounded-full bg-heading-gradient px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse listings
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Reveal>
      </article>
    </div>
  );
}
