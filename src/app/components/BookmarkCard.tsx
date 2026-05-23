import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Sparkles, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  tags: { id: string; name: string }[];
};

export default function BookmarkCard({
  bookmark,
  onDelete,
  onRefresh,
  onTagClick,
  isDeleting,
}: {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onTagClick: (tagName: string) => void;
  isDeleting?: boolean;
}) {
  const [showAddTag, setShowAddTag] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagError, setTagError] = useState("");
  const [autoTagError, setAutoTagError] = useState("");
  const [autoTagging, setAutoTagging] = useState(false);

  useEffect(() => {
    if (!tagError) return;
      const timer = setTimeout(() => setTagError(""), 3000);
      return () => clearTimeout(timer);
  }, [tagError]);

  useEffect(() => {
    if (!autoTagError) return;
      const timer = setTimeout(() => setAutoTagError(""), 3000);
      return () => clearTimeout(timer);
  }, [autoTagError]);

  const handleAutoTag = async () => {
    if (autoTagging) return;
    setAutoTagError("");
    setAutoTagging(true);
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}/auto-tag`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        setAutoTagError(err.error || "Auto-tag failed");
      } else {
        onRefresh();
      }
    } catch {
      setAutoTagError("Network error during auto-tag");
    } finally {
      setAutoTagging(false);
    }
  };

  const addTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setTagError("Tag name cannot be empty");
      return;
    }
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setTagError(err.error || "Failed to add tag");
        return;
      }

      setTagName("");
      setShowAddTag(false);
      setTagError("");
      onRefresh();
    } catch {
      setTagError("Network error");
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-sm wrap-break-word"
            >
              {bookmark.title}
            </a>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {new Date(bookmark.createdAt).toLocaleString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(bookmark.id)}
            disabled={isDeleting}
            className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
            title="Delete bookmark"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {bookmark.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 my-2">
            {bookmark.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag.name);
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-start gap-x-3 gap-y-2 border-t border-border mt-3 pt-3">
          {!showAddTag ? (
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0 text-gray-500 dark:text-gray-400 hover:text-blue-600"
              onClick={() => setShowAddTag(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add tag
            </Button>
          ) : (
            <div className="w-full">
              <form onSubmit={addTag} className="flex flex-wrap gap-1">
                <Input
                  type="text"
                  placeholder="e.g., ai, dev"
                  value={tagName}
                  onChange={(e) => {
                    setTagName(e.target.value);
                    if (tagError) setTagError("");
                  }}
                  className="h-7 text-xs flex-1 min-w-0"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddTag(false);
                    setTagError("");
                    setTagName("");
                  }}
                  className="h-7 text-xs shrink-0"
                >
                  Cancel
                </Button>
              </form>
              {tagError && (
                <p className="text-red-500 text-xs mt-1">{tagError}</p>
              )}
            </div>
          )}

          <div className="flex flex-col items-start">
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0 text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              onClick={handleAutoTag}
              disabled={autoTagging}
            >
              {autoTagging ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {autoTagging ? "Tagging..." : "Auto-tag"}
            </Button>
            {autoTagError && (
              <p className="text-red-500 text-xs mt-0.5">{autoTagError}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}