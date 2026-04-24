import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase'; // Import the client you created
import '../styles/variables.css';
import '../styles/global.css';
import '../styles/login.css';

const Login = () => {
  const [email, setEmail] = useState(''); // Changed from username to email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Updated Log Helper to save to Supabase
  const addLogEntry = async (userName, action, details) => {
    try {
      await supabase.from('system_logs').insert([{
        user_name: userName.toUpperCase(),
        action: action.toUpperCase(),
        details: details
      }]);
    } catch (err) {
      console.error("Failed to save log:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Get the user profile/role from your 'users' table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Store session data
      sessionStorage.setItem("userId", profile.id);     
      sessionStorage.setItem("userRole", profile.role);
      sessionStorage.setItem("userName", profile.name);
      
      await addLogEntry(profile.name, "LOGIN", `User logged into the system.`);

      // 4. Role-Based Navigation
      const role = profile.role.toLowerCase().trim();

      if (role === 'employee 1') {
        navigate('/sadmin'); 
      } else if (role === 'employee 2') {
        navigate('/main');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error("Login error:", error.message);
      alert(error.message || "Invalid credentials.");
    } finally {
      setLoading(false);
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
            <label>Institutional Email</label>
            <input 
              type="email" 
              placeholder="Enter your institutional email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "AUTHENTICATING..." : "LOGIN"}
          </button>

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