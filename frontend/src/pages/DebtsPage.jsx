import { useState, useEffect } from 'react';
import { debtsAPI } from '../api';
import { Plus, X, HandCoins, ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';

function formatMoney(n) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

export default function DebtsPage() {
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [filter, setFilter] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ contact_name: '', type: 'borrowed', amount: '', due_date: '', notes: '' });
    const [editing, setEditing] = useState(null);

    const load = () => {
        const params = {};
        if (filter) params.status = filter;
        debtsAPI.getAll(params).then(r => setDebts(r.data)).catch(() => setDebts([])).finally(() => setLoading(false));
    };
    useEffect(load, [filter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const data = { ...form, amount: parseFloat(String(form.amount).replace(/\s/g, '')) };
            if (editing) {
                await debtsAPI.update(editing, data);
            } else {
                await debtsAPI.create(data);
            }
            setShowModal(false);
            setEditing(null);
            setForm({ contact_name: '', type: 'borrowed', amount: '', due_date: '', notes: '' });
            load();
        } catch (err) {
            setError(err.response?.data?.detail || 'Saqlashda xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Ushbu qarzni o'chirasizmi?")) return;
        try {
            await debtsAPI.delete(id);
            load();
        } catch (err) {
            alert(err.response?.data?.detail || "O'chirishda xatolik");
        }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await debtsAPI.pay(showPayModal, parseFloat(String(payAmount).replace(/\s/g, '')));
            setShowPayModal(null);
            setPayAmount('');
            load();
        } catch (err) {
            setError(err.response?.data?.detail || 'To\'lovda xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const totalLent = debts.filter(d => d.type === 'lent' && d.status === 'active').reduce((s, d) => s + parseFloat(d.remaining), 0);
    const totalBorrowed = debts.filter(d => d.type === 'borrowed' && d.status === 'active').reduce((s, d) => s + parseFloat(d.remaining), 0);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1>Qarzlar</h1>
                <p>Qarz daftaringiz</p>
            </div>

            {/* Summary */}
            <div className="section" style={{ display: 'flex', gap: 10 }}>
                <div className="glass-card" style={{ flex: 1, padding: '14px', textAlign: 'center' }}>
                    <ArrowUp size={18} style={{ color: 'var(--green)' }} />
                    <div style={{ fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>{formatMoney(totalLent)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Men bergan</div>
                </div>
                <div className="glass-card" style={{ flex: 1, padding: '14px', textAlign: 'center' }}>
                    <ArrowDown size={18} style={{ color: 'var(--red)' }} />
                    <div style={{ fontWeight: 700, color: 'var(--red)', marginTop: 4 }}>{formatMoney(totalBorrowed)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Men olgan</div>
                </div>
            </div>

            <div className="section">
                <button className="btn btn-outline btn-block" onClick={() => { setEditing(null); setForm({ contact_name: '', type: 'borrowed', amount: '', due_date: '', notes: '' }); setShowModal(true); }} id="btn-add-debt">
                    <Plus size={18} /> Yangi qarz qo'shish
                </button>
            </div>

            <div className="chip-row">
                <button className={`chip ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>Barchasi</button>
                <button className={`chip ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Faol</button>
                <button className={`chip ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>Uzilgan</button>
            </div>

            <div className="section">
                {debts.length === 0 ? (
                    <div className="empty-state"><HandCoins size={48} /><p>Hali qarzlar yo'q</p></div>
                ) : (
                    debts.map(d => (
                        <div key={d.id} className="glass-card record-card">
                            <div className="record-header">
                                <div className="record-title">{d.contact_name}</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => {
                                        setEditing(d.id);
                                        setForm({ contact_name: d.contact_name, type: d.type, amount: String(d.amount), due_date: d.due_date || '', notes: d.notes || '' });
                                        setShowModal(true);
                                    }} style={{ color: 'var(--text-muted)', padding: 4 }}><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(d.id)} style={{ color: 'var(--red)', padding: 4 }}><Trash2 size={14} /></button>
                                    <span className="record-badge" style={{
                                        background: d.status === 'paid' ? 'var(--green-bg)' : d.type === 'lent' ? 'var(--blue-bg)' : 'var(--red-bg)',
                                        color: d.status === 'paid' ? 'var(--green)' : d.type === 'lent' ? 'var(--blue)' : 'var(--red)',
                                    }}>
                                        {d.status === 'paid' ? '✓ Uzilgan' : d.type === 'lent' ? 'Men berdim' : 'Men oldim'}
                                    </span>
                                </div>
                            </div>
                            {d.notes && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0' }}>{d.notes}</p>}
                            <div className="record-amounts">
                                <div>
                                    <div className="record-amount-label">Jami</div>
                                    <div className="record-amount-value money">{formatMoney(d.amount)}</div>
                                </div>
                                <div>
                                    <div className="record-amount-label">Qoldi</div>
                                    <div className="record-amount-value money" style={{ color: 'var(--red)' }}>{formatMoney(d.remaining)}</div>
                                </div>
                                {d.due_date && (
                                    <div>
                                        <div className="record-amount-label">Muddat</div>
                                        <div className="record-amount-value">{new Date(d.due_date).toLocaleDateString('uz-UZ')}</div>
                                    </div>
                                )}
                            </div>
                            <div className="progress-bar" style={{ marginTop: 10 }}>
                                <div className="progress-fill" style={{ width: `${Math.min(100, (1 - d.remaining / d.amount) * 100)}%`, background: 'linear-gradient(90deg, var(--green), #34d399)' }} />
                            </div>
                            {d.status === 'active' && (
                                <button className="btn btn-outline btn-sm btn-block" style={{ marginTop: 10 }}
                                    onClick={() => { setShowPayModal(d.id); setPayAmount(''); }}>
                                    To'lov qilish
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Debt Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="modal-title">{editing ? 'Qarzni tahrirlash' : 'Yangi qarz'}</div>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                <button type="button" className={`chip ${form.type === 'borrowed' ? 'active' : ''}`} style={{ flex: 1 }}
                                    onClick={() => setForm({ ...form, type: 'borrowed' })}>Men oldim</button>
                                <button type="button" className={`chip ${form.type === 'lent' ? 'active' : ''}`} style={{ flex: 1 }}
                                    onClick={() => setForm({ ...form, type: 'lent' })}>Men berdim</button>
                            </div>
                            <div className="input-group">
                                <label>Kimdan / Kimga</label>
                                <input className="input" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} required placeholder="Ism" />
                            </div>
                            <div className="input-group">
                                <label>Summa</label>
                                <input className="input" type="text" inputMode="numeric" value={form.amount} onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setForm({ ...form, amount: val.replace(/\B(?=(\d{3})+(?!\d))/g, " ") });
                                }} required placeholder="0" />
                            </div>
                            <div className="input-group">
                                <label>Qaytarish sanasi</label>
                                <input className="input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Izoh</label>
                                <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ixtiyoriy" />
                            </div>
                            <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
                                {saving ? <div className="spinner sm"></div> : 'Saqlash'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Pay Modal */}
            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-title">To'lov qilish</div>
                        <form onSubmit={handlePay}>
                            {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
                            <div className="input-group">
                                <label>To'lov summasi</label>
                                <input className="input" type="text" inputMode="numeric" value={payAmount} onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setPayAmount(val.replace(/\B(?=(\d{3})+(?!\d))/g, " "));
                                }} required placeholder="0"
                                    style={{ fontSize: '1.3rem', fontWeight: 700, textAlign: 'center' }} />
                            </div>
                            <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
                                {saving ? <div className="spinner sm"></div> : 'To\'lash'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
