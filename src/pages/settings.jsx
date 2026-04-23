import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../style/style.css';
import '../style/Sadmin.css';

const Settings = () => {
    const navigate = useNavigate();
    const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
    
    // Form State
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // 1. Check Session & Load User Data on Mount
    useEffect(() => {
        const userId = sessionStorage.getItem("userId");
        const userName = sessionStorage.getItem("userName");
        const userEmail = sessionStorage.getItem("userEmail");

        if (!userId) {
            alert("Session expired. Please log in again.");
            navigate('/login'); 
            return;
        }

        setFormData(prev => ({
            ...prev,
            id: userId,
            name: userName || "",
            email: userEmail ? userEmail.toUpperCase() : ""
        }));
    }, [navigate]);

    // 2. Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 3. Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Password Verification
        if (formData.password !== "" || formData.confirmPassword !== "") {
            if (formData.password !== formData.confirmPassword) {
                setStatusMsg({ text: "Passwords do not match!", isError: true });
                return;
            }
        }

        try {
            const response = await fetch('http://localhost:3000/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formData.id,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password 
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update local session so the changes persist
                sessionStorage.setItem("userName", formData.name);
                sessionStorage.setItem("userEmail", formData.email);
                
                setStatusMsg({ text: "Account updated successfully!", isError: false });
                
                // Refresh after 1.5 seconds to show updated data
                setTimeout(() => window.location.reload(), 1500); 
            } else {
                setStatusMsg({ text: "Update failed: " + result.message, isError: true });
            }
        } catch (err) {
            console.error("Update error:", err);
            setStatusMsg({ text: "Error connecting to server.", isError: true });
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    return (
        <div className="settings-page">
            <header className="app-header">
                <div className="header-container">
                    <div className="header-left">
                        <img src="/style/images/sau-logo-rms.png" className="logo" alt="Logo" />
                        <h1>Account Settings</h1>
                    </div>
                    <nav className="header-nav">
                        <Link to="/main" className="nav-link">Back to Dashboard</Link>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </nav>
                </div>
            </header>

            <div className="container" style={{ maxWidth: '600px', marginTop: '50px' }}>
                <div className="section-card">
                    <div className="card-header maroon-header">
                        <h2>Edit Profile Information</h2>
                    </div>
                    <div style={{ padding: '25px' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Employee ID</label>
                                <input type="text" value={formData.id} disabled className="disabled-input" />
                            </div>

                            <div className="form-group">
                                <label>Full Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name} 
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email} 
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>New Password (Leave blank to keep current)</label>
                                <input 
                                    type="password" 
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter new password" 
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your new password" 
                                />
                            </div>

                            <button type="submit" className="primary-btn">Save Changes</button>
                        </form>
                        
                        {statusMsg.text && (
                            <div className={`status-message ${statusMsg.isError ? 'error' : 'success'}`} 
                                 style={{ marginTop: '15px', textAlign: 'center', fontWeight: 'bold', color: statusMsg.isError ? '#800000' : '#28a745' }}>
                                {statusMsg.text}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;