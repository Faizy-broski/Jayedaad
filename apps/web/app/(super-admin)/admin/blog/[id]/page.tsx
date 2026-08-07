'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Newspaper } from 'lucide-react';
import { useAdminBlogPostViewModel } from '@jayedaad/core';
import { BlogEditorForm } from '@/components/admin/BlogEditorForm';
import { Reveal } from '@/components/Reveal';

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const { post, isLoading } = useAdminBlogPostViewModel(params.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
    );
  }
  if (!post) {
    return (
      <Reveal>
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Newspaper className="h-6 w-6 text-primary" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">Post not found</h3>
          <p className="mt-1 text-xs text-muted-foreground">It may have been deleted.</p>
          <Link href="/admin/blog" className="mt-4 text-sm font-medium text-primary hover:underline">
            Back to posts
          </Link>
        </div>
      </Reveal>
    );
  }

  return <BlogEditorForm existing={post} />;
}
