import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Smartphone, MessageCircle } from 'lucide-react';

export default function LoginPage() {
    const { login, register, telegramLogin } = useAuth();
    const [mode, setMode] = useState('login'); // login | register
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationMsg, setValidationMsg] = useState('');

    const formatPhone = (val) => {
        let raw = val.replace(/\D/g, '');
        if (raw.startsWith('998')) raw = raw.slice(3);

        let formatted = '+998';
        if (raw.length > 0) formatted += ' ' + raw.slice(0, 2);
        if (raw.length >= 3) formatted += ' ' + raw.slice(2, 5);
        if (raw.length >= 6) formatted += ' ' + raw.slice(5, 7);
        if (raw.length >= 8) formatted += ' ' + raw.slice(7, 9);

        // Agar kutilgandan ortiq raqam kiritilsa (9 tadan ko'p qism)
        if (raw.length > 9) formatted += ' ' + raw.slice(9);

        return formatted === '+998' ? '' : formatted.trim();
    };

    const isPhoneValid = phone.replace(/\D/g, '').length === 12;

    const isFormValid = () => {
        if (!isPhoneValid) return false;
        if (mode === 'register' && name.trim().length < 3) return false;
        if (mode === 'login' && otp.replace(/\s/g, '').length < 4) return false;
        return true;
    };

    const isTelegram = !!window.Telegram?.WebApp?.initData;

    const handleTelegramLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await telegramLogin();
        } catch (e) {
            setError(e.response?.data?.detail || 'Telegram orqali kirib bo\'lmadi');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (!isFormValid()) {
            setValidationMsg("Iltimos, barcha maydonlarni to'g'ri to'ldiring.");
            setLoading(false);
            return;
        }

        try {
            if (mode === 'register') {
                const cleanedPhone = phone.replace(/\s/g, '');
                await register({ name, phone: cleanedPhone, currency: 'UZS' });
            } else {
                const cleanedPhone = phone.replace(/\s/g, '');
                await login(cleanedPhone, otp || '1234');
            }
        } catch (e) {
            setError(e.response?.data?.detail || 'Xatolik yuz berdi');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-logo">BALANSIM</div>
            <p className="auth-subtitle">Oilaviy byudjetni oson boshqaring</p>

            {isTelegram && (
                <button className="btn btn-primary btn-block" onClick={handleTelegramLogin} disabled={loading}
                    style={{ marginBottom: 24, gap: 10, padding: '14px 24px', fontSize: '0.95rem' }}>
                    <MessageCircle size={20} />
                    Telegram orqali kirish
                </button>
            )}

            {!isTelegram && (
                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="input-group">
                            <label>Ismingiz</label>
                            <input className="input" placeholder="Ismingizni kiriting" value={name}
                                onChange={e => { setName(e.target.value); setValidationMsg(''); }} required id="input-name" />
                            {name.length > 0 && name.trim().length < 3 && <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>Ism kamida 3 harfdan iborat bo'lishi kerak</span>}
                        </div>
                    )}

                    <div className="input-group">
                        <label>Telefon raqam</label>
                        <input className="input" type="tel" placeholder="+998 90 123 45 67" value={phone} maxLength={25}
                            onChange={e => { setPhone(formatPhone(e.target.value)); setValidationMsg(''); }} required id="input-phone" />
                        {phone.length > 0 && !isPhoneValid && <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>Raqam to'liq emas yoki noto'g'ri (faqat 12 ta raqam bo'lishi kerak)</span>}
                    </div>

                    {mode === 'login' && (
                        <div className="input-group">
                            <label>SMS kod</label>
                            <input className="input" type="text" placeholder="1234" maxLength={4} value={otp}
                                onChange={e => setOtp(e.target.value)} id="input-otp" />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                Demo uchun: 1234
                            </span>
                        </div>
                    )}

                    {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>}
                    {validationMsg && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 12 }}>{validationMsg}</p>}

                    <button className="btn btn-primary btn-block" type="submit" disabled={loading || !isFormValid()} id="btn-submit">
                        <Smartphone size={18} />
                        {loading ? 'Kutib turing...' : mode === 'register' ? "Ro'yxatdan o'tish" : 'Kirish'}
                    </button>

                    <div className="auth-divider">yoki</div>

                    <button type="button" className="btn btn-outline btn-block"
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                        id="btn-switch-mode">
                        {mode === 'login' ? "Yangi hisob yaratish" : "Allaqachon hisobingiz bormi? Kirish"}
                    </button>
                </form>
            )}
        </div>
    );
}
