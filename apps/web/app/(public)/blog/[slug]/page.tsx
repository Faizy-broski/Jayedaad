'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useBlogPostViewModel } from '@jayedaad/core';
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react';

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
      <div className="pt-16 sm:pt-[68px] lg:pt-24">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-16 sm:pt-[68px] lg:pt-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
          <Newspaper className="mb-3 h-10 w-10 text-slate-300" />
          <h1 className="text-lg font-semibold text-slate-900">Article not found</h1>
          <Link href="/blog" className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-[68px] lg:pt-24">
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <Link href="/blog" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Blog
        </Link>

        <div className="mt-6">
          {post.category && (
            <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
              {post.category.name}
            </span>
          )}
          <h1 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">{post.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.publishedAt)}
              </span>
            )}
            {post.readTime && <span>{post.readTime}</span>}
          </div>
        </div>

        {post.coverImageUrl && (
          <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
            <Image src={post.coverImageUrl} alt={post.title} fill sizes="(min-width: 1024px) 768px, 100vw" className="object-cover" />
          </div>
        )}

        {/* content is Super Admin-authored TipTap HTML, not public-submitted —
            same trust level as any other admin-authored field rendered
            elsewhere in this codebase. */}
        <div
          className="prose prose-slate mt-8 max-w-none prose-headings:font-bold prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
