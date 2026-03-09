import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function FAB() {
    const navigate = useNavigate();
    return (
        <button className="fab" onClick={() => navigate('/add')} id="fab-add" aria-label="Yangi tranzaksiya">
            <Plus />
        </button>
    );
}
