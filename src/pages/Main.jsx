import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase'; // Import your supabase client
import * as XLSX from 'xlsx';
import '../styles/Main.css'; 

const Main = () => {
    const navigate = useNavigate();
    
    // --- STATE MANAGEMENT ---
    // Change initial state to empty array; we will fetch from Supabase
    const [records, setRecords] = useState([]); 
    const [showDropdown, setShowDropdown] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [search, setSearch] = useState("");
    const [editIndex, setEditIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    const [exportFilters, setExportFilters] = useState({
        batch: "", semester: "", year: "", studentId: ""
    });

    const [formData, setFormData] = useState({
        batch: "", awardNo: "", studentId: "", lastName: "", firstName: "",
        middleName: "", sex: "", campus: "", program: "", yearLevel: "",
        semester: "", amount: "", scholarshipType: ""
    });

    const userName = sessionStorage.getItem("userName") || "ADMIN";
    const userRole = sessionStorage.getItem("userRole") || "USER"; 

    // --- NEW: FETCH DATA FROM SUPABASE ---
    const fetchRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('awardRecords')
            .select('*');
        
        if (error) {
            console.error("Fetch Error:", error);
        } else {
            setRecords(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    // --- LOGIC: SYSTEM LOGS ---
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

    // --- LOGIC: SAVE / UPDATE TO SUPABASE ---
    const handleSave = async (e) => {
        e.preventDefault();
        const processedAmount = formData.amount === "" ? 0 : formData.amount;
        const newRecord = { 
            ...formData, 
            amount: processedAmount, 
            dateReceived: formData.dateReceived || new Date().toLocaleDateString() 
        };
        
        if (editIndex !== null) {
            // Update Supabase
            const { error } = await supabase
                .from('awardRecords')
                .update(newRecord)
                .eq('studentId', formData.studentId); // Fix: Remove extra quotes if possible

            if (error) {
                alert("Update Error: " + error.message);
                return;
            }
            addLogEntry("UPDATE", `Modified student: ${formData.studentId}`);
        } else {
            // Check existence in Supabase
            const { data: existing } = await supabase
                .from('awardRecords')
                .select('studentId')
                .eq('studentId', formData.studentId)
                .single();

            if (existing) {
                alert("Error: Student ID already exists!");
                return;
            }

            const { error } = await supabase
                .from('awardRecords')
                .insert([newRecord]);

            if (error) {
                alert("Insert Error: " + error.message);
                return;
            }
            addLogEntry("CREATE", `Added student: ${formData.studentId}`);
        }

        fetchRecords(); // Refresh list
        resetForm();
        alert("Success: Record saved!");
    };

    const resetForm = () => {
        setFormData({ batch: "", awardNo: "", studentId: "", lastName: "", firstName: "", middleName: "", sex: "", campus: "", program: "", yearLevel: "", semester: "", amount: "", scholarshipType: "" });
        setEditIndex(null);
    };

    const handleDelete = async (originalIndex) => {
        if (window.confirm("Delete this record permanently?")) {
            const targetRecord = records[originalIndex];
            
            const { error } = await supabase
                .from('awardRecords')
                .delete()
                .eq('studentId', targetRecord.studentId);

            if (error) {
                alert("Delete Error: " + error.message);
                return;
            }

            fetchRecords(); // Refresh list
            addLogEntry("DELETE", `Removed student: ${targetRecord.studentId}`);
        }
    };

    // --- LOGIC: FUZZY IMPORT ---
    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            const newRecordsToPush = [];

            jsonData.forEach(item => {
                const getVal = (possibleNames) => {
                    const foundKey = Object.keys(item).find(key => 
                        possibleNames.includes(key.trim().toUpperCase())
                    );
                    return foundKey ? String(item[foundKey]).trim() : "";
                };

                const sId = getVal(["STUDENT ID", "STUDENTID", "ID"]);
                if (sId) {
                    newRecordsToPush.push({
                        batch: getVal(["BATCH"]),
                        awardNo: getVal(["AWARD NO", "AWARDNO", "AWARD #"]),
                        studentId: sId,
                        lastName: getVal(["LAST NAME", "LASTNAME", "SURNAME"]),
                        firstName: getVal(["FIRST NAME", "FIRSTNAME", "GIVEN NAME"]),
                        middleName: getVal(["MIDDLE NAME", "MIDDLENAME"]),
                        sex: getVal(["SEX", "GENDER"]).toUpperCase(),
                        campus: getVal(["CAMPUS"]).toUpperCase(),
                        program: getVal(["PROGRAM", "COURSE", "DEGREE"]),
                        yearLevel: getVal(["YEAR LEVEL", "YEAR"]),
                        semester: getVal(["SEMESTER"]),
                        amount: Number(getVal(["AMOUNT"]) || 0),
                        scholarshipType: getVal(["SCHOLARSHIP TYPE", "TYPE"]),
                        dateReceived: getVal(["DATE", "DATE RECEIVED"]) || new Date().toLocaleDateString(),
                        barangay: getVal(["BARANGAY", "BRGY"]),
                         town: getVal(["TOWN", "MUNICIPALITY", "CITY"]),
                         province: getVal(["PROVINCE"]),
                          gwa: getVal(["GWA", "AVERAGE", "GRADES"]),
                          units: getVal(["UNITS"]),
                         status: getVal(["STATUS"]).toUpperCase() || "PENDING",
                         remarks: getVal(["REMARKS", "NOTES"])
                    });
                }
                
            });

            if (newRecordsToPush.length > 0) {
                const { error } = await supabase.from('awardRecords').insert(newRecordsToPush);
                if (error) {
                    alert("Import Error: " + error.message);
                } else {
                    fetchRecords();
                    addLogEntry("IMPORT", `Imported ${newRecordsToPush.length} records.`);
                    alert(`Successfully imported ${newRecordsToPush.length} records.`);
                }
            }
            e.target.value = ""; 
        };
        reader.readAsArrayBuffer(file);
    };

    // --- LOGIC: EXPORT ---
    const handleExport = (dataToExport, fileName) => {
        const cleanData = dataToExport.map((r, index) => ({
            "No.": index + 1,
            "Batch": r.batch,
            "Student ID": r.studentId,
            "Last Name": r.lastName,
            "First Name": r.firstName,
            "Middle Name": r.middleName,
            "Sex": r.sex,
            "Campus": r.campus,
            "Program": r.program,
            "Year Level": r.yearLevel,
            "Semester": r.semester,
            "Amount": r.amount,
            "Scholarship Type": r.scholarshipType,
            "Date Received": r.dateReceived,
            "Barangay": r.barangay || "",
            "Town/City": r.town || "",
            "Province": r.province || "",
             "GWA": r.gwa || "",
             "Units": r.units || "",
             "Status": r.status || "",
             "Remarks": r.remarks || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(cleanData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        setShowExportDropdown(false);
    };

    // --- FILTER LOGIC ---
    const filteredRecords = records.filter(r => {
        const matchesSearch = `${r.studentId} ${r.lastName} ${r.firstName} ${r.program}`.toUpperCase().includes(search.toUpperCase());
        const matchesBatch = exportFilters.batch === "" || (r.batch && r.batch.toUpperCase().includes(exportFilters.batch.toUpperCase()));
        const matchesSemester = exportFilters.semester === "" || r.semester === exportFilters.semester;
        const matchesStudentId = exportFilters.studentId === "" || r.studentId.includes(exportFilters.studentId);
        const recordYear = r.dateReceived ? r.dateReceived.split('/').pop() : "";
        const matchesYear = exportFilters.year === "" || recordYear === exportFilters.year;

        return matchesSearch && matchesBatch && matchesSemester && matchesYear && matchesStudentId;
    });

    const totalAmount = filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

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
                    <h3 className="card-title">{editIndex !== null ? "📝 Edit Record" : "➕ Information Entry"}</h3>
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
                            <div className="form-group"><label>Amount</label><input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                            <div className="form-group full-width">
                                <label>Scholarship Type</label>
                                <input value={formData.scholarshipType} onChange={e => setFormData({...formData, scholarshipType: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn">{editIndex !== null ? "Update Record" : "Save Record"}</button>
                            <button type="button" className="clear-btn" onClick={resetForm}>Clear / Cancel</button>
                        </div>
                    </form>
                </div>

                <div className="card">
                    <div className="db-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <h3>Advanced Export Filters</h3>
                        <div className="filter-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', width: '100%', marginTop: '10px', padding: '15px', background: '#f4f7f6', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <div className="filter-group">
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#555' }}>BATCH</label>
                                <input type="text" placeholder="Filter Batch..." value={exportFilters.batch} onChange={(e) => setExportFilters({...exportFilters, batch: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div className="filter-group">
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#555' }}>SEMESTER</label>
                                <select value={exportFilters.semester} onChange={(e) => setExportFilters({...exportFilters, semester: e.target.value})} style={{ width: '100%', padding: '8px' }}>
                                    <option value="">ALL SEMESTERS</option>
                                    <option>1ST SEMESTER</option><option>2ND SEMESTER</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#555' }}>YEAR</label>
                                <input type="number" placeholder="YYYY" value={exportFilters.year} onChange={(e) => setExportFilters({...exportFilters, year: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div className="filter-group">
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#555' }}>STUDENT ID</label>
                                <input type="text" placeholder="Search ID..." value={exportFilters.studentId} onChange={(e) => setExportFilters({...exportFilters, studentId: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={() => setExportFilters({ batch: "", semester: "", year: "", studentId: "" })} style={{ width: '100%', padding: '8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Reset</button>
                            </div>
                        </div>

                        <div className="db-controls" style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <input className="search-box" placeholder="SEARCH BY NAME/PROGRAM..." onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <label className="import-btn" style={{ background: '#3498db', padding: '10px 20px', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                                    📥 IMPORT
                                    <input type="file" accept=".xlsx, .xls" onChange={handleImport} style={{ display: 'none' }} />
                                </label>
                                <div className="export-container" style={{ position: 'relative' }}>
                                    <button className="export-btn" onClick={() => setShowExportDropdown(!showExportDropdown)} style={{ background: '#27ae60', padding: '10px 20px', fontWeight: 'bold' }}>
                                        📊 EXPORT ({filteredRecords.length}) ▼
                                    </button>
                                    {showExportDropdown && (
                                        <div className="export-menu" style={{ position: 'absolute', right: 0, top: '45px', background: 'white', border: '1px solid #ccc', zIndex: 100, width: '220px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                            <button onClick={() => handleExport(filteredRecords, "Filtered_Report")} style={{ width: '100%', textAlign: 'left', padding: '12px', border: 'none', background: 'none', cursor: 'pointer' }}>Export Filtered View</button>
                                            <button onClick={() => handleExport(records, "Full_Database")} style={{ width: '100%', textAlign: 'left', padding: '12px', border: 'none', borderTop: '1px solid #eee', background: 'none', cursor: 'pointer' }}>Export Full Database</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive">
                        {loading ? <p style={{textAlign: 'center', padding: '20px'}}>Loading records...</p> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Seq</th>
                                    <th>Batch</th>
                                    <th>Student ID</th>
                                    <th>Last Name</th>
                                    <th>Given Name</th>
                                    <th>Middle Name</th>
                                    <th>Program</th>
                                    <th>Campus</th>
                                    <th>Year</th>
                                    <th>Semester</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length > 0 ? (
                                    filteredRecords.map((r, i) => {
                                        return (
                                            <tr key={r.studentId || i}>
                                                <td>{i + 1}</td>
                                                <td className="batch-cell">{r.batch}</td>
                                                <td>{r.studentId}</td>
                                                <td>{r.lastName}</td>
                                                <td>{r.firstName}</td>
                                                <td>{r.middleName || "---"}</td>
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
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="12" style={{textAlign: 'center', padding: '20px'}}>No matching records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Main;