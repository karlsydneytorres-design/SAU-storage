import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total: 0,
        amount: 0,
        male: 0,
        female: 0,
        campuses: {}
    });

    useEffect(() => {
        // Fetching data from LocalStorage as per your logic
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

        setStats({
            total: records.length,
            amount: totalAmount,
            male: maleCount,
            female: femaleCount,
            campuses: campusCounts
        });
    }, []);

    const pesoFormat = (v) => "₱" + Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
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
    );
};

export default Dashboard;