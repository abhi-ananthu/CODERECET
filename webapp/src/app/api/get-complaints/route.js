import NextResponse from 'next/server';
import connectToDB from '../../../lib/utils.js';
import { getComplaintsByNGO } from '../../../lib/model.js';
import URL from 'url';

export async function GET(req) {
	try{
		const {searchParams} = new URL(req.url);
		const id = searchParams.get('id');
 		const ngo = await Organization.findOne(id);
       		 console.log(ngo);
        	if (!ngo) {
           		console.log("NGO not found");
            		return;
        	}

        	const complaints = await Complaint.find({ assignto: ngo.id });
 	if (complaints.length === 0) {
            console.log(" No complaints found for this NGO");
        } else {
            console.log(`Complaints for "${ngo.name}":`, complaints);
        }
        console.log(complaints.brief);	
	}catch(error){
		console.log("Error fetching complaints:", error);
	}
}
