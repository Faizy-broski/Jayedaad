'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBlogViewModel } from '@jayedaad/core';
import { ArrowRight, Calendar, Newspaper } from 'lucide-react';
import { PageHero } from '@/components/shared/PageHero';
import { Reveal } from '@/components/Reveal';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Real-data counterpart to MarketInsights' homepage teaser — the full
// published-posts list, reusing ArticleCard's visual shape inline (can't
// reuse ArticleCard itself: it takes the static-mock `Article` type, this
// page uses the real `BlogPost` model).
export default function BlogListPage() {
  const { posts, categories, isLoading } = useBlogViewModel();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(
    () => (activeCategory ? posts.filter((post) => post.category?.id === activeCategory) : posts),
    [posts, activeCategory],
  );

  const [featured, ...rest] = filteredPosts;

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
          {categories.length > 0 && (
            <Reveal className="mb-10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === null
                    ? 'bg-heading-gradient text-primary-foreground'
                    : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    activeCategory === category.id
                      ? 'bg-heading-gradient text-primary-foreground'
                      : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </Reveal>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-slate-100">
                  <div className="aspect-[4/3] w-full animate-pulse bg-slate-100" />
                  <div className="space-y-2 p-5">
                    <div className="h-2.5 w-16 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Newspaper className="mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-semibold text-slate-900">No articles yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                {activeCategory ? 'No articles in this category yet.' : 'Check back soon for property tips and market insights.'}
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <Reveal className="mb-10">
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg lg:grid-cols-2"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 lg:aspect-auto">
                      {featured.coverImageUrl ? (
                        <Image
                          src={featured.coverImageUrl}
                          alt={featured.title}
                          fill
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          priority
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Newspaper className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                      {featured.category && (
                        <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
                          {featured.category.name}
                        </span>
                      )}
                      <h2 className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">{featured.title}</h2>
                      {featured.excerpt && <p className="line-clamp-3 text-sm text-slate-500 sm:text-base">{featured.excerpt}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {featured.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(featured.publishedAt)}
                          </span>
                        )}
                        {featured.readTime && <span>{featured.readTime}</span>}
                      </div>
                      <span className="mt-2 flex items-center gap-1 text-sm font-medium text-primary">
                        Read article
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, index) => (
                    <Reveal key={post.id} delay={(index % 3) * 0.08}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
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
                          <h3 className="text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-primary">
                            {post.title}
                          </h3>
                          {post.excerpt && <p className="line-clamp-2 text-sm text-slate-500">{post.excerpt}</p>}
                          <div className="mt-auto flex items-center justify-between pt-1 text-xs text-slate-400">
                            {post.readTime && <span>{post.readTime}</span>}
                            <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
