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
}: {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const [showAddTag, setShowAddTag] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagError, setTagError] = useState("");
  const [autoTagError, setAutoTagError] = useState("");
  const [autoTagging, setAutoTagging] = useState(false);

  useEffect(() => {
    if (!tagError && !autoTagError) return;

    const timer = setTimeout(() => {
      setTagError("");
      setAutoTagError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [tagError, autoTagError]);

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm relative">
      <button
        onClick={() => onDelete(bookmark.id)}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm font-extrabold leading-none cursor-pointer"
        title="Delete bookmark"
      >
        ✕
      </button>

      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-semibold text-blue-600 hover:underline block mb-1"
      >
        {bookmark.title}
      </a>
      <p className="text-xs text-gray-400 mb-2">
        {new Date(bookmark.createdAt).toLocaleString()}
      </p>

      {bookmark.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {bookmark.tags.map((tag) => (
            <span
              key={tag.id}
              className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs border border-blue-100"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {autoTagError && (
        <p className="text-red-500 text-xs mb-3">{autoTagError}</p>
      )}

      {!showAddTag ? (
        <button
          onClick={() => setShowAddTag(true)}
          className="text-xs text-blue-600 hover:underline cursor-pointer"
        >
          + Add tag
        </button>
      ) : (
        <div className="mt-2">
          <form onSubmit={addTag} className="flex gap-1">
            <input
              type="text"
              placeholder="e.g., ai, dev"
              value={tagName}
              onChange={(e) => {
                setTagName(e.target.value);
                if (tagError) setTagError("");
              }}
              className="border text-gray-500 border-gray-300 rounded px-2 py-1 text-xs flex-1 focus:outline-none focus:border-blue-400"
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddTag(false);
                setTagError("");
                setTagName("");
              }}
              className="text-gray-400 text-xs hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </form>
          {tagError && <p className="text-red-500 text-xs mt-1">{tagError}</p>}
        </div>
      )}
      <button
        onClick={handleAutoTag}
        disabled={autoTagging}
        className="ml-2 text-xs text-purple-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {autoTagging ? "Tagging..." : " ✨Auto-tag"}
      </button>
    </div>
  );
}
