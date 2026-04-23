import React, { useState, useEffect } from 'react'; // Added useEffect
import { Link, useLocation } from 'react-router-dom';
import '../styles/logs.css';

const Logs = () => {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // 1. Define state to hold the logs
  const [logs, setLogs] = useState([]);

  // 2. Load logs when the component mounts
  useEffect(() => {
    // We look for 'systemLogs' in localStorage
    const storedLogs = JSON.parse(localStorage.getItem("systemLogs")) || [];
    setLogs(storedLogs);
  }, []);

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <div className="logs-page">
      <header className="app-header">
        <div className="header-container">
          <div className="header-left">
            <img src="/style/images/sau-logo-rms.png" className="logo" alt="Logo" />
            <h1 className="system-title">PamSU-SAU RMS</h1>
          </div>
          
          <nav className="header-nav">
            <Link to="/main" className={isActive('/main')}>Main View</Link>
            <Link to="/bankinfo" className={isActive('/bankinfo')}>Bank Info</Link>
            <Link to="/sadmin" className={isActive('/sadmin')}>User Control</Link>
            <Link to="/logs" className={isActive('/logs')}>System Logs</Link>
          </nav>

          <div className="header-right">
            <div className="user-badge" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="user-details-text">
                <span id="welcomeName">{sessionStorage.getItem("userName") || "SYSTEM ROOT"}</span>
                <span id="welcomeRole">SUPERADMIN</span>
              </div>
              <div className="user-avatar-small">S</div>
            </div>
            
            {showDropdown && (
              <div className="dropdown-content show">
                <Link to="/settings">⚙️ Settings</Link>
                <hr />
                <a href="/" onClick={() => sessionStorage.clear()}>🚪 Logout</a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <div className="card" style={{ marginTop: '20px' }}>
          <h2 style={{ color: 'var(--maroon)', fontSize: '1.2rem', marginBottom: '15px' }}>SYSTEM ACTIVITY LOGS</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>USER</th>
                  <th>ACTION</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {/* 3. Map through the logs state */}
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <tr key={index}>
                      <td>{log.timestamp}</td>
                      <td><strong>{log.user}</strong></td>
                      <td><span className="pill-action">{log.action}</span></td>
                      <td style={{ textAlign: 'left' }}>{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '30px', color: '#666' }}>
                      No logs available in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Logs;