import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import type { Article } from '@/lib/types';
import { Reveal } from '@/components/Reveal';

interface MarketInsightsProps {
  articles: Article[];
}

export function MarketInsights({ articles }: MarketInsightsProps) {
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
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            All articles
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Reveal key={article.id} delay={(index % 3) * 0.08}>
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>

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