'use client';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/firebase/firebaseConfig';


function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const router = useRouter();
  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace("/"); // ✅ use router.replace for client navigation
    } catch (error) {
      console.error(error);
    }
  }

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Create Subject", path: "/createSubject" },
    { label: "Manage Subject", path: "/manageSubject" },
    { label: "Create Paper", path: "/createPaper" },
    { label: "Manage Paper", path: "/managePaper" },
    { label: "page revalidation", path: "/revalidation" },
  ];

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <Link href="/dashboard" className="btn btn-ghost text-xl">Admin</Link>
      </div>

      {user && ( // ✅ show nav only when logged in
        <div className="flex-none">

          {/* Mobile dropdown */}
          <div className="dropdown dropdown-end md:hidden">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <button onClick={() => router.push(link.path)}>
                    {link.label}
                  </button>
                </li>
              ))}
              <li><button onClick={handleLogout}>Logout</button></li>
            </ul>
          </div>

          {/* Desktop menu */}
          <ul className="menu menu-horizontal px-1 hidden md:flex">
            {navLinks.map((link) => (
              <li key={link.path}>
                <button onClick={() => router.push(link.path)}>
                  {link.label}
                </button>
              </li>
            ))}
            <li><button onClick={handleLogout}>Logout</button></li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Navbar;