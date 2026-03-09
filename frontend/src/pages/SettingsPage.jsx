import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../api';
import { useState } from 'react';
import { Moon, Sun, LogOut, User, Globe, Shield } from 'lucide-react';

export default function SettingsPage() {
    const { user, logout, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [currency, setCurrency] = useState(user?.currency || 'UZS');

    const handleSave = async () => {
        const res = await authAPI.updateMe({ name, currency });
        updateUser(res.data);
        setEditing(false);
    };

    return (
        <div>
            <div className="page-header">
                <h1>Sozlamalar</h1>
            </div>

            {/* Profile */}
            <div className="section">
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '1.3rem', fontWeight: 700,
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.phone || 'Telegram foydalanuvchi'}</div>
                        </div>
                    </div>

                    {editing ? (
                        <div>
                            <div className="input-group">
                                <label>Ism</label>
                                <input className="input" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Valyuta</label>
                                <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                                    <option value="UZS">UZS (So'm)</option>
                                    <option value="USD">USD (Dollar)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={handleSave}>Saqlash</button>
                                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Bekor qilish</button>
                            </div>
                        </div>
                    ) : (
                        <button className="btn btn-outline btn-block btn-sm" onClick={() => setEditing(true)}>
                            <User size={16} /> Profilni tahrirlash
                        </button>
                    )}
                </div>
            </div>

            {/* Settings Items */}
            <div className="section">
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    {/* Theme */}
                    <button onClick={toggleTheme}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        {theme === 'dark' ? <Moon size={20} style={{ color: 'var(--accent)' }} /> : <Sun size={20} style={{ color: 'var(--yellow)' }} />}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Mavzu</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{theme === 'dark' ? 'Tungi rejim' : 'Kunduzgi rejim'}</div>
                        </div>
                        <div style={{ background: theme === 'dark' ? 'var(--accent)' : 'var(--border)', width: 40, height: 22, borderRadius: 11, position: 'relative', transition: 'all 0.3s' }}>
                            <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: theme === 'dark' ? 20 : 2, transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                    </button>

                    {/* Language */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                        <Globe size={20} style={{ color: 'var(--blue)' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Til</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>O'zbek</div>
                        </div>
                    </div>

                    {/* Security */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
                        <Shield size={20} style={{ color: 'var(--green)' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Xavfsizlik</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PIN kod sozlash</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <div className="section" style={{ paddingBottom: 24 }}>
                <button className="btn btn-danger btn-block" onClick={logout} id="btn-logout">
                    <LogOut size={18} /> Chiqish
                </button>
            </div>

            {/* Version */}
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                BALANSIM v1.0.0
            </div>
        </div>
    );
}
