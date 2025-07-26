
"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext'; // ✅ FIXED
import Navbar from '@/app/components/Navbar'; // ✅ FIXED

const LoginPage = () => {
    const { setUser } = useAppContext(); // ✅ FIXED
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: username,
                    password: password,
                }),
            });
            const data = await response.json();

            if (data) {
                const userData = {
                    email: data.user.email,
                    name: data.user.name,
                    id: data.user.id,
                    context: data.user.context,
                };

                setUser(userData); // ✅ Save to context + localStorage
                router.push(`/dashboard/${data.user.id}`);
            } else {
                setMessage('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error(error);
            setMessage('An error occurred during login.');
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-[#DAD7B6] px-4">
                <div className="bg-white p-8 rounded-[20px] shadow-lg w-full max-w-md border border-[#545334]">
                    <h2 className="text-3xl font-bold text-center text-[#545334] mb-6">
                        Login to ConnectNGO
                    </h2>

                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username" className="block text-[#545334] font-medium mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-[#545334] rounded-md bg-[#DAD7B6] text-[#545334] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#545334]"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-[#545334] font-medium mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-[#545334] rounded-md bg-[#DAD7B6] text-[#545334] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#545334]"
                                placeholder="Enter your password"
                            />
                        </div>
                        <button

                            type="submit"
                            className="w-full bg-[#545334] text-[#DAD7B6] py-2 rounded-md text-lg font-medium hover:bg-[#434323] transition"
                        >
                            Login
                        </button>

                    </form>

                    {message && (
                        <p className="mt-4 text-center text-sm text-red-600 font-semibold">
                            {message}
                        </p>
                    )}

                </div>
            </div>
        </>
    );
};

export default LoginPage;

