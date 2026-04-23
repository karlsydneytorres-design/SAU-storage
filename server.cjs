const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
app.use(express.json());
app.use(cors());

const dbPath = path.resolve(__dirname, '..', 'pamsu_sau.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("Database Connection Error: ", err.message);
    console.log('Connected to SQLite database at: ' + dbPath);
});

// Add this to your server.js
app.get('/users', (req, res) => {
    db.all(`SELECT id, name, email, role FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        res.json({ success: true, users: rows });
    });
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        password TEXT,
        role TEXT DEFAULT 'Student'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.get("SELECT COUNT(*) as count FROM users WHERE role = 'Superadmin'", [], (err, row) => {
        if (err) return console.error(err.message);
        if (row && row.count === 0) {
            const initialID = "SA-001";
            const initialPass = "pamsu_admin_2026"; 
            db.run(
                `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
                [initialID, "System Root", "admin@pamsu.edu.ph", initialPass, "Superadmin"],
                (err) => {
                    if (err) console.log("Error seeding admin:", err.message);
                    else console.log("--- SYSTEM INITIALIZED: Superadmin created (ID: SA-001) ---");
                }
            );
        }
    });
});

const recordLog = (userId, action) => {
    db.run(`INSERT INTO logs (user_id, action) VALUES (?, ?)`, [userId || 'System', action]);
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT id, name, email, role FROM users WHERE (id = ? OR email = ?) AND password = ?`;
    
    db.get(query, [username.toUpperCase(), username, password], (err, user) => {
        if (err) return res.status(500).json({ success: false, message: "Database error." });
        
        if (user) {
            recordLog(user.id, 'Logged In'); 
            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    role: user.role 
                } 
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials." });
        }
    });
});

app.post('/register', (req, res) => {
    const { id, name, email, password, role } = req.body;
    const query = `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [id, name, email, password, role], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Already registered." });
        recordLog(id, 'Registered Account'); 
        res.json({ success: true, message: "User registered successfully!" });
    });
});

app.get('/logs', (req, res) => {
    db.all(`SELECT * FROM logs ORDER BY timestamp DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, logs: rows });
    });
});

app.post('/update-role', (req, res) => {
    const { targetUserId, newRole, adminId } = req.body;
    const query = `UPDATE users SET role = ? WHERE id = ?`;
    
    db.run(query, [newRole, targetUserId], function(err) {
        if (err) return res.status(500).json({ success: false, message: "Database error." });

        if (this.changes > 0) {
            const actionMessage = `${newRole === 'Superadmin' ? 'Promoted' : 'Demoted'} user ${targetUserId} to ${newRole}`;
            recordLog(adminId, actionMessage); 
            res.json({ success: true, message: `User ${targetUserId} updated to ${newRole}.` });
        } else {
            res.status(404).json({ success: false, message: "User not found." });
        }
    });
});

// NEW: Endpoint to handle User Deletion from Sadmin view
app.delete('/delete-user', (req, res) => {
    const { targetUserId, adminId } = req.body;
    const query = `DELETE FROM users WHERE id = ? AND role != 'Superadmin'`;

    db.run(query, [targetUserId], function(err) {
        if (err) return res.status(500).json({ success: false, message: "Database error." });

        if (this.changes > 0) {
            recordLog(adminId, `Deleted user account: ${targetUserId}`);
            res.json({ success: true, message: `User ${targetUserId} has been permanently deleted.` });
        } else {
            res.status(404).json({ success: false, message: "User not found or cannot delete Superadmin." });
        }
    });
});

app.post('/update-profile', (req, res) => {
    const { id, name, email, password } = req.body;
    
    let query = `UPDATE users SET name = ?, email = ?`;
    let params = [name, email];

    if (password && password.trim() !== "") {
        query += `, password = ?`;
        params.push(password);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ success: false, message: "Database Error" });
        res.json({ success: true, message: "Profile updated" });
    });
});
// Increase limit to handle Base64 images
app.use(express.json({ limit: '50mb' }));

// 1. Endpoint to get all bank records
app.get('/api/bank-records', (req, res) => {
    // Replace this with your DB query (e.g., db.query('SELECT * FROM bank_info'))
    // For now, we'll assume a local JSON file or variable
    res.json(bankRecordsArray); 
});

// 2. Endpoint to save/update a bank record
app.post('/api/save-bank-record', (req, res) => {
    const newRecord = req.body;
    
    // Logic: If studentId exists, update it. If not, push new.
    const index = bankRecordsArray.findIndex(r => r.studentId === newRecord.studentId);
    if (index !== -1) {
        bankRecordsArray[index] = newRecord;
    } else {
        bankRecordsArray.push(newRecord);
    }
    
    // In a real app: db.query('INSERT INTO bank_info ... ON DUPLICATE KEY UPDATE ...')
    res.status(200).json({ success: true, message: "Record saved to server!" });
});
// Add this to your server.cjs
app.post('/update-profile', (req, res) => {
    const { id, name, email, password } = req.body;

    // Build the query dynamically: only update password if provided
    let query;
    let params;

    if (password && password.trim() !== "") {
        query = `UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?`;
        params = [name, email, password, id];
    } else {
        query = `UPDATE users SET name = ?, email = ? WHERE id = ?`;
        params = [name, email, id];
    }

    db.run(query, params, function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, message: "Database update failed." });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "Profile updated successfully." });
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is live on http://localhost:${PORT}`);
});