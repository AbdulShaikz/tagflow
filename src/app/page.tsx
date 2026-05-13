"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const {data: session, status} = useSession();

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

  return(
    <main className="flex min-h-screen flex-col justify-center items-center gap-4">
      <h1 className="text-4xl font-bold">TagFlow</h1>
      <div className="flex items-center gap-4">
        {session.user?.image && (
          <img src={session.user.image} alt="avatar" className="w-10 h-10 rounded-full"/>
        )}
        <p>Welcome, {session.user?.name} ({session.user?.email})</p>
      </div>
      <button
        onClick={()=>signOut()}
        className="rounded bg-red-500 px-4 py-2 text-white"
      >
        Sign out
      </button>
    </main>
  );
}