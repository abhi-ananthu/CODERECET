import React from 'react';

const Navbar = () => {
    return (
        <nav className="w-full bg-[#545334] text-[#DAD7B6] px-6 py-4 flex justify-between items-center shadow-md">
            <h1 className="text-2xl font-bold">ConnectNGO</h1>
            <button className="bg-[#DAD7B6] text-[#545334] px-4 py-2 rounded hover:bg-[#cfcba8] transition font-medium">
                Logout
            </button>
        </nav>
    );
};

export default Navbar;
