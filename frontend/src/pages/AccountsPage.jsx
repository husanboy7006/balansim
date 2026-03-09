import { useState, useEffect } from 'react';
import { accountsAPI } from '../api';
import { Plus, Wallet, CreditCard, Landmark, Pencil, Trash2, X } from 'lucide-react';

const typeIcons = { cash: Wallet, card: CreditCard, deposit: Landmark };
const typeLabels = { cash: 'Naqd pul', card: 'Karta', deposit: 'Depozit' };

function formatMoney(n) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

export default function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'cash', balance: '', color: '#4F46E5' });

    const load = () => {
        accountsAPI.getAll().then(r => setAccounts(r.data)).finally(() => setLoading(false));
    };
    useEffect(load, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { ...form, balance: parseFloat(String(form.balance).replace(/\s/g, '')) || 0 };
        if (editing) {
            await accountsAPI.update(editing, { name: data.name, type: data.type, color: data.color });
        } else {
            await accountsAPI.create(data);
        }
        setShowModal(false);
        setEditing(null);
        setForm({ name: '', type: 'cash', balance: '', color: '#4F46E5' });
        load();
    };

    const handleDelete = async (id) => {
        if (confirm("Bu hisobni o'chirasizmi?")) {
            await accountsAPI.delete(id);
            load();
        }
    };

    const total = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1>Hisoblar</h1>
                <p>Jami: {formatMoney(total)}</p>
            </div>

            <div className="section">
                <button className="btn btn-outline btn-block" onClick={() => { setEditing(null); setForm({ name: '', type: 'cash', balance: '', color: '#4F46E5' }); setShowModal(true); }}
                    id="btn-add-account">
                    <Plus size={18} /> Yangi hisob qo'shish
                </button>
            </div>

            <div className="section">
                {accounts.length === 0 ? (
                    <div className="empty-state"><p>Hali hisob yo'q</p></div>
                ) : (
                    accounts.map(acc => {
                        const Icon = typeIcons[acc.type] || Wallet;
                        return (
                            <div key={acc.id} className="glass-card account-card">
                                <div className="account-icon" style={{ background: acc.color + '20', color: acc.color }}>
                                    <Icon size={22} />
                                </div>
                                <div className="account-info">
                                    <div className="account-name">{acc.name}</div>
                                    <div className="account-type">{typeLabels[acc.type] || acc.type} • {acc.currency}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="account-balance money">{formatMoney(acc.balance)}</div>
                                    <button onClick={() => { setEditing(acc.id); setForm({ name: acc.name, type: acc.type, balance: acc.balance, color: acc.color }); setShowModal(true); }}
                                        style={{ color: 'var(--text-muted)', padding: 4 }}><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(acc.id)} style={{ color: 'var(--red)', padding: 4 }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="modal-title">{editing ? 'Hisobni tahrirlash' : 'Yangi hisob'}</div>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Nomi</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Masalan: Asosiy karta" />
                            </div>
                            <div className="input-group">
                                <label>Turi</label>
                                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="cash">Naqd pul</option>
                                    <option value="card">Karta</option>
                                    <option value="deposit">Depozit</option>
                                </select>
                            </div>
                            {!editing && (
                                <div className="input-group">
                                    <label>Boshlang'ich balans</label>
                                    <input className="input" type="text" inputMode="numeric" value={form.balance} onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setForm({ ...form, balance: val.replace(/\B(?=(\d{3})+(?!\d))/g, " ") });
                                    }} placeholder="0" />
                                </div>
                            )}
                            <div className="input-group">
                                <label>Rang</label>
                                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: '100%', height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                            </div>
                            <button className="btn btn-primary btn-block" type="submit">{editing ? 'Saqlash' : 'Yaratish'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
