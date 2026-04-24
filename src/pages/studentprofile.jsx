import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabase'; 
import * as XLSX from 'xlsx';
import '../styles/studentprofile.css';

const StudentProfile = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const studentIdFromUrl = searchParams.get("id");
    
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);

    const [formData, setFormData] = useState({
        studentId: "", batch: "", awardNo: "", lastName: "", firstName: "",
        middleName: "", sex: "", semester: "", scholarshipType: "", 
        barangay: "", town: "", province: "",
        program: "", yearLevel: "", gwa: "", units: "", amount: "",
        status: "", remarks: "", photo: ""
    });

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!studentIdFromUrl) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('awardRecords')
                .select('*')
                .eq('"studentId"', studentIdFromUrl)
                .single();

            if (!error && data) {
                setFormData({
                    studentId: data.studentId || "",
                    batch: data.batch || "",
                    awardNo: data.awardNo || "",
                    lastName: data.lastName || "",
                    firstName: data.firstName || "",
                    middleName: data.middleName || "",
                    sex: data.sex || "",
                    semester: data.semester || "",
                    scholarshipType: data.scholarshipType || "",
                    barangay: data.barangay || "",
                    town: data.town || "",
                    province: data.province || "",
                    program: data.program || "",
                    yearLevel: data.yearLevel || "",
                    gwa: data.gwa || "",
                    units: data.units || "",
                    amount: data.amount || "",
                    status: data.status || "",
                    remarks: data.remarks || "",
                    photo: data.photo_url || ""
                });
                if (data.photo_url) setPhotoPreview(data.photo_url);
            }
            setLoading(false);
        };
        fetchStudentData();
    }, [studentIdFromUrl]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('awardRecords')
                .update({ ...formData, photo_url: photoPreview, updated_at: new Date() })
                .eq('"studentId"', studentIdFromUrl);
            if (error) throw error;
            alert("Profile updated successfully!");
            navigate('/main');
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- EXPORT FUNCTION PRESERVED ---
    const exportProfile = () => {
        const exportOption = document.getElementById("exportOption").value;
        const exportData = { ...formData };
        if (exportOption === "noPhoto") delete exportData.photo;

        const ws = XLSX.utils.json_to_sheet([exportData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "StudentProfile");
        XLSX.writeFile(wb, `${formData.studentId}_Profile.xlsx`);
    };

    return (
        <div className="profile-page-wrapper">
            <header className="app-header">
                <Link to="/main"><img src="style/images/sau-logo-rms.png" className="logo" alt="Logo" /></Link>
                <nav className="header-nav">
                    <Link to="/main" className="nav-link">Main View</Link>
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                </nav>
            </header>

            <div className="container">
                <div className="card">
                    <h3>Student Profile Details</h3>
                    <form id="profileForm" onSubmit={saveProfile}>
                        <div className="form-group"><label>Student ID</label><input id="studentId" value={formData.studentId} readOnly /></div>
                        <div className="form-group"><label>Batch</label><input id="batch" value={formData.batch} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Award No</label><input id="awardNo" value={formData.awardNo} onChange={handleInputChange} required /></div>
                        
                        <div className="form-group"><label>Last Name</label><input id="lastName" value={formData.lastName} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>First Name</label><input id="firstName" value={formData.firstName} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Middle Name</label><input id="middleName" value={formData.middleName} onChange={handleInputChange} /></div>

                        <div className="form-group">
                            <label>Sex</label>
                            <select id="sex" value={formData.sex} onChange={handleInputChange} required>
                                <option value="">Select</option>
                                <option>MALE</option><option>FEMALE</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Semester</label>
                            <select id="semester" value={formData.semester} onChange={handleInputChange} required>
                                <option value="">Select Semester</option>
                                <option>1ST SEMESTER</option>
                                <option>2ND SEMESTER</option>
                            </select>
                        </div>

                        <div className="form-group"><label>Barangay</label><input id="barangay" value={formData.barangay} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Municipality / City</label><input id="town" value={formData.town} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Province</label><input id="province" value={formData.province} onChange={handleInputChange} required /></div>

                        <div className="form-group"><label>Degree Program</label><input id="program" value={formData.program} onChange={handleInputChange} required /></div>
                        <div className="form-group">
                            <label>Year Level</label>
                            <select id="yearLevel" value={formData.yearLevel} onChange={handleInputChange} required>
                                <option value="">Select Year</option>
                                <option>1ST YEAR</option><option>2ND YEAR</option><option>3RD YEAR</option><option>4TH YEAR</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Scholarship Type</label><input id="scholarshipType" value={formData.scholarshipType} onChange={handleInputChange} required /></div>

                        {/* Optional Fields (Removed 'required' attribute) */}
                        <div className="form-group"><label>GWA (Optional)</label><input id="gwa" value={formData.gwa} onChange={handleInputChange} /></div>
                        <div className="form-group"><label>Units (Optional)</label><input id="units" value={formData.units} onChange={handleInputChange} /></div>
                        <div className="form-group"><label>Amount</label><input id="amount" value={formData.amount} onChange={handleInputChange} required /></div>

                        <div className="form-group">
                            <label>Status (Optional)</label>
                            <select id="status" value={formData.status} onChange={handleInputChange}>
                                <option value="">Select Status</option>
                                <option>PENDING</option><option>APPROVED</option><option>RELEASED</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Remarks (Optional)</label>
                            <select id="remarks" value={formData.remarks} onChange={handleInputChange}>
                                <option value="">Select Remarks</option>
                                <option>GENERAL PAYROLL</option><option>ARCHIVING</option>
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label>Update Photo</label>
                            <input type="file" id="photo" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = () => setPhotoPreview(reader.result);
                                if(file) reader.readAsDataURL(file);
                            }} />
                            {photoPreview && <img src={photoPreview} alt="Preview" style={{ maxWidth: '120px', marginTop: '10px', borderRadius: '8px' }} />}
                        </div>

                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? "Saving..." : "Save Profile"}
                        </button>
                    </form>

                    {/* --- EXPORT SECTION PRESERVED --- */}
                    <div className="export-section" style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
                        <select id="exportOption" style={{ flex: 1 }}>
                            <option value="noPhoto">No Photo</option>
                            <option value="withPhoto">Include Photo</option>
                        </select>
                        <button onClick={exportProfile} className="export-btn">Export XLSX</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;