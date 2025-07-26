"use client"
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent form reload

        try {
            const response = await axios.post('http://localhost:4000/login', {
                username,
                password
            });
            console.log(username, password);
            // Assuming API returns { success: true, token: "..." }
            if (response.data) {
                console.log("done");
                router.push(`/dashboard/${response.data.id}`)
                // return res.status(200).json({ success: true, message: 'Login successful', user: user.username });

                // Store token or navigate, as needed
            } else {
                console.log("NOT DONE");

                setMessage('Login failed. Please check your credentials.');
            }
        } catch (error) {
            setMessage('An error occurred during login.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#DAD7B6] px-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-[#545334]">
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

                <p className="mt-6 text-center text-sm text-[#545334]">
                    © 2025 ConnectNGO. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
