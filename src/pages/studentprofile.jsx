import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/studentprofile.css';

const StudentProfile = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const studentIdFromUrl = searchParams.get("id");
    
    const [records, setRecords] = useState([]);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [formData, setFormData] = useState({
        studentId: "", batch: "", awardNo: "", lastName: "", firstName: "",
        middleName: "", sex: "", academicYear: "", semester: "",
        scholarshipType: "", barangay: "", town: "", province: "",
        program: "", yearLevel: "", gwa: "", units: "", amount: "",
        status: "", remarks: "", photo: ""
    });

    useEffect(() => {
        const storedRecords = JSON.parse(localStorage.getItem("awardRecords")) || [];
        setRecords(storedRecords);

        if (!studentIdFromUrl) {
            alert("No student ID provided.");
            navigate('/main');
            return;
        }

        const student = storedRecords.find(r => r.studentId === studentIdFromUrl);
        if (!student) {
            alert("Student record not found.");
            navigate('/main');
        } else {
            setFormData(student);
            if (student.photo) setPhotoPreview(student.photo);
        }
    }, [studentIdFromUrl, navigate]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const saveProfile = (e) => {
        e.preventDefault();
        
        const updatedStudent = { ...formData, photo: photoPreview };
        const updatedRecords = records.map(r => 
            r.studentId === studentIdFromUrl ? updatedStudent : r
        );

        localStorage.setItem("awardRecords", JSON.stringify(updatedRecords));
        
        // Show Success Toast
        const toast = document.createElement("div");
        toast.className = "save-toast";
        toast.innerText = "Profile saved! Redirecting...";
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
            navigate('/main');
        }, 1500);
    };

    const exportProfile = () => {
        const exportOption = document.getElementById("exportOption").value;
        const exportData = { ...formData };

        if (exportOption === "noPhoto") {
            exportData.photo = "Photo not included";
        } else if (exportData.photo && exportData.photo.length > 32000) {
            exportData.photo = "Photo too large to include";
        }

        const ws = XLSX.utils.json_to_sheet([exportData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "StudentProfile");
        XLSX.writeFile(wb, `${formData.studentId}_Profile.xlsx`);
    };

    return (
        <div className="profile-page-wrapper">
            <header className="app-header">
                <Link to="/main">
                    <img src="style/images/sau-logo-rms.png" className="logo" alt="Logo" />
                </Link>
                <h2>Student Profile</h2>
                <nav className="header-nav">
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/studentprofile" className="nav-link active">Student Profile</Link>
                    <Link to="/bankinfo" className="nav-link">Bank Information</Link>
                </nav>
            </header>

            <div className="container">
                <div className="card">
                    <h3>Profile Details</h3>
                    <form id="profileForm" onSubmit={saveProfile}>
                        <div className="form-group">
                            <label>Student ID</label>
                            <input id="studentId" value={formData.studentId} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Batch</label>
                            <input id="batch" value={formData.batch} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Award No</label>
                            <input id="awardNo" value={formData.awardNo} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input id="lastName" value={formData.lastName} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>First Name</label>
                            <input id="firstName" value={formData.firstName} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Middle Name</label>
                            <input id="middleName" value={formData.middleName} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Sex</label>
                            <select id="sex" value={formData.sex} onChange={handleInputChange} required>
                                <option value="">Select Sex</option>
                                <option>MALE</option>
                                <option>FEMALE</option>
                                <option>PREFER NOT TO SAY</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Academic Year</label>
                            <select id="academicYear" value={formData.academicYear} onChange={handleInputChange} required>
                                <option value="">Select Academic Year</option>
                                {["2023-2024", "2024-2025", "2025-2026"].map(yr => <option key={yr}>{yr}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Semester</label>
                            <select id="semester" value={formData.semester} onChange={handleInputChange} required>
                                <option value="">Select Semester</option>
                                <option>FIRST SEMESTER</option>
                                <option>SECOND SEMESTER</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Scholarship Type</label>
                            <input id="scholarshipType" value={formData.scholarshipType} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Barangay</label>
                            <input id="barangay" value={formData.barangay} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Municipality / City</label>
                            <input id="town" value={formData.town} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Province</label>
                            <select id="province" value={formData.province} onChange={handleInputChange} required>
                                <option value="">Select Province</option>
                                <option>PAMPANGA</option>
                                <option>BULACAN</option>
                                <option>BATAAN</option>
                                <option>NUEVA ECIJA</option>
                                <option>TARLAC</option>
                                <option>ZAMBALES</option>
                                <option>AURORA</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Program</label>
                            <input id="program" value={formData.program} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Year Level</label>
                            <input id="yearLevel" value={formData.yearLevel} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>GWA</label>
                            <input id="gwa" value={formData.gwa} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Units</label>
                            <input id="units" value={formData.units} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Amount</label>
                            <input id="amount" value={formData.amount} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select id="status" value={formData.status} onChange={handleInputChange} required>
                                <option value="">Select Status</option>
                                <option>PENDING</option>
                                <option>APPROVED</option>
                                <option>RELEASED</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Remarks</label>
                            <select id="remarks" value={formData.remarks} onChange={handleInputChange} required>
                                <option value="">Select Remarks</option>
                                <option>GENERAL PAYROLL</option>
                                <option>ARCHIVING</option>
                            </select>
                        </div>
                        
                        <div className="form-group full-width">
                            <label>Upload Photo</label>
                            <input type="file" id="photo" accept="image/*" onChange={handlePhotoChange} />
                            {photoPreview && <img src={photoPreview} id="photoPreview" alt="Preview" style={{ maxWidth: '150px', marginTop: '10px' }} />}
                        </div>

                        <button type="submit" className="primary">Save Profile</button>
                    </form>

                    <div className="export-section" style={{ marginTop: '25px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Export Option</label>
                            <select id="exportOption">
                                <option value="noPhoto">Export without Photo</option>
                                <option value="withPhoto">Export with Photo</option>
                            </select>
                        </div>
                        <button onClick={exportProfile} className="export-btn" style={{ padding: '10px', background: '#ffd700', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Export Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;