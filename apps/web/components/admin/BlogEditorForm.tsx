'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import toast from 'react-hot-toast';
import { BlogPost, slugify, useAdminBlogViewModel } from '@jayedaad/core';
import { Button, Input, Label, Select, Textarea } from '@jayedaad/ui-web';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImageIcon,
  Quote,
  Undo2,
  Redo2,
  Upload,
} from 'lucide-react';

// Shared by admin/blog/new/page.tsx and admin/blog/[id]/page.tsx — a rich-
// text editor doesn't fit the Modal-based create/edit pattern the rest of
// the admin panel uses (see admin/developers/page.tsx), so this is a
// dedicated page/component instead.
export function BlogEditorForm({ existing }: { existing?: BlogPost }) {
  const router = useRouter();
  const { categories, create, update, setStatus, uploadCover, createCategory } = useAdminBlogViewModel();
  const coverInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{existing ? 'Edit Post' : 'New Post'}</h1>
        {existing && <p className="mt-1 text-sm text-muted-foreground">Status: {existing.status}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
      </div>

      <div className="space-y-1.5">
        <Label>Slug</Label>
        <Input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="post-title"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
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
              className="h-9"
            />
            <Button type="button" size="sm" variant="outline" onClick={handleCreateCategory} disabled={createCategory.isPending}>
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Read time</Label>
          <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="5 min read" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Excerpt</Label>
        <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Short summary shown on cards" />
      </div>

      <div className="space-y-1.5">
        <Label>Cover image</Label>
        <div className="flex items-center gap-3">
          {coverPreviewUrl || existing?.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreviewUrl || existing?.coverImageUrl || ''} alt="" className="h-20 w-32 rounded-lg object-cover" />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-muted text-muted-foreground/50">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          <Button type="button" size="sm" variant="outline" onClick={() => coverInputRef.current?.click()}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {coverFile ? 'Change' : 'Choose image'}
          </Button>
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handleCoverFileChange} />
        </div>
        {coverFile && <p className="text-xs text-muted-foreground">Uploads when you save.</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Content</Label>
        <div className="rounded-lg border border-input">
          <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
            <ToolbarButton icon={Bold} active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} />
            <ToolbarButton icon={Italic} active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} />
            <ToolbarButton icon={Heading2} active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
            <ToolbarButton icon={Heading3} active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} />
            <ToolbarButton icon={List} active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
            <ToolbarButton icon={ListOrdered} active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
            <ToolbarButton icon={Quote} active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
            <ToolbarButton icon={LinkIcon} active={editor?.isActive('link')} onClick={setLink} />
            <ToolbarButton icon={ImageIcon} onClick={insertImage} />
            <ToolbarButton icon={Undo2} onClick={() => editor?.chain().focus().undo().run()} />
            <ToolbarButton icon={Redo2} onClick={() => editor?.chain().focus().redo().run()} />
          </div>
          <EditorContent editor={editor} className="prose prose-sm max-w-none px-4 py-3 focus:outline-none [&_.ProseMirror]:min-h-[240px] [&_.ProseMirror]:outline-none" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" disabled={isSaving} onClick={() => handleSave('draft')}>
          Save Draft
        </Button>
        <Button type="button" disabled={isSaving} onClick={() => handleSave('published')}>
          {isSaving ? 'Saving…' : 'Publish'}
        </Button>
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
