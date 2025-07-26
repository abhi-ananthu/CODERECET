const mongoose = require('mongoose');

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

module.exports = connectToDB;
