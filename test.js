const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Dummy user data (in real-world use a DB)
const USERS = [
    { id: 1, username: "abhiram", password: "secure123", branches: ["IN", "TN"] },
    { id: 2, username: "admin", password: "admin123", branches: ["TVM", "EKM"] },
];

const app = express();
const PORT = 4000;
const SUBMISSIONS = [];

app.use(cors());
app.use(bodyParser.json());

// Login route
app.get("/", (req, res) => {
    res.send("Hello World");
});
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = USERS.find(
        (u) => u.username === username && u.password === password,
    );

    if (user) {
        return res
            .status(200)
            .json({ message: "Login successful", id: user.id, branches: user.branches });
    } else {
        return res.status(401).json({ message: "Invalid credentials" });
    }
});


app.post("/submit", (req, res) => {
    const { username, taskId, assignedTo } = req.body;

    if (!username || !taskId || !assignedTo) {
        return res.status(400).json({ message: "Missing fields in submission" });
    }

    const submission = {
        id: SUBMISSIONS.length + 1,
        username,
        taskId,
        assignedTo,
        submittedAt: new Date().toISOString(),
    };

    SUBMISSIONS.push(submission);
    console.log("New Submission:", submission);

    return res.status(200).json({ message: "Assignment submitted successfully", submission });
});

// Get branches for a specific user by ID
app.get("/get-branches/:id", (req, res) => {
    const { id } = req.params;

    // Convert string ID to number for comparison
    const user = USERS.find((u) => u.id === parseInt(id));

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ branches: user.branches });
});


app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});
