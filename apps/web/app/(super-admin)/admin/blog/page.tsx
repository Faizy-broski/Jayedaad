'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAdminBlogViewModel } from '@jayedaad/core';
import { Badge, Button, Input } from '@jayedaad/ui-web';
import { ChevronLeft, ChevronRight, Newspaper, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Real `<table>` + server-side pagination/search (see
// BlogRepository.listAll's count/range on the API side) instead of an
// unbounded card grid — a platform with thousands of posts can't load
// every row into one page. Search/Edit/New routes to a dedicated page
// (/admin/blog/[id], /admin/blog/new) rather than a Modal — a rich-text
// editor doesn't fit a Modal well.
export default function BlogAdminPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { posts, total, isLoading, setStatus, remove } = useAdminBlogViewModel({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleToggleStatus(id: string, current: 'draft' | 'published') {
    const next = current === 'published' ? 'draft' : 'published';
    setStatus.mutate(
      { id, status: next },
      {
        onSuccess: () => toast.success(next === 'published' ? 'Published.' : 'Unpublished — back to draft.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('Deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Newspaper className="h-4 w-4" />
              Blog management
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Blog</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{total}</span> {total === 1 ? 'post' : 'posts'} total.
            </p>
          </div>
          <Link
            href="/admin/blog/new"
            className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            New Post
          </Link>
        </div>
      </Reveal>

      <Reveal>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search by title…" className="pl-9" />
        </div>
      </Reveal>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-muted/40" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <Newspaper className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No posts found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search ? 'Try a different search.' : 'New posts will appear here once you write one.'}
            </p>
          </div>
        </Reveal>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Post</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post, index) => (
                  <motion.tr
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(index, 10) * 0.02 }}
                    className="hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground/40">
                          {post.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.coverImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Newspaper className="h-4 w-4" />
                          )}
                        </span>
                        <span className="line-clamp-2 max-w-xs font-medium text-foreground">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{post.category?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={post.status === 'published' ? 'success' : 'warning'}>{post.status}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(post.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/blog/${post.id}`}>
                          <Button size="sm" variant="outline">
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => handleToggleStatus(post.id, post.status)}>
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(post.id, post.title)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
