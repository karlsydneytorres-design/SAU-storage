import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Sadmin.css'; 

const Sadmin = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const userName = sessionStorage.getItem("userName") || "ADMIN";
    const userRole = (sessionStorage.getItem("userRole") || "Superadmin");

    // Helper to create logs
    const addLogEntry = (action, details) => {
        const logs = JSON.parse(localStorage.getItem("systemLogs")) || [];
        const newLog = {
            timestamp: new Date().toLocaleString(),
            user: userName.toUpperCase(),
            action: action.toUpperCase(),
            details: details
        };
        localStorage.setItem("systemLogs", JSON.stringify([newLog, ...logs]));
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:3000/users');
            const data = await response.json();
            
            if (data.success && Array.isArray(data.users)) {
                setUsers(data.users); 
            } else {
                setUsers([]); 
            }
        } catch (error) {
            console.error("Connection error:", error);
            setUsers([]); 
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const updateUserRole = async (targetUserId, currentRole) => {
        const newRole = currentRole === 'Admin' ? 'Student' : 'Admin';
        if (!window.confirm(`Change user ${targetUserId} to ${newRole}?`)) return;
        
        try {
            const response = await fetch(`http://localhost:3000/update-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    targetUserId: targetUserId, 
                    newRole: newRole,
                    adminId: sessionStorage.getItem("userId") || "SA-001"
                })
            });
            const data = await response.json();
            if (data.success) {
                addLogEntry("USER_UPDATE", `Updated role of User ${targetUserId} from ${currentRole} to ${newRole}`);
                fetchUsers();
            } else {
                alert(data.message);
            }
        } catch (err) { alert("Update failed."); }
    };

    const deleteUser = async (targetUserId) => {
        if (!window.confirm(`Permanently delete user ${targetUserId}?`)) return;
        
        try {
            const response = await fetch(`http://localhost:3000/delete-user`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    targetUserId: targetUserId,
                    adminId: sessionStorage.getItem("userId") || "SA-001"
                })
            });
            const data = await response.json();
            if (data.success) {
                addLogEntry("USER_DELETE", `Permanently deleted user account: ${targetUserId}`);
                fetchUsers();
            } else {
                alert(data.message);
            }
        } catch (err) { alert("Delete failed."); }
    };

    const filteredUsers = users.filter(u => 
        `${u.id} ${u.name}`.toUpperCase().includes(search.toUpperCase())
    );

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === "Admin" || u.role === "Superadmin").length,
        students: users.filter(u => u.role === "Student").length
    };

    return (
        <div className="main-wrapper">
            <header className="app-header">
                <div className="header-container">
                    <div className="header-left">
                        <Link to="/main"><img src="/style/images/sau-logo-rms.png" className="logo" alt="Logo" /></Link>
                        <div className="brand-text"><h1>PamSU-SAU RMS</h1></div>
                    </div>
                    <nav className="header-nav">
                        <Link to="/main" className="nav-link">Main View</Link>
                        <Link to="/sadmin" className="nav-link active">User Control</Link>
                        <Link to="/logs" className="nav-link">System Logs</Link>
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    </nav>
                    <div className="header-right">
                        <div className="user-dropdown">
                            <div className="user-badge" onClick={() => setShowDropdown(!showDropdown)}>
                                <div className="user-details-text">
                                    <span>{userName}</span>
                                    <span id="welcomeRole">{userRole.toUpperCase()}</span>
                                </div>
                                <div className="user-avatar-small">{userName.charAt(0)}</div>
                            </div>
                            <div className={`dropdown-content ${showDropdown ? 'show' : ''}`}>
                                <a href="#" onClick={() => {sessionStorage.clear(); navigate('/');}}>Logout</a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                <div className="dashboard">
                    <div className="card"><h3>Total Users</h3><h2>{stats.total}</h2></div>
                    <div className="card"><h3>Administrators</h3><h2>{stats.admins}</h2></div>
                    <div className="card"><h3>Students</h3><h2>{stats.students}</h2></div>
                </div>

                <div className="card">
                    <h3>System User Management</h3>
                    <input className="search-box" placeholder="SEARCH BY ID OR NAME..." style={{width:'100%', padding:'10px', marginBottom:'15px'}} onChange={(e) => setSearch(e.target.value)} />
                    <table>
                        <thead>
                            <tr><th>#</th><th>ID Number</th><th>Full Name</th><th>Role</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user, i) => (
                                <tr key={user.id}>
                                    <td>{i + 1}</td>
                                    <td>{user.id}</td>
                                    <td>{user.name}</td>
                                    <td>{user.role}</td>
                                    <td className="actions">
                                        {user.role !== 'Superadmin' && (
                                            <>
                                                <button className="view" onClick={() => updateUserRole(user.id, user.role)}>
                                                    {user.role === 'Admin' ? 'Demote' : 'Promote'}
                                                </button>
                                                <button className="delete" onClick={() => deleteUser(user.id)} style={{marginLeft: '5px'}}>
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sadmin;