'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useBlogViewModel } from '@jayedaad/core';
import { ArticleCard } from './ArticleCard';
import { Reveal } from '@/components/Reveal';

// Real data now (was a static `articles` prop backed by data/articles.ts
// mock content) — latest 3 published posts from the Blog CMS, shared
// between the homepage and the Services page.
export function MarketInsights() {
  const { posts, isLoading } = useBlogViewModel({ limit: 3 });

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">Market Insights</span>
            <h2 className="mt-2 pb-2 text-3xl font-bold text-heading-gradient sm:text-4xl">Editorial. Original. Useful.</h2>
          </Reveal>

          <Link
            href="/blog"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[#00A24F] hover:underline sm:flex"
          >
            All articles
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No articles published yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Reveal key={post.id} delay={(index % 3) * 0.08}>
                <ArticleCard post={post} />
              </Reveal>
            ))}
          </div>
        )}

        <Link
          href="/blog"
          className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
        >
          All articles
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
