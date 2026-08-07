'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import toast from 'react-hot-toast';
import { BlogPost, slugify, useAdminBlogViewModel } from '@jayedaad/core';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Textarea } from '@jayedaad/ui-web';
import {
  AlignLeft,
  Bold,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderOpen,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ImageIcon,
  Newspaper,
  PenLine,
  Quote,
  Send,
  Type,
  Undo2,
  Redo2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

// Same 6-question wizard shape as the agent listing submission flow and
// ProjectForm (apps/web/app/(agent)/submit/page.tsx, components/projects/
// ProjectForm.tsx) — step pills, sliding indicator, sticky Back/Continue
// footer. Nothing here changes what data is collected or how it's
// submitted, only how it's grouped and presented (previously one long
// scroll of cards).
const STEPS = [
  { key: 'details', label: 'Details', question: 'Post details' },
  { key: 'category', label: 'Category', question: 'Category & metadata' },
  { key: 'excerpt', label: 'Excerpt', question: 'Excerpt' },
  { key: 'cover', label: 'Cover', question: 'Cover image' },
  { key: 'content', label: 'Content', question: 'Write your post' },
  { key: 'review', label: 'Review', question: 'Review & publish' },
] as const;

// Same icon-badge + label + control layout as FieldRow in
// apps/web/app/(agent)/submit/page.tsx and ProjectForm.tsx, reused here for
// visual consistency with the rest of the admin/agent-facing wizards.
function FieldRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}

// Shared by admin/blog/new/page.tsx and admin/blog/[id]/page.tsx — a rich-
// text editor doesn't fit the Modal-based create/edit pattern the rest of
// the admin panel uses (see admin/developers/page.tsx), so this is a
// dedicated page/component instead.
export function BlogEditorForm({ existing }: { existing?: BlogPost }) {
  const router = useRouter();
  const { categories, create, update, setStatus, uploadCover, createCategory } = useAdminBlogViewModel();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  // Furthest step the user has validly reached — a step pill only becomes
  // clickable once its index is <= this. Prevents skipping ahead into a
  // step whose prerequisites (previous required fields) aren't filled yet.
  // An existing post already has valid data everywhere, so it unlocks the
  // whole wizard immediately instead of forcing a re-walk through Continue.
  const [maxStepReached, setMaxStepReached] = useState(existing ? STEPS.length - 1 : 0);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const [categoryId, setCategoryId] = useState(existing?.category?.id ?? '');
  const [excerpt, setExcerpt] = useState(existing?.excerpt ?? '');
  const [readTime, setReadTime] = useState(existing?.readTime ?? '');
  // Deferred-upload pattern: picking a file no longer requires the post to
  // already exist. The file is held here and a local object URL previews
  // it immediately; the actual upload only happens inside handleSave, once
  // a real post id is guaranteed to exist (either just-created or already
  // existing). Avoids forcing a "save once, then upload" two-step flow.
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-derive the slug from the title until the admin edits it directly —
  // same "auto-fill until touched" convention as agency registration's
  // slugify(agencyName) call.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const editor = useEditor({
    extensions: [StarterKit, Image, Link.configure({ openOnClick: false })],
    content: existing?.content ?? '',
    immediatelyRender: false,
  });

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCoverFile(file);
    setCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  // Local object URLs are only good for this tab's lifetime — release it
  // once the component unmounts (or a new file replaces it, handled above)
  // so we don't leak memory across repeated picks.
  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  function insertImage() {
    const url = window.prompt('Image URL');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }

  function setLink() {
    const url = window.prompt('Link URL');
    if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    else editor?.chain().focus().unsetLink().run();
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const category = await createCategory.mutateAsync({ name, slug: slugify(name) });
      setCategoryId(category.id);
      setNewCategoryName('');
      toast.success('Category created.');
    } catch {
      toast.error('Something went wrong — please try again.');
    }
  }

  async function handleSave(status: 'draft' | 'published') {
    if (!title.trim() || !slug.trim()) {
      toast.error('Title is required.');
      return;
    }
    const content = editor?.getHTML() ?? '';
    setIsSaving(true);
    try {
      const fields = {
        title,
        content,
        categoryId: categoryId || undefined,
        excerpt: excerpt || undefined,
        readTime: readTime || undefined,
      };
      let postId = existing?.id;
      if (existing) {
        await update.mutateAsync({ id: existing.id, input: fields });
        if (existing.status !== status) await setStatus.mutateAsync({ id: existing.id, status });
      } else {
        const created = await create.mutateAsync({ ...fields, slug, status });
        postId = created.id;
      }
      if (coverFile && postId) {
        await uploadCover.mutateAsync({ id: postId, file: coverFile });
      }
      toast.success(status === 'published' ? 'Published.' : 'Draft saved.');
      router.push('/admin/blog');
    } catch {
      toast.error('Something went wrong — please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const isLastStep = step === STEPS.length - 1;

  // Only Details has fields the rest of the form actually depends on
  // (title/slug feed the create payload's required fields) — every other
  // step is optional data, so Continue is always available there. Same
  // per-step gate shape as the agent listing wizard / ProjectForm.
  function canContinue(index: number): boolean {
    if (index === 0) return title.trim() !== '' && slug.trim() !== '';
    return true;
  }

  const currentStepValid = canContinue(step);

  function goNext() {
    if (!currentStepValid) {
      toast.error('Please fill in the required fields to continue.');
      return;
    }
    setStep((s) => {
      const next = Math.min(STEPS.length - 1, s + 1);
      setMaxStepReached((m) => Math.max(m, next));
      return next;
    });
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  // A pill is only reachable once its step has actually been unlocked by
  // completing everything before it via Continue — jumping ahead into a
  // step whose prerequisites aren't filled in yet is not allowed.
  function goToStep(index: number) {
    if (index > maxStepReached) return;
    setStep(index);
  }

  const coverSrc = coverPreviewUrl || existing?.coverImageUrl || '';

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-28">
      <Reveal>
        <button
          type="button"
          onClick={() => router.push('/admin/blog')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to posts
        </button>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Newspaper className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow-label text-muted-foreground">{existing ? 'Edit a post' : 'Write a post'}</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{existing ? 'Edit Post' : 'New Post'}</h1>
              {existing && (
                <div className="mt-1.5">
                  <Badge variant={existing.status === 'published' ? 'success' : 'warning'}>{existing.status}</Badge>
                </div>
              )}
            </div>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {STEPS.map((s, index) => {
            const active = index === step;
            const done = index < step;
            const locked = index > maxStepReached;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => goToStep(index)}
                disabled={locked}
                aria-disabled={locked}
                className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'text-primary-foreground'
                    : locked
                      ? 'cursor-not-allowed text-muted-foreground/40'
                      : done
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="blogEditorStepPill"
                    className="bg-heading-gradient absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    active ? 'bg-white/20' : done ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  {done && !active ? <Check className="h-2.5 w-2.5" /> : index + 1}
                </span>
                <span className="relative">{s.label}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="space-y-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card>
              <CardHeader className="space-y-0">
                <p className="eyebrow-label text-muted-foreground">Step {step + 1}</p>
                <CardTitle className="text-xl">{STEPS[step].question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {step === 0 && (
                  <>
                    <FieldRow icon={Type} label="Title">
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" className="rounded-full" />
                    </FieldRow>

                    <FieldRow icon={LinkIcon} label="Slug">
                      <Input
                        value={slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setSlug(e.target.value);
                        }}
                        placeholder="post-title"
                        className="rounded-full"
                      />
                    </FieldRow>
                  </>
                )}

                {step === 1 && (
                  <>
                    <FieldRow icon={FolderOpen} label="Category">
                      <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-full">
                        <option value="">No category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                      <div className="flex gap-2 pt-1">
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="New category name"
                          className="h-9 rounded-full"
                        />
                        <Button type="button" size="sm" variant="outline" onClick={handleCreateCategory} disabled={createCategory.isPending}>
                          Add
                        </Button>
                      </div>
                    </FieldRow>

                    <FieldRow icon={Clock} label="Read time">
                      <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="5 min read" className="rounded-full" />
                    </FieldRow>
                  </>
                )}

                {step === 2 && (
                  <FieldRow icon={AlignLeft} label="Excerpt">
                    <Textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      rows={3}
                      placeholder="Short summary shown on cards"
                      className="rounded-2xl"
                    />
                  </FieldRow>
                )}

                {step === 3 && (
                  <FieldRow icon={ImageIcon} label="Cover image">
                    <div className="flex items-center gap-3">
                      {coverSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverSrc} alt="" className="h-20 w-32 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-muted text-muted-foreground/50">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                      <Button type="button" size="sm" variant="outline" onClick={() => coverInputRef.current?.click()}>
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        {coverFile ? 'Change' : 'Choose image'}
                      </Button>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic"
                        className="hidden"
                        onChange={handleCoverFileChange}
                      />
                    </div>
                    {coverFile && <p className="text-xs text-muted-foreground">Uploads when you save.</p>}
                  </FieldRow>
                )}

                {step === 4 && (
                  <FieldRow icon={PenLine} label="Content">
                    <div className="rounded-lg border border-input">
                      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/30 p-2">
                        <ToolbarButton icon={Bold} active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} />
                        <ToolbarButton icon={Italic} active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} />
                        <ToolbarButton
                          icon={Heading2}
                          active={editor?.isActive('heading', { level: 2 })}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        />
                        <ToolbarButton
                          icon={Heading3}
                          active={editor?.isActive('heading', { level: 3 })}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                        />
                        <ToolbarButton icon={List} active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
                        <ToolbarButton
                          icon={ListOrdered}
                          active={editor?.isActive('orderedList')}
                          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        />
                        <ToolbarButton icon={Quote} active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
                        <ToolbarButton icon={LinkIcon} active={editor?.isActive('link')} onClick={setLink} />
                        <ToolbarButton icon={ImageIcon} onClick={insertImage} />
                        <ToolbarButton icon={Undo2} onClick={() => editor?.chain().focus().undo().run()} />
                        <ToolbarButton icon={Redo2} onClick={() => editor?.chain().focus().redo().run()} />
                      </div>
                      <EditorContent
                        editor={editor}
                        className="prose prose-sm max-w-none px-4 py-3 focus:outline-none [&_.ProseMirror]:min-h-[240px] [&_.ProseMirror]:outline-none"
                      />
                    </div>
                  </FieldRow>
                )}

                {step === 5 && (
                  <>
                    {(title || excerpt) && (
                      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-brand-emerald/20 text-primary">
                          {coverSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Newspaper className="h-5 w-5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{title || 'Untitled post'}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {categories.find((c) => c.id === categoryId)?.name ?? 'No category'}
                            {readTime && ` · ${readTime}`}
                          </p>
                          {excerpt && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Double check the details above — you can go back to any step to make changes before publishing.
                    </p>

                    <div className="flex flex-col items-center gap-5 py-4 text-center">
                      <div className="flex flex-wrap justify-center gap-3">
                        <Button type="button" variant="outline" disabled={isSaving} onClick={() => handleSave('draft')}>
                          {isSaving ? 'Saving…' : 'Save Draft'}
                        </Button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          disabled={isSaving}
                          onClick={() => handleSave('published')}
                          className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
                        >
                          <Send className="h-4 w-4" />
                          {isSaving ? 'Saving…' : 'Publish'}
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-border bg-background/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:shadow-lg">
          <Button type="button" variant="outline" disabled={step === 0 || isSaving} onClick={goBack}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          <div className="ml-auto flex items-center gap-3">
            {!isLastStep && (
              <Button type="button" variant="outline" disabled={isSaving} onClick={() => handleSave('draft')}>
                {isSaving ? 'Saving…' : 'Save draft'}
              </Button>
            )}
            {!isLastStep && (
              <Button type="button" disabled={isSaving || !currentStepValid} onClick={goNext}>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  active,
  onClick,
}: {
  icon: typeof Bold;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
