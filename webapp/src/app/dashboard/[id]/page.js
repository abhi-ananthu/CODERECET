'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '@/app/components/Navbar';

const mockTasks = [
    {
        id: 1,
        title: 'Distribute Food Packs',
        description: 'Coordinate with volunteers to distribute food to flood-affected areas.',
        assignedTo: ''
    },
    {
        id: 2,
        title: 'School Supply Drive',
        description: 'Collect and distribute school supplies to underprivileged children.',
        assignedTo: ''
    },
    {
        id: 3,
        title: 'Awareness Campaign',
        description: 'Organize an awareness campaign on child labor in your local community.',
        assignedTo: ''
    },
];

export default function Dashboard() {
    const params = useParams();
    const id = params.id;

    const [openId, setOpenId] = useState(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranchPerTask, setSelectedBranchPerTask] = useState({});
    const [message, setMessage] = useState('');

    // Fetch user branches from backend
    useEffect(() => {
        if (id) {
            axios.get(`http://localhost:4000/get-branches/${id}`)
                .then((res) => {
                    setBranches(res.data.branches);
                    const defaultBranchMap = {};
                    mockTasks.forEach(task => {
                        defaultBranchMap[task.id] = res.data.branches[0] || '';
                    });
                    setSelectedBranchPerTask(defaultBranchMap);
                })
                .catch(() => {
                    setBranches([]);
                });
        }
    }, [id]);

    const toggleAccordion = (taskId) => {
        setOpenId(openId === taskId ? null : taskId);
        setMessage('');
    };

    const handleSelectChange = (taskId, value) => {
        setSelectedBranchPerTask({
            ...selectedBranchPerTask,
            [taskId]: value
        });
    };

    const handleSubmit = async (taskId) => {
        try {
            const res = await axios.post('http://localhost:4000/submit', {
                username: id,
                taskId: taskId,
                assignedTo: selectedBranchPerTask[taskId],
            });

            setMessage(res.data.message);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Submission failed');
        }
    };

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

                                    {branches.length > 0 ? (
                                        <>
                                            <label className="block mb-1 font-medium">
                                                Assign to:
                                            </label>
                                            <select
                                                className="border border-[#545334] px-3 py-2 rounded w-full mb-3"
                                                value={selectedBranchPerTask[task.id] || ''}
                                                onChange={(e) => handleSelectChange(task.id, e.target.value)}
                                            >
                                                {branches.map((branch, idx) => (
                                                    <option key={idx} value={branch}>
                                                        {branch}
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    ) : (
                                        <p className="text-sm text-red-600 mb-3">
                                            No branches available.
                                        </p>
                                    )}

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
