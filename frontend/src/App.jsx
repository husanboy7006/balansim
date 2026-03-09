import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import FAB from './components/FAB';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AccountsPage from './pages/AccountsPage';
import TransactionsPage from './pages/TransactionsPage';
import DebtsPage from './pages/DebtsPage';
import GoalsPage from './pages/GoalsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AddTransaction from './pages/AddTransaction';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="app"><div className="loading"><div className="spinner"></div></div></div>;
    }

    return (
        <div className="app">
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
                <Route path="/debts" element={<ProtectedRoute><DebtsPage /></ProtectedRoute>} />
                <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/add" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {user && <FAB />}
            {user && <BottomNav />}
        </div>
    );
}
