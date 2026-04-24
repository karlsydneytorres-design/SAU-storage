import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Dashboard.css';
import '../styles/Main.css'; 

const Dashboard = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [stats, setStats] = useState({
        total: 0, amount: 0, male: 0, female: 0, campuses: {}
    });

    const userName = sessionStorage.getItem("userName") || "USER";
    const userRole = sessionStorage.getItem("userRole") || "Employee 3";

    useEffect(() => {
        const records = JSON.parse(localStorage.getItem("awardRecords")) || [];
        let totalAmount = 0;
        let maleCount = 0;
        let femaleCount = 0;
        const campusCounts = {};

        records.forEach(r => {
            totalAmount += Number(r.amount) || 0;
            const gender = (r.sex || "").toUpperCase();
            if (gender === "MALE") maleCount++;
            if (gender === "FEMALE") femaleCount++;
            const cName = r.campus ? r.campus.toUpperCase() : "UNASSIGNED";
            campusCounts[cName] = (campusCounts[cName] || 0) + 1;
        });

        setStats({ total: records.length, amount: totalAmount, male: maleCount, female: femaleCount, campuses: campusCounts });
    }, []);

    const pesoFormat = (v) => "₱" + Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    return (
        <div className="main-wrapper">
            {/* Header stays same for consistency */}
            <header className="app-header">
                <div className="header-container">
                    <div className="header-left">
                        <img src="/style/images/sau-logo-rms.png" className="logo" alt="Logo" />
                    </div>
                    <nav className="header-nav">
                        {userRole !== "Employee 3" && <Link to="/main" className="nav-link">Main View</Link>}
                        {userRole === "Employee 1" && (
                            <>
                                <Link to="/sadmin" className="nav-link">User Control</Link>
                                <Link to="/logs" className="nav-link">System Logs</Link>
                            </>
                        )}
                        {(userRole === "Employee 1" || userRole === "Employee 2") && <Link to="/bankinfo" className="nav-link">Bank Info</Link>}
                        <Link to="/dashboard" className="nav-link active">Dashboard</Link>
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
                                <a href="#" onClick={() => {sessionStorage.clear(); navigate('/');}} className="logout-link">🚪 Logout</a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-container">
                <div className="dashboard-content">
                    {/* STAT CARDS SECTION */}
                    <div className="dashboard-cards">
                        <div className="stat-card">
                            <h3>Total Scholarships</h3>
                            <p>{stats.total}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Amount</h3>
                            <p>{pesoFormat(stats.amount)}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Male</h3>
                            <p>{stats.male}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Female</h3>
                            <p>{stats.female}</p>
                        </div>
                    </div>

                    {/* CAMPUS DISTRIBUTION SECTION */}
                    <div className="wide-card">
                        <h3 className="section-title">Campus Student Distribution</h3>
                        <div className="campus-grid">
                            {Object.entries(stats.campuses).map(([name, count]) => {
                                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                    <div key={name} className="campus-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                                            <span>{name}</span>
                                            <span>{count} Students ({Math.round(percentage)}%)</span>
                                        </div>
                                        <div className="progress-container">
                                            <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;