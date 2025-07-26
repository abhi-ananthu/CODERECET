import { NextResponse } from 'next/server';
import connectToDB from '../../../lib/utils.js';
import { Complaint, Organization } from '../../../lib/model.js';

export async function GET(req) {
	try {
		await connectToDB();

		const id = req.nextUrl.searchParams.get('id'); // ✅ FIXED LINE

		if (!id) {
			return NextResponse.json({ message: 'Missing NGO ID' }, { status: 400 });
		}

		const ngo = await Organization.findOne({ id }); // Assuming `id` is a field

		if (!ngo) {
			return NextResponse.json({ message: 'NGO not found' }, { status: 404 });
		}

		const complaints = await Complaint.find({ assignto: ngo.id });

		return NextResponse.json({
			message: 'Complaints fetched successfully',
			ngoName: ngo.name,
			complaints
		}, { status: 200 });

	} catch (error) {
		console.error('Error fetching complaints:', error);
		return NextResponse.json({ message: 'Server error' }, { status: 500 });
	}
}
