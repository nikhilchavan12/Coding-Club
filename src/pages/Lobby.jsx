import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  registerParticipant, 
  getCurrentParticipant, 
  getCompetitionState, 
  subscribeToCompetitionState
} from '../utils/storage';
import { Play, Shield, Code2, Users, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Lobby() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [year, setYear] = useState('SY');
  const [rollNo, setRollNo] = useState('');
  const [registered, setRegistered] = useState(false);
  const [participant, setParticipant] = useState(null);
  const [compState, setCompState] = useState({ status: 'WAITING', startedAt: null, endedAt: null });

  useEffect(() => {
    // Check if participant already in session
    const existing = getCurrentParticipant();
    if (existing) {
      setParticipant(existing);
      setRegistered(true);
    }

    // Load initial competition state
    const loadInitialState = async () => {
      try {
        const state = await getCompetitionState();
        setCompState(state);
      } catch (err) {
        console.error('Error loading competition state:', err);
      }
    };
    loadInitialState();

    // Subscribe to competition state changes
    const unsubscribe = subscribeToCompetitionState(async (state) => {
      setCompState(state);
      if (state.status === 'RUNNING' && registered) {
        navigate('/game');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [registered, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim()) return;

    const newParticipant = await registerParticipant(name, year, rollNo);
    setParticipant(newParticipant);
    setRegistered(true);

    // If competition is already started by admin, go straight to game
    const currentState = await getCompetitionState();
    if (currentState.status === 'RUNNING') {
      navigate('/game');
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem('cc_current_participant');
    setParticipant(null);
    setRegistered(false);
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center" style={{ gap: '0.75rem' }}>
          <div className="badge-glow" style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)' }}>
            <Code2 size={24} color="#60a5fa" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Coding Club</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Logic Shuffle Arena</span>
          </div>
        </div>
        <Link to="/admin" className="btn-secondary" style={{ textDecoration: 'none' }}>
          <Shield size={16} /> Admin Portal
        </Link>
      </header>

      <main style={{ maxWidth: '540px', width: '100%', margin: '0 auto' }}>
        {!registered ? (
          <div className="glass-panel">
            <div className="text-center mb-6">
              <span className="pill-badge">Inter-Year Code Sprint</span>
              <h1 className="title-gradient" style={{ fontSize: '2.4rem', marginTop: '0.5rem' }}>
                Code Shuffle
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Arrange shuffled code lines into logical order. SY & TY students have separate specialized challenges!
              </p>
            </div>

            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="field-label">Student Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Aditi Kulkarni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="field-label">Current Academic Year</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={`year-btn ${year === 'SY' ? 'active-sy' : ''}`}
                    onClick={() => setYear('SY')}
                  >
                    <strong>SY</strong> (Second Year)
                  </button>
                  <button
                    type="button"
                    className={`year-btn ${year === 'TY' ? 'active-ty' : ''}`}
                    onClick={() => setYear('TY')}
                  >
                    <strong>TY</strong> (Third Year)
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="field-label">Roll Number / PRN</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. SY-CS-104 or PRN2024"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Enter Waiting Lobby <ArrowRight size={18} />
              </button>
            </form>
          </div>
        ) : (
          /* Waiting Room State */
          <div className="glass-panel text-center">
            <div className="pulse-ring mb-4" style={{ margin: '0 auto 1.5rem auto' }}>
              <Clock size={36} color="var(--primary-color)" />
            </div>

            <span className="pill-badge" style={{ marginBottom: '0.5rem' }}>
              Participant Registered
            </span>

            <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>
              Welcome, <span className="title-gradient">{participant.name}</span>!
            </h2>

            <div style={{ 
              background: 'rgba(15, 23, 42, 0.6)', 
              padding: '1rem', 
              borderRadius: '10px', 
              margin: '1.5rem 0',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-around'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Year Group</div>
                <div style={{ fontWeight: 'bold', color: participant.year === 'SY' ? '#a78bfa' : '#34d399', fontSize: '1.1rem' }}>
                  {participant.year}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Roll No / PRN</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {participant.rollNo}
                </div>
              </div>
            </div>

            {compState.status === 'RUNNING' ? (
              <div>
                <div style={{ color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: '1rem' }} className="flex items-center justify-center gap-2">
                  <Play size={18} /> Competition is now LIVE!
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  onClick={() => navigate('/game')}
                >
                  Start Challenges Now <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div>
                <div style={{ 
                  background: 'rgba(234, 179, 8, 0.1)', 
                  border: '1px solid rgba(234, 179, 8, 0.3)', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  color: '#fbbf24', 
                  fontSize: '0.9rem',
                  marginBottom: '1.5rem'
                }}>
                  <AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  <strong>Lobby Status:</strong> Waiting for Admin to start the competition. Both SY and TY challenges will start simultaneously on this screen.
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Keep this tab open. The test will start automatically as soon as the admin triggers it!
                </div>
              </div>
            )}

            <button 
              onClick={handleSwitchAccount} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Wrong name or year? Switch details
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
