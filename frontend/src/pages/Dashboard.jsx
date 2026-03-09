import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statsAPI, transactionsAPI } from '../api';
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react';

function formatMoney(amount, currency = 'UZS') {
    return new Intl.NumberFormat('uz-UZ').format(amount) + (currency === 'UZS' ? " so'm" : ' $');
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            statsAPI.getOverview().catch(() => ({ data: { total_balance: 0, month_income: 0, month_expense: 0, month_net: 0, account_count: 0, currency: 'UZS' } })),
            transactionsAPI.getAll({ page: 1, per_page: 5 }).catch(() => ({ data: { items: [] } }))
        ]).then(([s, t]) => {
            setStats(s.data);
            setRecent(t.data.items || []);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Assalomu alaykum 👋</p>
                <h1>{user?.name || 'Foydalanuvchi'}</h1>
            </div>

            {/* Balance Card */}
            <div className="balance-card">
                <div className="balance-label">Umumiy balans</div>
                <div className="balance-amount money">{formatMoney(stats?.total_balance || 0)}</div>
                <div className="balance-row">
                    <div className="balance-item">
                        <div className="balance-item-label">↑ Kirim</div>
                        <div className="balance-item-value income money">{formatMoney(stats?.month_income || 0)}</div>
                    </div>
                    <div className="balance-item">
                        <div className="balance-item-label">↓ Chiqim</div>
                        <div className="balance-item-value expense money">{formatMoney(stats?.month_expense || 0)}</div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="section">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div className="glass-card" style={{ padding: '14px 12px', textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => navigate('/accounts')}>
                        <Wallet size={20} style={{ color: 'var(--accent)', marginBottom: 4 }} />
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stats?.account_count || 0}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hisoblar</div>
                    </div>
                    <div className="glass-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <TrendingUp size={20} style={{ color: 'var(--green)', marginBottom: 4 }} />
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green)' }}>{formatMoney(stats?.month_net || 0)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sof foyda</div>
                    </div>
                    <div className="glass-card" style={{ padding: '14px 12px', textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => navigate('/debts')}>
                        <TrendingDown size={20} style={{ color: 'var(--yellow)', marginBottom: 4 }} />
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatMoney(stats?.total_borrowed || 0)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Qarzlarim</div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="section-title" style={{ margin: 0 }}>So'ngi amaliyotlar</span>
                    <button onClick={() => navigate('/transactions')}
                        style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Barchasi <ArrowRight size={14} />
                    </button>
                </div>
                <div className="glass-card" style={{ padding: 4 }}>
                    {recent.length === 0 ? (
                        <div className="empty-state">
                            <p>Hali tranzaksiya yo'q. "+" tugmasini bosing!</p>
                        </div>
                    ) : (
                        recent.map(t => (
                            <div key={t.id} className="transaction-item">
                                <div className="transaction-icon" style={{ background: t.category_color ? t.category_color + '20' : 'var(--accent-bg)', color: t.category_color || 'var(--accent)' }}>
                                    {t.type === 'income' ? '↑' : t.type === 'transfer' ? '↔' : '↓'}
                                </div>
                                <div className="transaction-info">
                                    <div className="transaction-name">{t.description || t.category_name || t.type}</div>
                                    <div className="transaction-category">{t.account_name || 'Hisob'}</div>
                                </div>
                                <div>
                                    <div className={`transaction-amount ${t.type}`}>
                                        {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                                        {formatMoney(t.amount)}
                                    </div>
                                    <div className="transaction-date">{new Date(t.date).toLocaleDateString('uz-UZ')}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
