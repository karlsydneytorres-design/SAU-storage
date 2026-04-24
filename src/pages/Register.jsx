import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase'; 
import '../styles/variables.css';
import '../styles/global.css';
import '../styles/Register.css';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return alert("Passwords do not match!");
        }

        setLoading(true);
        try {
            // STEP 1: Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // STEP 2: Insert profile into public.users table
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id, 
                        name: formData.fullname,
                        email: formData.email,
                        role: 'Employee 3',
                        student_id: formData.email.split('@')[0].toUpperCase()
                    }]);

                if (profileError) throw profileError;

                // STEP 3: Set local session
                sessionStorage.setItem("userId", authData.user.id);
                sessionStorage.setItem("userName", formData.fullname);
                sessionStorage.setItem("userRole", 'Employee 3');

                alert(`Welcome, ${formData.fullname}!`);
                navigate('/dashboard');
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
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
                        <input type="text" name="fullname" placeholder="LAST NAME, FIRST NAME" value={formData.fullname} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Institutional Email</label>
                        <input type="email" name="email" placeholder="IDNUMBER@PAMSU.EDU.PH" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="ENTER PASSWORD" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" name="confirmPassword" placeholder="CONFIRM PASSWORD" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="reg-submit-btn" disabled={loading}>
                        {loading ? "CREATING ACCOUNT..." : "REGISTER & GO TO DASHBOARD"}
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