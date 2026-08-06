'use client';

import { useParams } from 'next/navigation';
import { useAdminBlogPostViewModel } from '@jayedaad/core';
import { BlogEditorForm } from '@/components/admin/BlogEditorForm';

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const { post, isLoading } = useAdminBlogPostViewModel(params.id);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!post) {
    return <div className="mx-auto max-w-3xl py-12 text-center text-sm text-muted-foreground">Post not found.</div>;
  }

  return <BlogEditorForm existing={post} />;
}
