'use client';

import { useParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { useUser } from '../../../context/AppContext.js';
import Image from 'next/image.js';

export default function Dashboard() {
    const { user } = useUser();
    const { id } = useParams();

    const [chapters, setChapters] = useState([]); // Replaces branches
    const [complaints, setComplaints] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState({});
    const [message, setMessage] = useState('');

    // Fetch complaints
    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const res = await fetch(`/api/get-complaints?id=${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || 'Failed to fetch complaints');

                setComplaints(data.complaints || []);

                // Set default chapter for each complaint
                const initialSelection = {};
                (data.complaints || []).forEach(c => {
                    initialSelection[c.id] = '';
                });
                setSelectedChapter(initialSelection);
            } catch (err) {
                console.error('Error fetching complaints:', err);
                setComplaints([]);
            }
        };

        if (id) fetchComplaints();
    }, [id]);

    // Fetch chapters (formerly branches)
    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const res = await fetch(`/api/get-chapters?id=${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || 'Failed to fetch chapters');

                setChapters(data.chapters || []);
            } catch (err) {
                console.error('Error fetching chapters:', err);
                setChapters([]);
            }
        };

        if (id) fetchChapters();
    }, [id]);

    const handleSelectChange = (complaintId, value) => {
        setSelectedChapter(prev => ({
            ...prev,
            [complaintId]: value
        }));
    };

    const handleSubmit = async (complaint) => {
        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: complaint.title,
                    brief: complaint.brief,
                    image: complaint.mediaLink,
                    location: complaint.location,
                    ngoId: id,
                    chapterName: selectedChapter[complaint.cno],
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage(`Complaint assigned: ${data.message}`);
        } catch (err) {
            setMessage(err.message || 'Error submitting complaint');
        }
    };


    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#DAD7B6] px-6 py-8">
                <h1 className="text-4xl md:text-5xl font-bold text-[#545334] mb-10 text-center">
                    Welcome to AidEra, {user?.name || 'User'}
                </h1>

                <div className="max-w-3xl mx-auto space-y-6">
                    {complaints.length === 0 ? (
                        <p className="text-center text-gray-600">No complaints found.</p>
                    ) : (
                        complaints.map((complaint) => (
                            <div key={complaint.cno} className="bg-white/20 backdrop-blur-[50px] rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-bold text-[#545334] mb-2">{complaint.title}</h2>
                                <p className="text-[#545334] mb-2">{complaint.brief}</p>
                                <p className="text-[#545334] mb-2">{complaint.location}</p>
                                {complaint.mediaLink && <>
                                    <div>
                                        <Image src={complaint.mediaLink} width={50} height={50} alt='Image' loading='lazy' className='w-[30vw] h-[30vh] m-auto' />
                                    </div>
                                </>}

                                <label className="block mb-2 text-[#545334]">Assign to Chapter:</label>
                                <select
                                    value={selectedChapter[complaint.cno] || ''}
                                    onChange={(e) => handleSelectChange(complaint.cno, e.target.value)}
                                    className="border border-[#545334] px-3 py-2 rounded w-full mb-4 text-[#545334]"
                                >
                                    <option value="">Select a chapter</option>
                                    {chapters.map((chapter, index) => (
                                        <option key={index} value={chapter}>
                                            {chapter}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => handleSubmit(complaint.cno)}
                                    className="bg-[#822B00] text-[#DAD7B6] px-4 py-2 rounded hover:bg-[#E78587] transition"
                                >
                                    Assign
                                </button>
                            </div>
                        ))
                    )}
                    {message && <p className="text-center text-green-600 mt-4">{message}</p>}
                </div>
            </div>
        </>
    );
}
