"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const {data: session, status} = useSession();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');

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
    setMessage('');
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url }),
    });
    if (res.ok) {
      setMessage('Bookmark created!');
      setTitle('');
      setUrl('');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Something went wrong');
    }
  };

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
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <button
        onClick={()=>signOut()}
        className="rounded bg-red-500 px-4 py-2 text-white mt-4"
      >
        Sign out
      </button>
    </main>
  );
}