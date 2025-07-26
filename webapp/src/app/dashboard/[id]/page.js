'use client'

import { useRouter, usePathname, useParams } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';

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
    const { username } = params.id;

    const [openId, setOpenId] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [message, setMessage] = useState('');

    const toggleAccordion = (id) => {
        setOpenId(openId === id ? null : id);
        setMessage('');
    };

    const handleChange = (id, value) => {
        setInputValues({ ...inputValues, [id]: value });
    };


    const handleSubmit = async (id) => {
        try {
            const res = await axios.post('http://localhost:4000/submit', {
                username,
                taskId: id,
                assignedTo: inputValues[id],
            });

            setMessage(res.data.message);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-[#DAD7B6] px-6 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#545334] mb-8 text-center">
                Welcome, {username}
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

                                <input
                                    type="text"
                                    placeholder="Assign to..."
                                    value={inputValues[task.id] || ''}
                                    onChange={(e) => handleChange(task.id, e.target.value)}
                                    className="border border-[#545334] px-3 py-2 rounded w-full mb-3"
                                />

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
    );
}
