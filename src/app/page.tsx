"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const {data: session, status} = useSession();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    if(session) fetchBookmarks();
  },[session]);

  if(status=="loading") return <p className="flex min-h-screen justify-center items-center">Loading...</p>

  if(!session){
    return(
      <main className="flex flex-col min-h-screen justify-center items-center gap-4">
        <h1 className="md:text-5xl font-bold">TagFlow</h1>
        <p className="text-gray-500">Your AI-powered bookmark manager</p>
        <button
          onClick={()=>signIn("github")}
          className="rounded bg-blue-600 px-4 py-2 text-white cursor-pointer"
        >
          Sign in with GitHub
        </button>
      </main>
    );
  }

  const createBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
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
    } else {
      const err = await res.json();
      setErrorMessage(err.error || 'Something went wrong');
    }
  };

  const fetchBookmarks = async () => {
    const res = await fetch('/api/bookmarks');
    if(res.ok){
      const data = await res.json();
      setBookmarks(data);
    }
  }

  const deleteBookmark = async (id: string) => {
    setSuccessMessage('');
    setErrorMessage('');
    const res = await fetch(`/api/bookmarks?id=${id}`, {method: 'DELETE'});
    if(res.ok){
      setSuccessMessage('Bookmark deleted!');
      fetchBookmarks();
    } else {
      setErrorMessage('Failed to delete bookmark. Please try again.');
    }
  }

  return(
    <main className="flex min-h-screen flex-col justify-center items-center gap-4">
      <h1 className="text-4xl font-bold">TagFlow</h1>
      <div className="flex items-center gap-4">
        {session.user?.image && (
          <img src={session.user.image} alt="avatar" className="w-10 h-10 rounded-full"/>
        )}
        <p>Welcome, {session.user?.name} ({session.user?.email})</p>
      </div>
      <form onSubmit={createBookmark} className="flex flex-col gap-2 w-full max-w-md">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700 cursor-pointer">
          Save Bookmark
        </button>
      </form>
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
      <div className="w-full max-w-md mt-4">
        {bookmarks.length === 0 ? (
          <p className="text-gray-500">No bookmarks yet.</p>
        ) : (
          bookmarks.map((b) => (
            <div key={b.id} className="border p-3 rounded mb-2 bg-white shadow-sm flex justify-between items-start">
              <div>
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">{b.title}</a>
                <p className="text-xs text-gray-400 mt-1">{new Date(b.createdAt).toLocaleString()}</p>
              </div>
              <button 
                className="text-red-500 text-sm hover:underline cursor-pointer"
                onClick={() => deleteBookmark(b.id)}
              >
                  Delete
              </button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={()=>signOut()}
        className="rounded bg-red-500 px-4 py-2 text-white mt-4"
      >
        Sign out
      </button>
    </main>
  );
}