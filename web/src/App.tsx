import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SessionList from './components/SessionList';
import SessionDetail from './components/SessionDetail';
// Keep legacy components for backward compatibility

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-40"></div>
        
        {/* Main Content */}
        <div className="relative z-10">
          <Routes>
            {/* Main route now shows sessions */}
            <Route path="/" element={<SessionList />} />
            <Route path="/session/:id" element={<SessionDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;