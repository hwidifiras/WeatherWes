import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

// Simple test components
function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>This is the dashboard page. If you can see this, React Router is working!</p>
    </div>
  );
}

function Locations() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Locations</h1>
      <p>This is the locations page.</p>
    </div>
  );
}

function SimpleTestApp() {
  return (
    <ErrorBoundary>
      <Router>
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
          <nav style={{ 
            padding: '10px', 
            backgroundColor: '#f0f0f0', 
            marginBottom: '20px',
            borderBottom: '1px solid #ccc'
          }}>
            <Link to="/" style={{ marginRight: '20px', textDecoration: 'none', color: '#007bff' }}>
              Dashboard
            </Link>
            <Link to="/locations" style={{ marginRight: '20px', textDecoration: 'none', color: '#007bff' }}>
              Locations
            </Link>
          </nav>
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/locations" element={<Locations />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default SimpleTestApp;
