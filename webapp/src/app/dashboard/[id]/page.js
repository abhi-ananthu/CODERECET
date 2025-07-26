'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navbar from '@/app/components/Navbar';

const mockTasks = [
    {
        id: 1,
        title: 'Distribute Food Packs',
        description: 'Coordinate with volunteers to distribute food to flood-affected areas.',
        assignedTo: '',
    },
    {
        id: 2,
        title: 'School Supply Drive',
        description: 'Collect and distribute school supplies to underprivileged children.',
        assignedTo: '',
    },
    {
        id: 3,
        title: 'Awareness Campaign',
        description: 'Organize an awareness campaign on child labor in your local community.',
        assignedTo: '',
    },
];

export default function Dashboard() {
    const params = useParams();
    const searchParams = useSearchParams();

    const id = params.id;
    const [openId, setOpenId] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [message, setMessage] = useState('');
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const branchParam = searchParams.get('branches');
        if (branchParam) {
            try {
                const parsedBranches = JSON.parse(branchParam);
                setBranches(parsedBranches);
                setSelectedBranch(parsedBranches[0] || '');
            } catch (e) {
                console.error('Invalid branches in URL');
            }
        }
    }, [searchParams]);

    const toggleAccordion = (taskId) => {
        setOpenId(openId === taskId ? null : taskId);
        setMessage('');
    };

    const handleChange = (taskId, value) => {
        setInputValues({ ...inputValues, [taskId]: value });
    };

    const handleSubmit = async (taskId) => {
        try {
            const res = await axios.post('http://localhost:4000/submit', {
                username: id,
                taskId,
                assignedTo: inputValues[taskId],
            });

            setMessage(res.data.message);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error occurred');
        }
    };

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#DAD7B6] px-6 py-8">
                <h1 className="text-3xl md:text-4xl font-bold text-[#545334] mb-6 text-center">
                    Welcome, User ID: {id}
                </h1>

                <div className="max-w-3xl mx-auto">
                    {mockTasks.map((task) => (
                        <div key={task.id} className="mb-4 border border-[#545334] rounded">
                            <button
                                className="w-full text-left px-4 py-3 bg-[#545334] text-[#DAD7B6] font-semibold focus:outline-none"
                                onClick={() => toggleAccordion(task.id)}
                            >
                                {task.title}
                            </button>

                            {openId === task.id && (
                                <div className="bg-[#f4f2df] px-4 py-4 text-[#545334]">
                                    <p className="mb-3">{task.description}</p>

                                    {/* Dropdown Input */}
                                    <div className="relative mb-3" ref={dropdownRef}>
                                        <input
                                            type="text"
                                            placeholder="Assign to..."
                                            value={inputValues[task.id] || ''}
                                            onChange={(e) => handleChange(task.id, e.target.value)}
                                            onFocus={() => setOpenId(task.id)}
                                            className="border border-[#545334] px-3 py-2 rounded w-full"
                                        />

                                        {branches.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-white border border-[#545334] rounded shadow mt-1 max-h-40 overflow-y-auto">
                                                {branches
                                                    .filter((branch) =>
                                                        branch.toLowerCase().includes(
                                                            (inputValues[task.id] || '').toLowerCase()
                                                        )
                                                    )
                                                    .map((branch, index) => (
                                                        <li
                                                            key={index}
                                                            onClick={() => handleChange(task.id, branch)}
                                                            className="px-4 py-2 hover:bg-[#f0eadb] cursor-pointer text-[#545334]"
                                                        >
                                                            {branch}
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleSubmit(task.id)}
                                        className="bg-[#545334] text-[#DAD7B6] px-4 py-2 rounded hover:bg-[#434323] transition"
                                    >
                                        Submit
                                    </button>

                                    {message && (
                                        <p className="mt-3 text-sm text-green-700">{message}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
