import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Main.css'; 

const Main = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState(JSON.parse(localStorage.getItem("awardRecords")) || []);
    const [showDropdown, setShowDropdown] = useState(false);
    const [search, setSearch] = useState("");
    const [editIndex, setEditIndex] = useState(null);
    
    const [formData, setFormData] = useState({
        batch: "", awardNo: "", studentId: "", lastName: "", firstName: "",
        middleName: "", sex: "", campus: "", program: "", yearLevel: "",
        semester: "", amount: "", scholarshipType: ""
    });

    const userName = sessionStorage.getItem("userName") || "ADMIN";
    const userRole = sessionStorage.getItem("userRole") || "USER"; 

    // Helper to create logs
    const addLogEntry = (action, details) => {
        const logs = JSON.parse(localStorage.getItem("systemLogs")) || [];
        const newLog = {
            timestamp: new Date().toLocaleString(),
            user: userName.toUpperCase(),
            action: action,
            details: details
        };
        localStorage.setItem("systemLogs", JSON.stringify([newLog, ...logs]));
    };

    const handleSave = (e) => {
        e.preventDefault();
        const newRecord = { ...formData, dateReceived: new Date().toLocaleDateString() };
        let updatedRecords = [...records];

        if (editIndex !== null) {
            updatedRecords[editIndex] = newRecord;
            addLogEntry("UPDATE", `Modified student record: ${formData.studentId} (${formData.lastName})`);
            setEditIndex(null);
        } else {
            if (records.some(r => r.studentId === formData.studentId)) {
                alert("Error: Student ID already exists!");
                return;
            }
            updatedRecords.push(newRecord);
            addLogEntry("CREATE", `Added new student record: ${formData.studentId}`);
        }

        setRecords(updatedRecords);
        localStorage.setItem("awardRecords", JSON.stringify(updatedRecords));
        resetForm();
        alert("Success: Record saved!");
    };

    const resetForm = () => {
        setFormData({ batch: "", awardNo: "", studentId: "", lastName: "", firstName: "", middleName: "", sex: "", campus: "", program: "", yearLevel: "", semester: "", amount: "", scholarshipType: "" });
        setEditIndex(null);
    };

    const handleDelete = (index) => {
        if (window.confirm("Delete this record?")) {
            const targetRecord = records[index];
            const updated = records.filter((_, i) => i !== index);
            setRecords(updated);
            localStorage.setItem("awardRecords", JSON.stringify(updated));
            addLogEntry("DELETE", `Removed student record: ${targetRecord.studentId}`);
        }
    };

    const filteredRecords = records.filter(r => 
        `${r.studentId} ${r.lastName} ${r.firstName} ${r.program}`.toUpperCase().includes(search.toUpperCase())
    );

    const totalAmount = filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return (
        <div className="main-wrapper">
            <header className="app-header">
                <div className="header-container">
                    <div className="header-left">
                        <img src="/style/images/sau-logo-rms.png" className="logo" alt="Logo" />
                        <div className="brand-text"><h1>PamSU-SAU RMS</h1></div>
                    </div>
                    <nav className="header-nav">
                        <Link to="/main" className={`nav-link ${window.location.pathname === '/main' ? 'active' : ''}`}>Main View</Link>
                        {userRole === "Superadmin" && (
                            <>
                                <Link to="/sadmin" className="nav-link">User Control</Link>
                                <Link to="/logs" className="nav-link">System Logs</Link>
                                <Link to="/bankinfo" className="nav-link">Bank Info</Link>
                            </>
                        )}
                        <Link to="#" className="nav-link">Dashboard</Link>
                    </nav>
                    <div className="header-right">
                        <div className="user-dropdown">
                            <div className="user-badge" onClick={() => setShowDropdown(!showDropdown)}>
                                <div className="user-details-text">
                                    <span id="welcomeName">{userName.toUpperCase()}</span>
                                    <span id="welcomeRole">{userRole.toUpperCase()}</span>
                                </div>
                                <div className="user-avatar-small">{userName.charAt(0).toUpperCase()}</div>
                                <span className="dropdown-arrow">▼</span>
                            </div>
                            <div className={`dropdown-content ${showDropdown ? 'show' : ''}`}>
                                <Link to="#">⚙️ Settings</Link>
                                <hr />
                                <a href="#" onClick={() => {sessionStorage.clear(); navigate('/');}} className="logout-link">🚪 Logout</a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                <div className="dashboard">
                    <div className="card"><h3>Total Scholarships</h3><h2>{filteredRecords.length}</h2></div>
                    <div className="card"><h3>Total Amount</h3><h2>₱{totalAmount.toLocaleString('en-PH', {minimumFractionDigits: 2})}</h2></div>
                    <div className="card"><h3>Total Male</h3><h2>{filteredRecords.filter(r => r.sex === "MALE").length}</h2></div>
                    <div className="card"><h3>Total Female</h3><h2>{filteredRecords.filter(r => r.sex === "FEMALE").length}</h2></div>
                </div>

                <div className="card">
                    <h3 className="card-title">Student Information Entry</h3>
                    <form onSubmit={handleSave} className="entry-form">
                        <div className="form-grid">
                            <div className="form-group"><label>Batch</label><input value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} required /></div>
                            <div className="form-group"><label>Award No</label><input value={formData.awardNo} onChange={e => setFormData({...formData, awardNo: e.target.value})} /></div>
                            <div className="form-group"><label>Student ID</label><input value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} required /></div>
                            <div className="form-group"><label>Last Name</label><input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required /></div>
                            
                            <div className="form-group"><label>Given Name</label><input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required /></div>
                            <div className="form-group"><label>Middle Name</label><input value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} /></div>
                            <div className="form-group">
                                <label>Sex</label>
                                <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} required>
                                    <option value="">SELECT SEX</option>
                                    <option>MALE</option><option>FEMALE</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Campus</label>
                                <select value={formData.campus} onChange={e => setFormData({...formData, campus: e.target.value})} required>
                                    <option value="">SELECT CAMPUS</option>
                                    <option>BACOLOR</option><option>MEXICO</option><option>PORAC</option>
                                </select>
                            </div>

                            <div className="form-group"><label>Degree Program</label><input value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} /></div>
                            <div className="form-group">
                                <label>Year Level</label>
                                <select value={formData.yearLevel} onChange={e => setFormData({...formData, yearLevel: e.target.value})}>
                                    <option value="">SELECT YEAR</option>
                                    <option>1ST YEAR</option><option>2ND YEAR</option><option>3RD YEAR</option><option>4TH YEAR</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Semester</label>
                                <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                                    <option value="">SELECT SEMESTER</option>
                                    <option>1ST SEMESTER</option><option>2ND SEMESTER</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Amount</label><input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
                            
                            <div className="form-group full-width">
                                <label>Scholarship Type</label>
                                <input value={formData.scholarshipType} onChange={e => setFormData({...formData, scholarshipType: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn">Save Student Record</button>
                            <button type="button" className="clear-btn" onClick={resetForm}>Clear Form</button>
                        </div>
                    </form>
                </div>

                <div className="card">
                    <div className="db-header">
                        <h3>Student Records Database</h3>
                        <div className="db-controls">
                            <input className="search-box" placeholder="SEARCH RECORDS..." onChange={(e) => setSearch(e.target.value)} />
                            <button className="export-btn">Export Records</button>
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Seq</th><th>Batch</th><th>Student ID</th><th>Last Name</th><th>Given Name</th>
                                    <th>Program</th><th>Campus</th><th>Year</th><th>Semester</th><th>Date</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((r, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td className="batch-cell">{r.batch}</td>
                                        <td>{r.studentId}</td>
                                        <td>{r.lastName}</td>
                                        <td>{r.firstName}</td>
                                        <td>{r.program}</td>
                                        <td>{r.campus}</td>
                                        <td>{r.yearLevel}</td>
                                        <td>{r.semester}</td>
                                        <td>{r.dateReceived}</td>
                                        <td className="actions">
                                            <button className="view" onClick={() => navigate(`/studentprofile?id=${r.studentId}`)} style={{ backgroundColor: '#007bff', color: 'white' }}>View</button>
                                            <button className="edit" onClick={() => { setEditIndex(i); setFormData(r); window.scrollTo(0,0); }}>Edit</button>
                                            <button className="delete" onClick={() => handleDelete(i)}>Del</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Main;