
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '@/app/components/Navbar';
import { useUser } from '../../../context/AppContext.js'; // adjust path as needed

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
    const { user } = useUser(); // Get user from context
    const params = useParams();
    const id = params.id;

    const [branches, setBranches] = useState([]);
    const [selectedBranchPerTask, setSelectedBranchPerTask] = useState({});
    const [message, setMessage] = useState('');

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
                <h1 className="text-4xl md:text-5xl font-bold text-[#545334] mb-10 text-center">
                    Welcome to AidEra, {user?.name || 'User'}
                </h1>

                <div className="max-w-3xl mx-auto space-y-6">
                    {mockTasks.map((task) => (
                        <div
                            key={task.id}
                            className="bg-white/20 backdrop-blur-[50px] rounded-lg shadow-md p-6"
                        >
                            <h2 className="text-3xl font-bold text-[#545334] mb-2">{task.title}</h2>
                            <p className="text-[#545334] mb-4">{task.description}</p>

                            {branches.length > 0 ? (
                                <>
                                    <label className="block mb-2 font-large text-[#545334]">
                                        Assign to:
                                    </label>
                                    <select
                                        className="border border-[#545334] px-3 py-2 rounded w-full mb-4 text-[#545334]"
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
                                <p className="text-sm text-red-600 mb-4">
                                    No branches available.
                                </p>
                            )}
                            <div className="flex justify-center">
                                <button
                                    onClick={() => handleSubmit(task.id)}
                                    className="bg-[#822B00] text-[#DAD7B6] px-4 py-2 rounded hover:bg-[#E78587] transition m-auto"
                                >
                                    Submit
                                </button>



                                {message && (
                                    <p className="mt-3 text-lg text-green-700">{message}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

