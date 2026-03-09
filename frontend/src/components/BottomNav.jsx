import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, HandCoins, BarChart3, Settings } from 'lucide-react';

const tabs = [
    { path: '/', label: 'Bosh sahifa', icon: LayoutDashboard },
    { path: '/transactions', label: 'Amaliyotlar', icon: ArrowLeftRight },
    { path: '/debts', label: 'Qarzlar', icon: HandCoins },
    { path: '/reports', label: 'Hisobotlar', icon: BarChart3 },
    { path: '/settings', label: 'Sozlamalar', icon: Settings },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <nav className="bottom-nav" id="bottom-nav">
            {tabs.map(tab => {
                const Icon = tab.icon;
                const active = location.pathname === tab.path;
                return (
                    <button
                        key={tab.path}
                        className={`nav-item ${active ? 'active' : ''}`}
                        onClick={() => navigate(tab.path)}
                        id={`nav-${tab.path.replace('/', '') || 'home'}`}
                    >
                        <Icon />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
