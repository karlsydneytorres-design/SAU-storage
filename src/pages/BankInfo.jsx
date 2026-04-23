import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/bankinfo.css';

const BankInfo = () => {
    const navigate = useNavigate();
    const [awardRecords, setAwardRecords] = useState([]);
    const [bankRecords, setBankRecords] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Filters
    const [filterCampus, setFilterCampus] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("all");

    // Form State
    const [formData, setFormData] = useState({
        scholarshipType: "", awardNo: "", studentId: "", lastName: "",
        firstName: "", middleName: "", campus: "", accountNumber: "",
        program: "", yearLevel: "", semester: "", amount: "", dateReceived: ""
    });

    // Helper to create logs
    const addLogEntry = (action, details) => {
        const logs = JSON.parse(localStorage.getItem("systemLogs")) || [];
        const newLog = {
            timestamp: new Date().toLocaleString(),
            user: (sessionStorage.getItem("userName") || "ADMIN").toUpperCase(),
            action: action.toUpperCase(),
            details: details
        };
        localStorage.setItem("systemLogs", JSON.stringify([newLog, ...logs]));
    };

    useEffect(() => {
        const awards = JSON.parse(localStorage.getItem("awardRecords")) || [];
        const banks = JSON.parse(localStorage.getItem("bankRecords")) || [];
        setAwardRecords(awards);
        setBankRecords(banks);
    }, []);

    const formatAmount = (num) => {
        if (!num) return "";
        return Number(num).toLocaleString("en-PH");
    };

    const editBankRecord = (studentId) => {
        const student = awardRecords.find(s => s.studentId === studentId);
        if (!student) return alert("Student record not found in Main Database.");

        const bIndex = bankRecords.findIndex(b => b.studentId === studentId);
        const bank = bIndex !== -1 ? bankRecords[bIndex] : {};

        setEditIndex(bIndex !== -1 ? bIndex : "NEW");
        setFormData({
            scholarshipType: student.scholarshipType || "",
            awardNo: student.awardNo || "",
            studentId: student.studentId || "",
            lastName: student.lastName || "",
            firstName: student.firstName || student.givenName || "",
            middleName: student.middleName || "",
            campus: bank.campus || student.campus || "",
            accountNumber: bank.accountNumber || "",
            program: student.program || "",
            yearLevel: student.yearLevel || "",
            semester: bank.semester || student.semester || "",
            amount: bank.amount || student.amount || "",
            dateReceived: bank.dateReceived || ""
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSaveRecord = async (e) => {
        e.preventDefault();
        const sigFile = document.getElementById("bankSignature").files[0];
        const proofFile = document.getElementById("bankProofOfBilling").files[0];

        const toBase64 = file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
        });

        let signatureData = (editIndex !== "NEW" && editIndex !== null) ? bankRecords[editIndex]?.signature : "";
        let proofData = (editIndex !== "NEW" && editIndex !== null) ? bankRecords[editIndex]?.proofOfBilling : "";

        if (sigFile) signatureData = await toBase64(sigFile);
        if (proofFile) proofData = await toBase64(proofFile);

        const record = { ...formData, signature: signatureData, proofOfBilling: proofData };
        let updatedBanks = [...bankRecords];

        if (editIndex === "NEW") { 
            updatedBanks.push(record);
            addLogEntry("BANK_CREATE", `Created bank information for Student ID: ${formData.studentId}`);
        } 
        else { 
            updatedBanks[editIndex] = record; 
            addLogEntry("BANK_UPDATE", `Updated bank information for Student ID: ${formData.studentId}`);
        }

        setBankRecords(updatedBanks);
        localStorage.setItem("bankRecords", JSON.stringify(updatedBanks));
        alert("Record Saved!");
        setEditIndex(null);
        setFormData({ scholarshipType: "", awardNo: "", studentId: "", lastName: "", firstName: "", middleName: "", campus: "", accountNumber: "", program: "", yearLevel: "", semester: "", amount: "", dateReceived: "" });
        e.target.reset();
    };

    return (
        <div className="bank-info-page">
            <header className="app-header">
                <div className="header-container">
                    <div className="header-left">
                        <img src="/style/images/sau-logo-rms.png" className="logo" alt="Logo" />
                        
                        <h1 className="system-title">PamSU-SAU RMS</h1>
                    </div>
                    <nav className="header-nav">
                        <Link to="/main" className="nav-link">Main View</Link>
                        <Link to="/bankinfo" className="nav-link active">Bank Info</Link>
                        <Link to="/sadmin" className="nav-link">User Control</Link>
                    </nav>
                    <div className="header-right">
                        <div className="user-badge" onClick={() => setShowDropdown(!showDropdown)}>
                            <div className="user-details-text">
                                <span id="welcomeName">{sessionStorage.getItem("userName") || "ADMIN"}</span>
                                <span id="welcomeRole">SUPERADMIN</span>
                            </div>
                            <div className="user-avatar-small">A</div>
                        </div>
                        {showDropdown && (
                            <div className="dropdown-content show">
                                <Link to="/settings">⚙️ Settings</Link>
                                <hr />
                                <a href="/" onClick={() => sessionStorage.clear()}>🚪 Logout</a>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="container">
                <div className="card">
                    <h3 className="card-title"><i className="fas fa-file-invoice-dollar"></i> Bank Information Entry</h3>
                    <form onSubmit={handleSaveRecord}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Scholarship Type</label>
                                <input 
                                    type="text"
                                    value={formData.scholarshipType} 
                                    onChange={(e) => setFormData({...formData, scholarshipType: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Award Number</label>
                                <input 
                                    type="text"
                                    value={formData.awardNo} 
                                    onChange={(e) => setFormData({...formData, awardNo: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Student ID No.</label>
                                <input 
                                    type="text"
                                    value={formData.studentId} 
                                    onChange={(e) => setFormData({...formData, studentId: e.target.value})} 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Last Name</label>
                                <input 
                                    type="text"
                                    value={formData.lastName} 
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Given Name</label>
                                <input 
                                    type="text"
                                    value={formData.firstName} 
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Middle Name</label>
                                <input 
                                    type="text"
                                    value={formData.middleName} 
                                    onChange={(e) => setFormData({...formData, middleName: e.target.value})} 
                                />
                            </div>

                            <div className="form-group">
                                <label>Campus</label>
                                <select value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})}>
                                    <option value="">SELECT CAMPUS</option>
                                    <option value="BACOLOR">BACOLOR</option>
                                    <option value="MEXICO">MEXICO</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Landbank Account #</label>
                                <input 
                                    type="text"
                                    value={formData.accountNumber} 
                                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} 
                                    placeholder="10-12 DIGITS" 
                                />
                            </div>
                            <div className="form-group">
                                <label>Degree Program</label>
                                <input 
                                    type="text"
                                    value={formData.program} 
                                    onChange={(e) => setFormData({...formData, program: e.target.value})} 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Year Level</label>
                                <select value={formData.yearLevel} onChange={(e) => setFormData({...formData, yearLevel: e.target.value})}>
                                    <option value="">SELECT</option>
                                    <option value="1ST YEAR">1ST YEAR</option>
                                    <option value="2ND YEAR">2ND YEAR</option>
                                    <option value="3RD YEAR">3RD YEAR</option>
                                    <option value="4TH YEAR">4TH YEAR</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Semester</label>
                                <input 
                                    type="text"
                                    value={formData.semester} 
                                    onChange={(e) => setFormData({...formData, semester: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Amount Received</label>
                                <input 
                                    type="text"
                                    value={formData.amount} 
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Date Received</label>
                                <input 
                                    type="date" 
                                    value={formData.dateReceived} 
                                    onChange={(e) => setFormData({...formData, dateReceived: e.target.value})} 
                                />
                            </div>
                            <div className="form-group"><label>Signature</label><input type="file" id="bankSignature" accept="image/*" /></div>
                            <div className="form-group"><label>Proof of Billing</label><input type="file" id="bankProofOfBilling" accept="image/*" /></div>
                        </div>
                        <button type="submit" className="primary">Save Record</button>
                    </form>
                </div>

                <div className="card search-filter-card">
                    <div className="filter-group">
                        <label>Campus Filter</label>
                        <select onChange={(e) => setFilterCampus(e.target.value.toUpperCase())}>
                            <option value="ALL">ALL CAMPUSES</option>
                            <option value="BACOLOR">BACOLOR</option>
                            <option value="MEXICO">MEXICO</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Account Status</label>
                        <select onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">SHOW ALL</option>
                            <option value="existing">WITH ACCOUNT</option>
                            <option value="missing">MISSING ACCOUNT</option>
                        </select>
                    </div>
                </div>

                <div className="card table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Scholarship</th>
                                <th>Award No</th>
                                <th>Student ID</th>
                                <th>Last Name</th>
                                <th>Given Name</th>
                                <th>Program</th>
                                <th>Campus</th>
                                <th>Account #</th>
                                <th>Year</th>
                                <th>Semester</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {awardRecords.map((student, i) => {
                                const bank = bankRecords.find(b => b.studentId === student.studentId) || {};
                                if (filterStatus === "missing" && bank.accountNumber) return null;
                                if (filterStatus === "existing" && !bank.accountNumber) return null;
                                if (filterCampus !== "ALL" && (bank.campus || student.campus) !== filterCampus) return null;

                                return (
                                    <tr key={student.studentId}>
                                        <td>{i + 1}</td>
                                        <td>{student.scholarshipType}</td>
                                        <td>{student.awardNo}</td>
                                        <td>{student.studentId}</td>
                                        <td>{student.lastName}</td>
                                        <td>{student.firstName}</td>
                                        <td>{student.program}</td>
                                        <td>{bank.campus || student.campus}</td>
                                        <td className={bank.accountNumber ? 'acc-existing' : 'acc-missing'}>
                                            {bank.accountNumber || "MISSING"}
                                        </td>
                                        <td>{student.yearLevel}</td>
                                        <td>{bank.semester || student.semester}</td>
                                        <td>{formatAmount(bank.amount || student.amount)}</td>
                                        <td>{bank.dateReceived || "-"}</td>
                                        <td style={{ display: 'flex', gap: '5px' }}>
                                            <button className="view" onClick={() => navigate(`/studentprofile?id=${student.studentId}`)} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                View
                                            </button>
                                            <button className="edit" onClick={() => editBankRecord(student.studentId)}>
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BankInfo;