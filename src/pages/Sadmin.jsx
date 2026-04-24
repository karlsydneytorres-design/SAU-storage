import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase'; 
import '../styles/Sadmin.css'; 

const Sadmin = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const userName = sessionStorage.getItem("userName") || "ADMIN";
    const userRole = (sessionStorage.getItem("userRole") || "Employee 1");

    // Cloud-based Logging
    const addLogEntry = async (action, details) => {
        await supabase.from('system_logs').insert([{
            user_name: userName.toUpperCase(),
            action: action.toUpperCase(),
            details: details
        }]);
    };

    const fetchUsers = async () => {
        try {
            // Fetch all users from the public.users table
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error.message);
            setUsers([]); 
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const updateUserRole = async (targetUserId, currentRole) => {
        // Toggle between Employee 2 (Admin) and Employee 3 (Student)
        const newRole = currentRole === 'Employee 2' ? 'Employee 3' : 'Employee 2';
        if (!window.confirm(`Change user role to ${newRole}?`)) return;
        
        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', targetUserId);

            if (error) throw error;

            await addLogEntry("USER_UPDATE", `Updated User ${targetUserId} to ${newRole}`);
            fetchUsers();
        } catch (err) { alert("Update failed: " + err.message); }
    };

    const deleteUser = async (targetUserId) => {
        if (!window.confirm(`Permanently delete user ${targetUserId}?`)) return;
        
        try {
            // Note: This only deletes the profile. To delete the login, 
            // you'd typically use an Edge Function, but for now, we remove the profile.
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', targetUserId);

            if (error) throw error;

            await addLogEntry("USER_DELETE", `Deleted user account: ${targetUserId}`);
            fetchUsers();
        } catch (err) { alert("Delete failed: " + err.message); }
    };

    const filteredUsers = users.filter(u => 
        `${u.email} ${u.name}`.toUpperCase().includes(search.toUpperCase())
    );

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === "Employee 1" || u.role === "Employee 2").length,
        students: users.filter(u => u.role === "Employee 3").length
    };

    return (
        <div className="main-wrapper">
            <header className="app-header">
                <div className="header-container">
                    <div className="header-left">
                        <Link to="/main"><img src="/style/images/sau-logo-rms.png" className="logo" alt="Logo" /></Link>
                    </div>
                    <nav className="header-nav">
                        <Link to="/main" className="nav-link">Main View</Link>
                        <Link to="/Sadmin" className="nav-link">User Control</Link>
                        <Link to="/logs" className="nav-link">System Logs</Link>
                        <Link to="/bankinfo" className="nav-link">Bank Info</Link>
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
                                <button className="logout-btn" onClick={() => {sessionStorage.clear(); navigate('/');}}>Logout</button>
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
                    <input 
                        className="search-box" 
                        placeholder="SEARCH BY EMAIL OR NAME..." 
                        style={{width:'100%', padding:'10px', marginBottom:'15px'}} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                    <table>
                        <thead>
                            <tr><th>#</th><th>Email</th><th>Full Name</th><th>Role</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user, i) => (
                                <tr key={user.id}>
                                    <td>{i + 1}</td>
                                    <td>{user.email}</td>
                                    <td>{user.name}</td>
                                    <td>{user.role}</td>
                                    <td className="actions">
                                        {user.role !== 'Employee 1' && (
                                            <>
                                                <button className="view" onClick={() => updateUserRole(user.id, user.role)}>
                                                    {user.role === 'Employee 2' ? 'Demote' : 'Promote'}
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