import { useState, useEffect } from 'react';
import { goalsAPI } from '../api';
import { Plus, X, Target, Pencil, Trash2 } from 'lucide-react';

function formatMoney(n) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

export default function GoalsPage() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(null);
    const [fundAmount, setFundAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', target_amount: '', deadline: '', icon: 'target', color: '#10B981' });
    const [editing, setEditing] = useState(null);

    const load = () => { goalsAPI.getAll().then(r => setGoals(r.data)).catch(() => setGoals([])).finally(() => setLoading(false)); };
    useEffect(load, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const data = { ...form, target_amount: parseFloat(String(form.target_amount).replace(/\s/g, '')) };
            if (editing) {
                await goalsAPI.update(editing, data);
            } else {
                await goalsAPI.create(data);
            }
            setShowModal(false);
            setEditing(null);
            setForm({ name: '', target_amount: '', deadline: '', icon: 'target', color: '#10B981' });
            load();
        } catch (err) {
            setError(err.response?.data?.detail || 'Maqsad saqlashda xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Ushbu maqsadni o'chirasizmi?")) return;
        try {
            await goalsAPI.delete(id);
            load();
        } catch (err) {
            alert(err.response?.data?.detail || "O'chirishda xatolik");
        }
    };

    const handleFund = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await goalsAPI.contribute(showFundModal, parseFloat(String(fundAmount).replace(/\s/g, '')));
            setShowFundModal(null);
            setFundAmount('');
            load();
        } catch (err) {
            setError(err.response?.data?.detail || 'Pul qo\'shishda xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1>Maqsadlar</h1>
                <p>Jamg'arma va moliyaviy maqsadlar</p>
            </div>

            <div className="section">
                <button className="btn btn-outline btn-block" onClick={() => { setEditing(null); setForm({ name: '', target_amount: '', deadline: '', icon: 'target', color: '#10B981' }); setShowModal(true); }} id="btn-add-goal">
                    <Plus size={18} /> Yangi maqsad yaratish
                </button>
            </div>

            <div className="section">
                {goals.length === 0 ? (
                    <div className="empty-state"><Target size={48} /><p>Hali maqsad qo'shilmagan</p></div>
                ) : (
                    goals.map(g => (
                        <div key={g.id} className="glass-card record-card">
                            <div className="record-header">
                                <div className="record-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '1.2rem' }}>🎯</span> {g.name}
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => {
                                        setEditing(g.id);
                                        setForm({ name: g.name, target_amount: String(g.target_amount), deadline: g.deadline || '', icon: g.icon, color: g.color });
                                        setShowModal(true);
                                    }} style={{ color: 'var(--text-muted)', padding: 4 }}><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(g.id)} style={{ color: 'var(--red)', padding: 4 }}><Trash2 size={14} /></button>
                                    <span className="record-badge" style={{
                                        background: g.progress >= 100 ? 'var(--green-bg)' : 'var(--accent-bg)',
                                        color: g.progress >= 100 ? 'var(--green)' : 'var(--accent)',
                                    }}>
                                        {g.progress >= 100 ? '✓ Erishildi' : `${g.progress}%`}
                                    </span>
                                </div>
                            </div>
                            <div className="record-amounts">
                                <div>
                                    <div className="record-amount-label">Yig'ilgan</div>
                                    <div className="record-amount-value money" style={{ color: 'var(--green)' }}>{formatMoney(g.current_amount)}</div>
                                </div>
                                <div>
                                    <div className="record-amount-label">Maqsad</div>
                                    <div className="record-amount-value money">{formatMoney(g.target_amount)}</div>
                                </div>
                                {g.deadline && (
                                    <div>
                                        <div className="record-amount-label">Muddat</div>
                                        <div className="record-amount-value">{new Date(g.deadline).toLocaleDateString('uz-UZ')}</div>
                                    </div>
                                )}
                            </div>
                            <div className="progress-bar" style={{ marginTop: 10 }}>
                                <div className="progress-fill" style={{ width: `${Math.min(100, g.progress)}%`, background: `linear-gradient(90deg, ${g.color}, ${g.color}99)` }} />
                            </div>
                            {g.progress < 100 && (
                                <button className="btn btn-outline btn-sm btn-block" style={{ marginTop: 10 }}
                                    onClick={() => { setShowFundModal(g.id); setFundAmount(''); }}>
                                    Pul qo'shish
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Goal Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="modal-title">{editing ? 'Maqsadni tahrirlash' : 'Yangi maqsad'}</div>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
                            <div className="input-group">
                                <label>Maqsad nomi</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Masalan: Avtomobil" />
                            </div>
                            <div className="input-group">
                                <label>Kerakli summa</label>
                                <input className="input" type="text" inputMode="numeric" value={form.target_amount} onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setForm({ ...form, target_amount: val.replace(/\B(?=(\d{3})+(?!\d))/g, " ") });
                                }} required placeholder="0" />
                            </div>
                            <div className="input-group">
                                <label>Muddat</label>
                                <input className="input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Rang</label>
                                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: '100%', height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                            </div>
                            <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
                                {saving ? <div className="spinner sm"></div> : 'Yaratish'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Fund Modal */}
            {showFundModal && (
                <div className="modal-overlay" onClick={() => setShowFundModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-title">Pul qo'shish</div>
                        <form onSubmit={handleFund}>
                            {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
                            <div className="input-group">
                                <label>Summa</label>
                                <input className="input" type="text" inputMode="numeric" value={fundAmount} onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFundAmount(val.replace(/\B(?=(\d{3})+(?!\d))/g, " "));
                                }} required placeholder="0"
                                    style={{ fontSize: '1.3rem', fontWeight: 700, textAlign: 'center' }} />
                            </div>
                            <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
                                {saving ? <div className="spinner sm"></div> : 'Qo\'shish'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
