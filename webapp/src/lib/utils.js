import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
// Now define __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = path.resolve(__dirname, '../..', '.env');

dotenv.config({ path: envPath });

const conn = { isConnected: false };

const connectToDB = async () => {
    try {
        if (conn.isConnected) {
            console.log("Existing connection!!");
            return;
        }

        const db = await mongoose.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        conn.isConnected = db.connections[0].readyState;
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
};

connectToDB();
export default connectToDB;
// module.exports = connectToDB();

