
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const Navbar = () => {
  const router = useRouter();
  const { user, setUser } = useAppContext();

  const handleLogout = () => {
    setUser(null); // Clear context
    localStorage.removeItem('user');
    router.push("/login");
  };

  return (
    <nav className="w-full bg-[#545334] text-[#DAD7B6] px-6 py-6 flex justify-between items-center shadow-md">
      <h1 className="text-4xl font-bold">ConnectNGO</h1>

      {user && (
        <button
          className="bg-[#DAD7B6] text-[#545334] text-3xl px-6 py-3 rounded-xl hover:bg-[#cfcba8] transition font-medium"
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navbar;

