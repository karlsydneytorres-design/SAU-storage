import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Main from './pages/Main';
import Sadmin from './pages/Sadmin'; // Ensure this is imported!
import Logs from './pages/Logs';
import BankInfo from './pages/BankInfo'; // Import the new component
import Dashboard from './pages/Dashboard'; // Import the new Dashboard component
import StudentProfile from './pages/studentprofile';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/main" element={<Main />} />
        
        {/* FIX: Change this to /admin if that's what your links use, 
            or change your links to /sadmin */}
        <Route path="/sadmin" element={<Sadmin />} />
        <Route path="/admin" element={<Sadmin />} /> 
        <Route path="/user-control" element={<Sadmin />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/bankinfo" element={<BankInfo />} />
          <Route path="/studentprofile" element={<StudentProfile />} />
        {/* Add the Dashboard route */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;