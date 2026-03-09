import { useState, useEffect } from 'react';
import { transactionsAPI } from '../api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function formatMoney(n) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const perPage = 15;

    const load = () => {
        setLoading(true);
        const params = { page, per_page: perPage };
        if (filter) params.type = filter;
        transactionsAPI.getAll(params)
            .then(r => { setTransactions(r.data.items || []); setTotal(r.data.total || 0); })
            .catch(() => { setTransactions([]); setTotal(0); })
            .finally(() => setLoading(false));
    };
    useEffect(load, [page, filter]);

    const totalPages = Math.ceil(total / perPage);

    return (
        <div>
            <div className="page-header">
                <h1>Amaliyotlar</h1>
                <p>Jami: {total} ta</p>
            </div>

            <div className="chip-row" style={{ marginTop: 16 }}>
                <button className={`chip ${filter === '' ? 'active' : ''}`} onClick={() => { setFilter(''); setPage(1); }}>Barchasi</button>
                <button className={`chip ${filter === 'income' ? 'active' : ''}`} onClick={() => { setFilter('income'); setPage(1); }}>Kirim</button>
                <button className={`chip ${filter === 'expense' ? 'active' : ''}`} onClick={() => { setFilter('expense'); setPage(1); }}>Chiqim</button>
                <button className={`chip ${filter === 'transfer' ? 'active' : ''}`} onClick={() => { setFilter('transfer'); setPage(1); }}>O'tkazma</button>
            </div>

            <div className="section">
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state"><p>Hali tranzaksiya yo'q</p></div>
                ) : (
                    <div className="glass-card" style={{ padding: 4 }}>
                        {transactions.map(t => (
                            <div key={t.id} className="transaction-item">
                                <div className="transaction-icon" style={{
                                    background: t.type === 'income' ? 'var(--green-bg)' : t.type === 'expense' ? 'var(--red-bg)' : 'var(--blue-bg)',
                                    color: t.type === 'income' ? 'var(--green)' : t.type === 'expense' ? 'var(--red)' : 'var(--blue)',
                                }}>
                                    {t.type === 'income' ? '↑' : t.type === 'transfer' ? '↔' : '↓'}
                                </div>
                                <div className="transaction-info">
                                    <div className="transaction-name">{t.description || t.category_name || (t.type === 'income' ? 'Kirim' : t.type === 'expense' ? 'Chiqim' : "O'tkazma")}</div>
                                    <div className="transaction-category">{t.category_name || ''} {t.account_name ? `• ${t.account_name}` : ''}</div>
                                </div>
                                <div>
                                    <div className={`transaction-amount ${t.type} money`}>
                                        {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}{formatMoney(t.amount)}
                                    </div>
                                    <div className="transaction-date">{new Date(t.date).toLocaleDateString('uz-UZ')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, alignItems: 'center' }}>
                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
                    <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
                </div>
            )}
        </div>
    );
}
