import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionsAPI, accountsAPI, categoriesAPI } from '../api';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react';

export default function AddTransaction() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [type, setType] = useState('expense');
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ account_id: '', amount: '', category_id: '', to_account_id: '', description: '', date: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        accountsAPI.getAll().then(r => {
            setAccounts(r.data);
            if (!id && r.data.length > 0) setForm(f => ({ ...f, account_id: r.data[0].id }));
        });
    }, [id]);

    useEffect(() => {
        if (id) {
            transactionsAPI.getOne(id).then(r => {
                const t = r.data;
                setType(t.type);
                setForm({
                    account_id: t.account_id,
                    amount: String(t.amount),
                    category_id: t.category_id || '',
                    to_account_id: t.to_account_id || '',
                    description: t.description || '',
                    date: t.date ? new Date(t.date).toISOString().slice(0, 16) : ''
                });
            });
        }
    }, [id]);

    useEffect(() => {
        categoriesAPI.getAll(type === 'transfer' ? null : type).then(r => setCategories(r.data)).catch(() => setCategories([]));
    }, [type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = {
                account_id: form.account_id,
                type,
                amount: parseFloat(String(form.amount).replace(/\s/g, '')),
                category_id: form.category_id || null,
                to_account_id: type === 'transfer' ? form.to_account_id : null,
                description: form.description || null,
                date: form.date ? new Date(form.date).toISOString() : null,
            };
            if (id) {
                await transactionsAPI.update(id, data);
            } else {
                await transactionsAPI.create(data);
            }
            navigate(-1);
        } catch (e) {
            setError(e.response?.data?.detail || 'Xatolik yuz berdi');
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={22} /></button>
                <h1>{id ? 'Tahrirlash' : 'Yangi amaliyot'}</h1>
            </div>

            {/* Type Selector */}
            <div style={{ display: 'flex', gap: 8, padding: '16px 20px' }}>
                {[
                    { key: 'expense', label: 'Chiqim', icon: ArrowDownCircle, color: 'var(--red)' },
                    { key: 'income', label: 'Kirim', icon: ArrowUpCircle, color: 'var(--green)' },
                    { key: 'transfer', label: "O'tkazma", icon: ArrowLeftRight, color: 'var(--blue)' },
                ].map(({ key, label, icon: Icon, color }) => (
                    <button key={key} className={`chip ${type === key ? 'active' : ''}`}
                        style={type === key ? { borderColor: color, color, background: color + '15', flex: 1 } : { flex: 1 }}
                        onClick={() => setType(key)}>
                        <Icon size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {label}
                    </button>
                ))}
            </div>

            <div className="section">
                <form onSubmit={handleSubmit}>
                    {/* Amount */}
                    <div className="input-group">
                        <label>Summa</label>
                        <input className="input" type="text" inputMode="numeric" placeholder="0" value={form.amount}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setForm({ ...form, amount: val.replace(/\B(?=(\d{3})+(?!\d))/g, " ") });
                            }} required
                            style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', padding: '16px' }} id="input-amount" />
                    </div>

                    {/* Account */}
                    <div className="input-group">
                        <label>{type === 'transfer' ? 'Qaysi hisobdan' : 'Hisob'}</label>
                        {accounts.length === 0 ? (
                            <div style={{ padding: '12px', background: 'var(--red)15', border: '1px dashed var(--red)', borderRadius: 12, textAlign: 'center' }}>
                                <p style={{ color: 'var(--red)', fontSize: '0.9rem', marginBottom: 8 }}>Hisob topilmadi. Avval hisob yarating!</p>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/accounts')}>Hisob qo'shish</button>
                            </div>
                        ) : (
                            <select className="input" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} required>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat().format(a.balance)})</option>)}
                            </select>
                        )}
                    </div>

                    {/* To Account (transfer only) */}
                    {type === 'transfer' && (
                        <div className="input-group">
                            <label>Qaysi hisobga</label>
                            <select className="input" value={form.to_account_id} onChange={e => setForm({ ...form, to_account_id: e.target.value })} required>
                                <option value="">Tanlang...</option>
                                {accounts.filter(a => a.id !== form.account_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Category */}
                    {type !== 'transfer' && (
                        <div className="input-group">
                            <label>Kategoriya</label>
                            <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                                <option value="">Tanlang...</option>
                                {categories.map(c => (
                                    <optgroup key={c.id} label={c.name}>
                                        <option value={c.id}>{c.name}</option>
                                        {c.children?.map(ch => <option key={ch.id} value={ch.id}>&nbsp;&nbsp;{ch.name}</option>)}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Description */}
                    <div className="input-group">
                        <label>Izoh (ixtiyoriy)</label>
                        <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Masalan: Bozordan sabzavot" />
                    </div>

                    {/* Date */}
                    <div className="input-group">
                        <label>Sana (ixtiyoriy)</label>
                        <input className="input" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>

                    {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>}

                    <button className="btn btn-primary btn-block" type="submit" disabled={loading} id="btn-save-transaction"
                        style={{ marginTop: 8 }}>
                        {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                </form>
            </div>
        </div>
    );
}
