import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/variables.css';
import '../styles/global.css';
import '../styles/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (data.success) {
        // Store user data in session
        sessionStorage.setItem("userId", data.user.id);     
        sessionStorage.setItem("userRole", data.user.role);
        sessionStorage.setItem("userName", data.user.name);
        
        addLogEntry(data.user.name, "LOGIN", `User logged into the system.`);

        // --- ROBUST ROLE-BASED NAVIGATION ---
        // We normalize the string to handle any capitalization or spacing issues from the DB
        const role = data.user.role.toLowerCase().trim();

        if (role === 'employee 1') {
          // Superadmin -> User Control
          navigate('/sadmin'); 
        } else if (role === 'employee 2') {
          // Admin -> Records Management
          navigate('/main');
        } else if (role === 'employee 3') {
          // No Role/Student -> Direct to Dashboard
          navigate('/dashboard');
        } else {
          // Fallback for unexpected roles
          navigate('/main');
        }
      } else {
        addLogEntry(username, "AUTH_FAIL", `Failed login attempt: ${username}`);
        alert(data.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Server connection failed.");
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <header className="login-header">
          <h1 className="brand-title">PamSU-SAU RMS</h1>
          <p className="brand-subtitle">Scholarship Affairs Unit Management System</p>
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>ID number</label>
            <input 
              type="text" 
              placeholder="Enter your ID or Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="toggle-pass" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn">LOGIN</button>

          <div className="register-section">
            <p>New to the system?</p>
            <Link to="/register" className="register-btn">CREATE STUDENT ACCOUNT</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;