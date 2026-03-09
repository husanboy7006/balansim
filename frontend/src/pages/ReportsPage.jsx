import { useState, useEffect } from 'react';
import { statsAPI } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function formatMoney(n) { return new Intl.NumberFormat('uz-UZ').format(n); }

export default function ReportsPage() {
    const [period, setPeriod] = useState('month');
    const [type, setType] = useState('expense');
    const [catData, setCatData] = useState({ categories: [], total: 0 });
    const [cashflow, setCashflow] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            statsAPI.getByCategory(type, period).catch(() => ({ data: { categories: [], total: 0 } })),
            statsAPI.getCashflow(period).catch(() => ({ data: { data: [] } })),
        ]).then(([cat, cf]) => {
            setCatData(cat.data);
            setCashflow(cf.data.data || []);
        }).finally(() => setLoading(false));
    }, [period, type]);

    return (
        <div>
            <div className="page-header">
                <h1>Hisobotlar</h1>
                <p>Moliyaviy tahlil</p>
            </div>

            {/* Period Filter */}
            <div className="chip-row" style={{ marginTop: 16 }}>
                {[['week', 'Hafta'], ['month', 'Oy'], ['year', 'Yil']].map(([k, l]) => (
                    <button key={k} className={`chip ${period === k ? 'active' : ''}`} onClick={() => setPeriod(k)}>{l}</button>
                ))}
            </div>

            {/* Type Filter */}
            <div className="chip-row" style={{ marginTop: 8 }}>
                <button className={`chip ${type === 'expense' ? 'active' : ''}`} onClick={() => setType('expense')}>Xarajatlar</button>
                <button className={`chip ${type === 'income' ? 'active' : ''}`} onClick={() => setType('income')}>Daromadlar</button>
            </div>

            {loading ? <div className="loading"><div className="spinner"></div></div> : (
                <>
                    {/* Pie Chart - Category Breakdown */}
                    <div className="section">
                        <div className="section-title">Kategoriya bo'yicha</div>
                        <div className="glass-card" style={{ padding: 20 }}>
                            {catData.categories.length === 0 ? (
                                <div className="empty-state" style={{ padding: 24 }}><p>Ma'lumot yo'q</p></div>
                            ) : (
                                <>
                                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatMoney(catData.total)} so'm</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jami {type === 'expense' ? 'xarajat' : 'daromad'}</div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={catData.categories} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                                dataKey="total" paddingAngle={3} strokeWidth={0}>
                                                {catData.categories.map((c, i) => (
                                                    <Cell key={i} fill={c.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ marginTop: 16 }}>
                                        {catData.categories.map(c => (
                                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                                                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{c.name}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.percentage}%</span>
                                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }} className="money">{formatMoney(c.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bar Chart - Cashflow */}
                    <div className="section" style={{ paddingBottom: 24 }}>
                        <div className="section-title">Pul aylanishi</div>
                        <div className="glass-card" style={{ padding: 20 }}>
                            {cashflow.length === 0 ? (
                                <div className="empty-state" style={{ padding: 24 }}><p>Ma'lumot yo'q</p></div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={cashflow} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                            tickFormatter={v => v.slice(5)} />
                                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                            tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
                                        <Tooltip
                                            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.82rem' }}
                                            formatter={(val) => formatMoney(val) + " so'm"} />
                                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Kirim" />
                                        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Chiqim" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
