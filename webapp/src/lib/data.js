import { connect } from "mongoose";
import { Complaint, Organization } from "./model.js"
import connectToDB from "./utils.js"



// Assign(submit)


export const getComplaintsByNGO = async (ngoName) => {
    try {
        await connectToDB();

        const ngo = await Organization.findOne({ name: ngoName });
        console.log(ngo.name);
        if (!ngo) {
            console.log("NGO not found");
            return;
        }

        const complaints = await Complaint.find({ assignto: ngoName });



        if (complaints.length === 0) {
            console.log(" No complaints found for this NGO");
        } else {
            console.log(`Complaints for "${ngo.name}":`, complaints);
        }

        console.log(complaints.brief);
    } catch (error) {
        console.error("Error fetching complaints:", error);
    }
};


// await getComplaintsByNGO("Clean Future Foundation");







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
await login("contact@hopekerala.org", "hope123");




export const getChaptersOfNGO = async (identifier) => {
    try {
        await connectToDB();


        const ngo = await Organization.findOne({
            name: identifier
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
// getChaptersOfNGO("Life Savers India");
