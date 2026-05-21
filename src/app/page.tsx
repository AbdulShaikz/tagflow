"use client";
 
import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import BookmarkCard from "./components/BookmarkCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Loader2, LogOut, Plus, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function BookmarkSkeleton() {
  return (
    <Card className="mb-3">
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
    return <p className="text-xs text-gray-400">No tags yet.</p>;
 
  return (
    <div className="overflow-y-auto max-h-65 flex flex-col gap-0.5 pr-1">
      {allTags.map(([tagName, count]) => (
        <button
          key={tagName}
          onClick={() => onTagClick(tagName)}
          className={`flex items-center justify-between text-sm px-2 py-1.5 rounded-md w-full text-left transition-colors ${
            activeTag === tagName
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <Tag className="h-3 w-3 shrink-0" />
            <span className="truncate">{tagName}</span>
          </span>
          <span className="text-xs text-gray-400 ml-2 shrink-0">{count}</span>
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
  errorMessage,
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
  errorMessage: string;
  onCreateBookmark: (e: React.SubmitEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Bookmark
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save a Bookmark</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateBookmark} className="flex flex-col gap-3 mt-2">
            <Input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            
            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
            <Button type="submit" className="w-full" disabled={saving}>
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
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Stats
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{bookmarkCount}</span>{" "}
          bookmark{bookmarkCount !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{tagCount}</span>{" "}
          tag{tagCount !== 1 ? "s" : ""}
        </p>
      </div>
 
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if(!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""),3000);
    return () => clearTimeout(timer);
  },[successMessage]);

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
    if(session) fetchBookmarks(true);
    else setBookmarksLoading(false);
  },[session]);

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
      setSuccessMessage('');
      setErrorMessage('');
      setSaving(true);
      try{
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, url }),
        });
        if (res.ok) {
          setSuccessMessage('Bookmark created!');
          await fetchBookmarks();
          setTitle('');
          setUrl('');
          setDialogOpen(false);
        } else {
          const err = await res.json();
          setErrorMessage(err.error || 'Something went wrong');
        }  
      } finally {
        setSaving(false);
      }
    }, [title, url, fetchBookmarks]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setSuccessMessage('');
      setErrorMessage('');
      try{
        const res = await fetch(`/api/bookmarks?id=${id}`, {method: 'DELETE'});
        if(res.ok){
          setSuccessMessage('Bookmark deleted!');
          await fetchBookmarks();
        } else {
          setErrorMessage('Failed to delete bookmark. Please try again.');
        }
      } finally {
        setDeletingId(null);
      }
    }, [fetchBookmarks]
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
    errorMessage,
    onCreateBookmark: createBookmark,
  };
  
  if (status === "loading")
    return (
      <div className="flex min-h-screen justify-center items-center gap-2 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading...</span>
      </div>
    );

  if(!session){
    return (
      <main className="flex flex-col min-h-screen justify-center items-center gap-4 bg-gray-50 px-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl sm:text-5xl font-bold">TagFlow</h1>
        </div>
        <p className="text-gray-500 text-center">
          Your AI-powered bookmark manager
        </p>
        <Button onClick={() => signIn("github")} className="mt-2">
          Sign in with GitHub
        </Button>
      </main>
    );
  }

  return(
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-gray-500"
                aria-label="Open sidebar"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 flex flex-col gap-6 p-5">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-blue-600" />
                  TagFlow
                </SheetTitle>
              </SheetHeader>
              <SidebarContent {...sidebarProps} />
            </SheetContent>
          </Sheet>
 
          <Bookmark className="h-5 w-5 text-blue-600 hidden md:block" />
          <span className="font-bold text-lg tracking-tight">TagFlow</span>
        </div>
 
        <div className="flex items-center gap-2 sm:gap-3">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt="avatar"
              className="w-7 h-7 rounded-full"
            />
          )}
          <span className="text-sm text-gray-500 hidden sm:block truncate max-w-35">
            {session.user?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-gray-500 hover:text-red-500 hover:bg-red-50 px-2"
          >
            <LogOut className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-gray-200 flex-col gap-6 p-5 overflow-y-auto">
          <SidebarContent {...sidebarProps} />
        </aside>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                  <Button className="w-full">
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
                      required
                    />
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                    {errorMessage && (
                      <p className="text-sm text-red-500">{errorMessage}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={saving}>
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

            {successMessage && (
              <p className="text-sm text-green-600">{successMessage}</p>
            )}
            
            {activeTag && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-500 flex items-center gap-1.5 min-w-0">
                  <Tag className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">
                    Filtering by{" "}
                    <strong className="text-blue-700">{activeTag}</strong>
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTag(null)}
                  className="h-6 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 shrink-0 ml-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}

            <p className="text-xs text-gray-400">
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
                <Bookmark className="h-10 w-10 text-gray-200" />
                <p className="text-gray-400 text-sm">
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