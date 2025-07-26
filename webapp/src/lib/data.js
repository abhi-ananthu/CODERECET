import { connect } from "mongoose";
import { Complaint, Organization } from "./model.js"
import connectToDB from "./utils.js"



// Assign(submit)


export const getComplaintsByNGO = async (id) => {

    try {
        await connectToDB();

        const ngo = await Organization.findOne({ id: id });
        console.log(ngo.name);
        if (!ngo) {
            console.log("NGO not found");
            return;
        }

        const complaints = await Complaint.find({ assignto: id });



        if (complaints.length === 0) {
            console.log(" No complaints found for this NGO");
        } else {
            console.log(`Complaints for "${ngo.name}":`, complaints);
        }

    } catch (error) {
        console.error("Error fetching complaints:", error);
    }
};


// await getComplaintsByNGO(8);







export const login = async (email, password) => {
    try {
        await connectToDB();

        const user = await Organization.findOne({ email });
        if (!user) {
            console.log("Organization Not Found");
            return;
        }
        console.log(user);
        if (user.password !== password) {
            console.log("Invalid Password");
            return;
        }

        console.log("Login Successful");
    } catch (error) {
        console.error("Login error:", error);
    }
};
// await login("contact@hopekerala.org", "hope123");




export const getChaptersOfNGO = async (id) => {
    try {
        await connectToDB();


        const ngo = await Organization.findOne({
            id: id
        });

        if (!ngo) {
            console.log("NGO not found");
            return null;
        }

        console.log("Chapters:", ngo.chapters);
        return ngo.chapters;
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return null;
    }
};
// getChaptersOfNGO(4);

export const assignChapter = async (userId, taskId, assignedTo) => {
    try {
        const res = await fetch('http://localhost:4000/assign-chapter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: userId,
                taskId,
                assignedTo
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Assignment failed');
        }

        console.log(data.message);
        return data.message;
    } catch (error) {
        console.error('Assignment error:', error.message);
        return error.message || 'Assignment failed';
    }
};
