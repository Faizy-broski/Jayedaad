'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useBlogViewModel } from '@jayedaad/core';
import { Newspaper } from 'lucide-react';
import { PageHero } from '@/components/shared/PageHero';
import { Reveal } from '@/components/Reveal';

// Real-data counterpart to MarketInsights' homepage teaser — the full
// published-posts list, reusing ArticleCard's visual shape inline (can't
// reuse ArticleCard itself: it takes the static-mock `Article` type, this
// page uses the real `BlogPost` model).
export default function BlogListPage() {
  const { posts, isLoading } = useBlogViewModel();

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={'Property tips.\nMarket insights.'}
        description="Guides, market outlooks, and practical advice for buying, selling, and renting in Pakistan."
        backgroundImage="/images/about-us/about-us-hero.jpg"
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Newspaper className="mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-semibold text-slate-900">No articles yet</h3>
              <p className="mt-1 text-xs text-slate-500">Check back soon for property tips and market insights.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <Reveal key={post.id} delay={(index % 3) * 0.08}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      {post.coverImageUrl ? (
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, 90vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Newspaper className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-5">
                      {post.category && (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                          {post.category.name}
                        </span>
                      )}
                      <h3 className="text-base font-semibold leading-snug text-slate-900">{post.title}</h3>
                      {post.excerpt && <p className="line-clamp-2 text-sm text-slate-500">{post.excerpt}</p>}
                      {post.readTime && <span className="mt-auto text-xs text-slate-400">{post.readTime}</span>}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
