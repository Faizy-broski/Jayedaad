'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAdminBlogViewModel } from '@jayedaad/core';
import { Badge, Button, Input, Pagination } from '@jayedaad/ui-web';
import {
  CheckCircle2,
  FileEdit,
  FolderOpen,
  Newspaper,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from 'lucide-react';
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
  const { posts, total, categories, isLoading, setStatus, remove } = useAdminBlogViewModel({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Published/Draft counts only reflect what's loaded on the current page —
  // GET /blog/admin/all has no status filter to aggregate globally, so
  // these are labeled "this page" rather than implying a sitewide total.
  const pageStats = useMemo(
    () => ({
      published: posts.filter((p) => p.status === 'published').length,
      draft: posts.filter((p) => p.status === 'draft').length,
    }),
    [posts],
  );

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Newspaper} label="Total Posts" value={total} sub="All statuses" />
            <StatTile index={1} icon={CheckCircle2} label="Published" value={pageStats.published} sub="This page" />
            <StatTile index={2} icon={FileEdit} label="Drafts" value={pageStats.draft} sub="This page" />
            <StatTile index={3} icon={FolderOpen} label="Categories" value={categories.length} sub="All time" />
          </>
        )}
      </div>

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
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
            >
              <Newspaper className="h-6 w-6 text-primary" />
            </motion.span>
            <h3 className="text-sm font-semibold text-foreground">No posts found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search ? 'Try a different search.' : 'New posts will appear here once you write one.'}
            </p>
            {!search && (
              <Link
                href="/admin/blog/new"
                className="bg-heading-gradient mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <PlusCircle className="h-4 w-4" />
                Write your first post
              </Link>
            )}
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal>
            <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
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
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.03 }}
                      className="transition-colors hover:bg-muted/30"
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
          </Reveal>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function StatTile({
  index,
  icon: Icon,
  label,
  value,
  sub,
}: {
  index: number;
  icon: typeof Newspaper;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.06 }}>
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}
