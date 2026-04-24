import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx'; 
import '../styles/bankinfo.css';
import '../styles/Main.css'; 

const BankInfo = () => {
    const navigate = useNavigate();
    const [awardRecords, setAwardRecords] = useState([]);
    const [bankRecords, setBankRecords] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    
    // User Context
    const userName = sessionStorage.getItem("userName") || "USER";
    const userRole = sessionStorage.getItem("userRole") || "Employee 2";

    // View Filters
    const [filterCampus, setFilterCampus] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("all");

    // Advanced Filters
    const [exportFilters, setExportFilters] = useState({
        batch: "",
        semester: "",
        year: "",
        studentId: "",
        searchQuery: ""
    });

    // Form State
    const [formData, setFormData] = useState({
        scholarshipType: "", awardNo: "", studentId: "", lastName: "",
        firstName: "", middleName: "", campus: "", accountNumber: "",
        program: "", yearLevel: "", semester: "", amount: "", dateReceived: ""
    });

    useEffect(() => {
        const awards = JSON.parse(localStorage.getItem("awardRecords")) || [];
        const banks = JSON.parse(localStorage.getItem("bankRecords")) || [];
        setAwardRecords(awards);
        setBankRecords(banks);
    }, []);

    // --- FILTER LOGIC ---
    const filteredData = awardRecords.filter((student) => {
        const bank = bankRecords.find(b => b.studentId === student.studentId) || {};
        
        const matchesCampus = filterCampus === "ALL" || (bank.campus || student.campus) === filterCampus;
        const matchesStatus = filterStatus === "all" || 
                             (filterStatus === "missing" && !bank.accountNumber) || 
                             (filterStatus === "existing" && bank.accountNumber);
        const matchesSemester = !exportFilters.semester || (bank.semester || student.semester) === exportFilters.semester;
        const matchesStudentId = !exportFilters.studentId || student.studentId.includes(exportFilters.studentId);
        
        const sQuery = exportFilters.searchQuery.toLowerCase();
        const matchesSearch = !exportFilters.searchQuery || 
                             student.lastName.toLowerCase().includes(sQuery) ||
                             student.firstName.toLowerCase().includes(sQuery) ||
                             (student.program && student.program.toLowerCase().includes(sQuery));

        return matchesCampus && matchesStatus && matchesSemester && matchesStudentId && matchesSearch;
    });

    const addLogEntry = (action, details) => {
        const logs = JSON.parse(localStorage.getItem("systemLogs")) || [];
        const newLog = {
            timestamp: new Date().toLocaleString(),
            user: userName.toUpperCase(),
            action: action.toUpperCase(),
            details: details
        };
        localStorage.setItem("systemLogs", JSON.stringify([newLog, ...logs]));
    };

    const formatAmount = (num) => {
        if (!num) return "0";
        return Number(num).toLocaleString("en-PH");
    };

    // --- EXCEL EXPORT ---
    const handleExportXLSX = (fullDatabase = false) => {
        const targetData = fullDatabase ? awardRecords : filteredData;

        let dataToExport = targetData.map(student => {
            const bank = bankRecords.find(b => b.studentId === student.studentId) || {};
            return {
                "Scholarship Type": student.scholarshipType || "",
                "Award Number": student.awardNo || "",
                "Student ID": student.studentId || "",
                "Last Name": student.lastName || "",
                "First Name": student.firstName || "",
                "Middle Name": student.middleName || "",
                "Campus": bank.campus || student.campus || "",
                "Account Number": bank.accountNumber || "MISSING",
                "Program": student.program || "",
                "Year Level": student.yearLevel || "",
                "Semester": bank.semester || student.semester || "",
                "Amount": bank.amount || student.amount || 0,
                "Date Received": bank.dateReceived || "-"
            };
        });

        if (dataToExport.length === 0) return alert("No records found to export.");

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bank Records");
        XLSX.writeFile(workbook, `Bank_Export_${new Date().getTime()}.xlsx`);
        addLogEntry("EXPORT_XLSX", `Exported ${dataToExport.length} records.`);
        setShowExportMenu(false);
    };

    // --- EXCEL IMPORT (FIXED) ---
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(ws);

                let currentBanks = [...bankRecords];
                let currentAwards = [...awardRecords];

                rawData.forEach(row => {
                    const sId = String(row["Student ID"] || "");
                    if (!sId) return;

                    // Update Bank Data
                    const bankItem = {
                        studentId: sId,
                        campus: row["Campus"] || "",
                        accountNumber: String(row["Account Number"] || ""),
                        semester: row["Semester"] || "",
                        amount: row["Amount"] || "",
                        dateReceived: row["Date Received"] || ""
                    };

                    // Update Award (Master) Data - Required to make them show in table
                    const awardItem = {
                        scholarshipType: row["Scholarship Type"] || "",
                        awardNo: row["Award Number"] || "",
                        studentId: sId,
                        lastName: row["Last Name"] || "",
                        firstName: row["First Name"] || "",
                        middleName: row["Middle Name"] || "",
                        program: row["Program"] || "",
                        yearLevel: row["Year Level"] || "",
                        campus: row["Campus"] || "",
                        semester: row["Semester"] || "",
                        amount: row["Amount"] || ""
                    };

                    const bIndex = currentBanks.findIndex(b => b.studentId === sId);
                    if (bIndex !== -1) {
                        currentBanks[bIndex] = { ...currentBanks[bIndex], ...bankItem };
                    } else {
                        currentBanks.push(bankItem);
                    }

                    const aIndex = currentAwards.findIndex(a => a.studentId === sId);
                    if (aIndex !== -1) {
                        currentAwards[aIndex] = { ...currentAwards[aIndex], ...awardItem };
                    } else {
                        currentAwards.push(awardItem);
                    }
                });

                setBankRecords(currentBanks);
                setAwardRecords(currentAwards);
                localStorage.setItem("bankRecords", JSON.stringify(currentBanks));
                localStorage.setItem("awardRecords", JSON.stringify(currentAwards));
                
                addLogEntry("IMPORT_XLSX", `Imported ${rawData.length} records.`);
                alert(`Successfully imported ${rawData.length} records!`);
                e.target.value = ""; 
            } catch (error) {
                alert("Import failed. Check file format.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const editBankRecord = (studentId) => {
        const student = awardRecords.find(s => s.studentId === studentId);
        if (!student) return alert("Student record not found.");

        const bIndex = bankRecords.findIndex(b => b.studentId === studentId);
        const bank = bIndex !== -1 ? bankRecords[bIndex] : {};

        setEditIndex(bIndex !== -1 ? bIndex : "NEW");
        setFormData({
            scholarshipType: student.scholarshipType || "",
            awardNo: student.awardNo || "",
            studentId: student.studentId || "",
            lastName: student.lastName || "",
            firstName: student.firstName || "",
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
        } else { 
            updatedBanks[editIndex] = record; 
        }

        setBankRecords(updatedBanks);
        localStorage.setItem("bankRecords", JSON.stringify(updatedBanks));
        alert("Record Saved!");
        setEditIndex(null);
        setFormData({ scholarshipType: "", awardNo: "", studentId: "", lastName: "", firstName: "", middleName: "", campus: "", accountNumber: "", program: "", yearLevel: "", semester: "", amount: "", dateReceived: "" });
        e.target.reset();
    };

    return (
        <div className="main-wrapper">
            <header className="app-header">
                <div className="header-container">
                    <div className="header-left">
                        <img src="/style/images/sau-logo-rms.png" className="logo" alt="Logo" />
                    </div>
                    <nav className="header-nav">
                        <Link to="/main" className="nav-link">Main View</Link>
                        <Link to="/Sadmin" className="nav-link">User Control</Link>
                        <Link to="/logs" className="nav-link">System Logs</Link>
                        <Link to="/bankinfo" className="nav-link">Bank Info</Link>
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    </nav>
                    <div className="header-right">
                        <div className="user-dropdown">
                            <div className="user-badge" onClick={() => setShowDropdown(!showDropdown)}>
                                <div className="user-details-text">
                                    <span>{userName.toUpperCase()}</span>
                                    <span>{userRole.toUpperCase()}</span>
                                </div>
                                <div className="user-avatar-small">{userName.charAt(0).toUpperCase()}</div>
                                <span className="dropdown-arrow">▼</span>
                            </div>
                            <div className={`dropdown-content ${showDropdown ? 'show' : ''}`}>
                                <button onClick={() => {sessionStorage.clear(); navigate('/');}} className="logout-link">🚪 Logout</button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                {/* Form Card */}
                <div className="card">
                    <h3 className="card-title">Bank Information Entry</h3>
                    <form onSubmit={handleSaveRecord}>
                        <div className="form-grid">
                            <div className="form-group"><label>Scholarship Type</label><input type="text" value={formData.scholarshipType} onChange={(e) => setFormData({...formData, scholarshipType: e.target.value})} /></div>
                            <div className="form-group"><label>Award No</label><input type="text" value={formData.awardNo} onChange={(e) => setFormData({...formData, awardNo: e.target.value})} /></div>
                            <div className="form-group"><label>Student ID</label><input type="text" value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} /></div>
                            <div className="form-group"><label>Last Name</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></div>
                            <div className="form-group"><label>First Name</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></div>
                            <div className="form-group"><label>Middle Name</label><input type="text" value={formData.middleName} onChange={(e) => setFormData({...formData, middleName: e.target.value})} /></div>
                            <div className="form-group">
                                <label>Campus</label>
                                <select value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})}>
                                    <option value="">SELECT</option>
                                    <option value="BACOLOR">BACOLOR</option>
                                    <option value="MEXICO">MEXICO</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Account #</label><input type="text" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} /></div>
                            <div className="form-group"><label>Program</label><input type="text" value={formData.program} onChange={(e) => setFormData({...formData, program: e.target.value})} /></div>
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
                            <div className="form-group"><label>Semester</label><input type="text" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} /></div>
                            <div className="form-group"><label>Amount</label><input type="text" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} /></div>
                            <div className="form-group"><label>Date</label><input type="date" value={formData.dateReceived} onChange={(e) => setFormData({...formData, dateReceived: e.target.value})} /></div>
                            <div className="form-group"><label>Signature</label><input type="file" id="bankSignature" accept="image/*" /></div>
                            <div className="form-group"><label>Proof</label><input type="file" id="bankProofOfBilling" accept="image/*" /></div>
                        </div>
                        <button type="submit" className="primary">Save Record</button>
                    </form>
                </div>

                {/* Filter Section */}
                <div className="db-header" style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
                    <h3>Filters & Search</h3>
                    <div className="filter-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '10px' }}>
                        <div className="filter-group">
                            <label>CAMPUS</label>
                            <select value={filterCampus} onChange={(e) => setFilterCampus(e.target.value)} style={{width: '100%', padding: '8px'}}>
                                <option value="ALL">ALL CAMPUSES</option>
                                <option value="BACOLOR">BACOLOR</option>
                                <option value="MEXICO">MEXICO</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>ACC. STATUS</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{width: '100%', padding: '8px'}}>
                                <option value="all">ALL</option>
                                <option value="existing">EXISTING</option>
                                <option value="missing">MISSING</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>SEMESTER</label>
                            <select value={exportFilters.semester} onChange={(e) => setExportFilters({...exportFilters, semester: e.target.value})} style={{width: '100%', padding: '8px'}}>
                                <option value="">ALL SEMESTERS</option>
                                <option value="1ST SEMESTER">1ST SEMESTER</option>
                                <option value="2ND SEMESTER">2ND SEMESTER</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>STUDENT ID</label>
                            <input type="text" placeholder="Search ID..." value={exportFilters.studentId} onChange={(e) => setExportFilters({...exportFilters, studentId: e.target.value})} style={{width: '100%', padding: '8px'}} />
                        </div>
                    </div>

                    <div className="db-controls" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <input className="search-box" placeholder="SEARCH NAME/PROGRAM..." value={exportFilters.searchQuery} onChange={(e) => setExportFilters({...exportFilters, searchQuery: e.target.value})} style={{ flex: 1, padding: '10px' }} />
                        
                        <div style={{ position: 'relative' }}>
                            <button className="export-btn" onClick={() => setShowExportMenu(!showExportMenu)} style={{ background: '#27ae60', padding: '10px 20px', color: 'white', borderRadius: '4px' }}>
                                📊 EXPORT ({filteredData.length}) ▼
                            </button>
                            {showExportMenu && (
                                <div className="export-menu" style={{ position: 'absolute', right: 0, top: '45px', background: 'white', border: '1px solid #ccc', zIndex: 100, width: '200px' }}>
                                    <button onClick={() => handleExportXLSX(false)} style={{ width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left' }}>Export Filtered View</button>
                                    <button onClick={() => handleExportXLSX(true)} style={{ width: '100%', padding: '10px', borderTop: '1px solid #eee', background: 'none', textAlign: 'left' }}>Export Full Database</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="card table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Scholarship</th>
                                <th>Award No</th>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Program</th>
                                <th>Campus</th>
                                <th>Account #</th>
                                <th>Sem</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((student, i) => {
                                    const bank = bankRecords.find(b => b.studentId === student.studentId) || {};
                                    return (
                                        <tr key={student.studentId}>
                                            <td>{i + 1}</td>
                                            <td>{student.scholarshipType}</td>
                                            <td>{student.awardNo}</td>
                                            <td>{student.studentId}</td>
                                            <td>{student.lastName}, {student.firstName}</td>
                                            <td>{student.program}</td>
                                            <td>{bank.campus || student.campus}</td>
                                            <td className={bank.accountNumber ? 'acc-existing' : 'acc-missing'}>
                                                {bank.accountNumber || "MISSING"}
                                            </td>
                                            <td>{bank.semester || student.semester}</td>
                                            <td>{formatAmount(bank.amount || student.amount)}</td>
                                            <td style={{ display: 'flex', gap: '5px' }}>
                                                <button className="view" onClick={() => navigate(`/studentprofile?id=${student.studentId}`)}>View</button>
                                                <button className="edit" onClick={() => editBankRecord(student.studentId)}>Edit</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="11" style={{textAlign: 'center', padding: '20px'}}>No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BankInfo;