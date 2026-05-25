"use client";
 
import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BookmarkCard from "./components/BookmarkCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Loader2, LogOut, Plus, Search, SlidersHorizontal, Tags, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {toast} from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./components/ThemeToggleButton";

function BookmarkSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-7 w-7 shrink-0" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function TagList({
  allTags,
  activeTag,
  onTagClick,
}: {
  allTags: [string, number][];
  activeTag: string | null;
  onTagClick: (name: string) => void;
}) {
  if (allTags.length === 0)
    return <p className="text-xs text-muted-foreground">No tags yet.</p>;
 
  return (
    <div className="overflow-y-auto max-h-60 flex flex-col gap-0.5 pr-1">
      {allTags.map(([tagName, count]) => (
        <button
          key={tagName}
          onClick={() => onTagClick(tagName)}
          className={`flex items-center justify-between text-sm px-2 py-1.5 rounded-md w-full cursor-pointer text-left transition-colors ${
            activeTag === tagName
              ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <Tags className="h-3 w-3 shrink-0" />
            <span className="truncate">{tagName}</span>
          </span>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">{count}</span>
        </button>
      ))}
    </div>
  );
}

function SidebarContent({
  bookmarkCount,
  tagCount,
  allTags,
  activeTag,
  onTagClick,
  dialogOpen,
  setDialogOpen,
  title,
  setTitle,
  url,
  setUrl,
  saving,
  onCreateBookmark,
}: {
  bookmarkCount: number;
  tagCount: number;
  allTags: [string, number][];
  activeTag: string | null;
  onTagClick: (name: string) => void;
  dialogOpen: boolean;
  setDialogOpen: (v: boolean) => void;
  title: string;
  setTitle: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  saving: boolean;
  onCreateBookmark: (e: React.SubmitEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Add Bookmark
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save a Bookmark</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateBookmark} className="flex flex-col gap-3 mt-2">
            <Input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" className="w-full cursor-pointer" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Bookmark"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
 
       <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Stats
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{bookmarkCount}</span>{" "}
          bookmark{bookmarkCount !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{tagCount}</span>{" "}
          tag{tagCount !== 1 ? "s" : ""}
        </p>
      </div>
 
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Tags
        </p>
        <TagList allTags={allTags} activeTag={activeTag} onTagClick={onTagClick} />
      </div>
    </>
  );
}

export default function Home() {
  const {data: session, status} = useSession();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchBookmarks = useCallback(async (showSkeleton = false) => {
    if(showSkeleton) setBookmarksLoading(true);
    try {
      const res = await fetch('/api/bookmarks');
      if(res.ok){
        const data = await res.json();
        setBookmarks(data);
      }    
    } finally {
      setBookmarksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setBookmarksLoading(false);
      return;
    }
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchBookmarks(true);
    } else {
      fetchBookmarks(false);
    }
  }, [session, fetchBookmarks]);

  const allTags = useMemo<[string, number][]>(() => {
    const map = new Map<string, number>();
    bookmarks.forEach((b) =>
      b.tags?.forEach((t: { name: string }) =>
        map.set(t.name, (map.get(t.name) ?? 0) + 1)
      )
    );
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [bookmarks]);
  
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => {
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesTag = b.tags?.some((tag: { name: string }) => 
          tag.name.toLowerCase().includes(query)
        );
        return matchesTitle || matchesTag;
      });
    }

    if (activeTag) {
      result = result.filter(b => 
        b.tags?.some((tag: { name: string }) => tag.name === activeTag)
      );
    }

    return result;
  }, [bookmarks, searchQuery, activeTag]);

  const handleTagClick = useCallback(
    (tagName: string) =>
      setActiveTag((prev) => (prev === tagName ? null : tagName)),
    []
  );

  const createBookmark = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      if (!title.trim()) {
        toast.error('Title cannot be empty');
        setSaving(false);
        return;
      }
      if (!url.trim()) {
        toast.error('URL cannot be empty');
        setSaving(false);
        return;
      }    
      
      try{
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, url }),
        });
        if (res.ok) {
          toast.success('Bookmark created!');
          await fetchBookmarks();
          setTitle('');
          setUrl('');
          setDialogOpen(false);
        } else {
          const err = await res.json();
          toast.error(err.error || 'Something went wrong');
        }  
      } finally {
        setSaving(false);
      }
    }, [title, url, fetchBookmarks]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      const deletedBookmark = bookmarks.find(b => b.id === id);
      if (!deletedBookmark) return;

      setBookmarks(prev => prev.filter(b => b.id !== id));
      setDeletingId(id);

      try {
        const res = await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' });
        
        if (!res.ok) {
          setBookmarks(prev => {
            const exists = prev.find(b => b.id === id);
            return exists ? prev : [...prev, deletedBookmark];
          });
          toast.error('Failed to delete bookmark. Please try again.');
          return;
        }

        toast.success('Bookmark deleted', {
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: async () => {
              try {
                const res = await fetch('/api/bookmarks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: deletedBookmark.title,
                    url: deletedBookmark.url,
                  }),
                });
                if (res.ok) {
                  await fetchBookmarks();
                  toast.success('Bookmark restored!');
                } else {
                  toast.error('Could not restore bookmark.');
                }
              } catch {
                toast.error('Could not restore bookmark.');
              }
            },
          },
        });
      } finally {
        setDeletingId(null);
      }
    },
    [bookmarks, fetchBookmarks]
);
  
  const sidebarProps = {
    bookmarkCount: bookmarks.length,
    tagCount: allTags.length,
    allTags,
    activeTag,
    onTagClick: handleTagClick,
    dialogOpen,
    setDialogOpen,
    title,
    setTitle,
    url,
    setUrl,
    saving,
    onCreateBookmark: createBookmark,
  };
  
  if (status === "loading")
    return (
      <div className="flex min-h-screen justify-center items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );

  if(!session){
    return (
      <main className="flex flex-col min-h-screen justify-center items-center gap-4 bg-background px-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3">
          <Tags className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-4xl sm:text-5xl font-bold">
            Tag<span className="text-blue-600 dark:text-blue-400">Flow</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-center">
          Your AI-powered bookmark manager
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <Button
            onClick={() => signIn("github")}
            variant="outline"
            className="w-full gap-2 cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in with GitHub
          </Button>

          <Button
            onClick={() => signIn("google")}
            variant="outline"
            className="w-full gap-2 cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
        </div>
      </main>
    );
  }

  return(
    <div className="h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 bg-background border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-muted-foreground cursor-pointer"
                aria-label="Open sidebar"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 flex flex-col gap-6 p-5">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-lg tracking-tight">
                    Tag<span className="text-blue-600 dark:text-blue-400">Flow</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <SidebarContent {...sidebarProps} />
            </SheetContent>
          </Sheet>
 
          <Tags className="h-5 w-5 text-blue-600 dark:text-blue-400 hidden md:block" />
          <span className="font-bold text-lg tracking-tight">
            Tag<span className="text-blue-600 dark:text-blue-400">Flow</span>
          </span>
        </div>
 
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {session.user?.image && (
            <img
              src={session.user.image}
              alt="avatar"
              title={session.user?.email ?? ""}
              className="w-7 h-7 rounded-full cursor-default"
            />
          )}
          <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-35">
            {session.user?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-60 shrink-0 bg-card border-r border-border flex-col gap-6 p-5 overflow-y-auto">
          <SidebarContent {...sidebarProps} />
        </aside>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="md:hidden">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bookmark
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Save a Bookmark</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={createBookmark} className="flex flex-col gap-3 mt-2">
                    <Input
                      type="text"
                      placeholder="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <Button type="submit" className="w-full cursor-pointer" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Bookmark"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {activeTag && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg px-3 py-2 text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5 min-w-0">
                  <Tags className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                  <span className="truncate">
                    Filtering by{" "}
                    <strong className="text-blue-700 dark:text-blue-300">{activeTag}</strong>
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTag(null)}
                  className="h-6 px-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 shrink-0 ml-2 cursor-pointer"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {searchQuery || activeTag
                ? `Showing ${filteredBookmarks.length} of ${bookmarks.length} bookmarks`
                : `${bookmarks.length} bookmark${bookmarks.length !== 1 ? "s" : ""}`}
            </p>
 
            {bookmarksLoading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <BookmarkSkeleton />
                <BookmarkSkeleton />
                <BookmarkSkeleton />
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-24 text-center">
                <Bookmark className="h-10 w-10 text-muted" />
                <p className="text-muted-foreground text-sm">
                  {searchQuery || activeTag
                    ? "No bookmarks match your search."
                    : "No bookmarks yet. Add your first one!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {filteredBookmarks.map((b) => (
                  <BookmarkCard
                    key={b.id}
                    bookmark={b}
                    onDelete={deleteBookmark}
                    onRefresh={fetchBookmarks}
                    onTagClick={handleTagClick}
                    isDeleting={deletingId === b.id}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}