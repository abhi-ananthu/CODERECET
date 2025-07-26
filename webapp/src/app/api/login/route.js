import { NextResponse } from 'next/server';
import connectToDB from '../../../lib/utils.js';
import { Organization } from '../../../lib/model';

export async function POST(req) {
    try {
        const { email, password } = await req.json();
        await connectToDB();
        const user = await Organization.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
        }

        if (user.password !== password) {
            return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
        }

        return NextResponse.json({ message: 'Login successful', user }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
