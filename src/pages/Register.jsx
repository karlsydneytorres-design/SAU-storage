import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/variables.css';
import '../styles/global.css';
import '../styles/Register.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Helper to create logs
    const addLogEntry = (userName, action, details) => {
        const logs = JSON.parse(localStorage.getItem("systemLogs")) || [];
        const newLog = {
            timestamp: new Date().toLocaleString(),
            user: userName.toUpperCase(),
            action: action.toUpperCase(),
            details: details
        };
        localStorage.setItem("systemLogs", JSON.stringify([newLog, ...logs]));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Original logic: Generate ID from email (splitting at '@')
        const studentId = formData.email.split('@')[0].toUpperCase();

        if (formData.password !== formData.confirmPassword) {
            return alert("Passwords do not match!");
        }

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: studentId, 
                    name: formData.fullname, 
                    email: formData.email, 
                    password: formData.password, 
                    role: 'Employee 3' // FIXED: Updated from 'Student' to 'Employee 3'
                })
            });

            const data = await response.json();

            if (data.success) {
                // Storing session info 
                sessionStorage.setItem("userId", studentId);
                sessionStorage.setItem("userName", formData.fullname);
                sessionStorage.setItem("userRole", 'Employee 3'); // FIXED: Updated to match role logic

                // Log the successful registration
                addLogEntry(formData.fullname, "REGISTER", `New employee 3 account created: ${studentId}`);

                alert(`Welcome, ${formData.fullname}! Registration successful.`);
                
                // FIXED: Direct to dashboard instead of main
                navigate('/dashboard'); 
            } else {
                alert("Registration failed: " + data.message);
            }
        } catch (error) {
            console.error("Connection error:", error);
            alert("Could not connect to the server. Make sure your backend is running.");
        }
    };

    return (
        <div className="reg-container">
            <div className="reg-card"> 
                <header className="reg-header">
                    <h2>PamSU-SAU RMS</h2>
                    <p>Scholarship Affairs Unit Management System</p>
                </header>

                <form className="reg-form" onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            name="fullname"
                            placeholder="LAST NAME, FIRST NAME" 
                            value={formData.fullname}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Institutional Email</label>
                        <input 
                            type="email" 
                            name="email"
                            placeholder="IDNUMBER@PAMSU.EDU.PH" 
                            value={formData.email}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            name="password"
                            placeholder="ENTER PASSWORD"
                            value={formData.password}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input 
                            type="password" 
                            name="confirmPassword"
                            placeholder="CONFIRM PASSWORD"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <button type="submit" className="reg-submit-btn">
                        REGISTER & GO TO DASHBOARD
                    </button>

                    <div className="reg-footer">
                        <Link to="/">Already have an account? Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;