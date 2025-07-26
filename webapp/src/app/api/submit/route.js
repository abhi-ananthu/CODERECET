import { NextResponse } from 'next/server';
import connectToDB from '@/lib/utils';
import { Organization } from '@/lib/model';

export async function POST(req) {
  try {
    const { title, brief, image, location, ngoId, chapterName } = await req.json();

    // Validation
    if (!ngoId || !chapterName || !title || !brief || !image || !location) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    await connectToDB();

    const ngo = await Organization.findOne({ id: ngoId });
    if (!ngo) {
      return NextResponse.json({ message: 'NGO not found' }, { status: 404 });
    }

    // Find chapter
    const chapterIndex = ngo.chapters.findIndex(ch => ch.name === chapterName);
    if (chapterIndex === -1) {
      return NextResponse.json({ message: 'Chapter not found' }, { status: 404 });
    }

    // Create complaint
    const complaint = {
      _id: new Date().getTime().toString(), // Generate simple ID; use uuid or ObjectId in production
      title,
      brief,
      mediaLink: image,
      location,
      date: new Date().toISOString(),
    };

    // Push complaint to chapter
    ngo.chapters[chapterIndex].assignedComplaints = [
      ...(ngo.chapters[chapterIndex].assignedComplaints || []),
      complaint,
    ];

    await ngo.save();

    return NextResponse.json({ message: 'Complaint assigned successfully', complaint });
  } catch (err) {
    console.error('Error in POST /submit:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
