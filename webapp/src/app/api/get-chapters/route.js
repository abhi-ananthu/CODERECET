import { NextResponse } from 'next/server';
import connectToDB from '../../../lib/utils.js';
import { Organization } from '../../../lib/model.js';

export async function GET(req) {
    try {
        await connectToDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Missing id parameter' }, { status: 400 });
        }

        const ngo = await Organization.findOne({ id });

        if (!ngo) {
            return NextResponse.json({ message: 'NGO not found' }, { status: 404 });
        }

        return NextResponse.json({ chapters: ngo.chapters || [] }, { status: 200 });

    } catch (err) {
        console.error("Error fetching chapters:", err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
