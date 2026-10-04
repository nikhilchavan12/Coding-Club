import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  verifyAdminPassword,
  isAdminAuthenticated,
  logoutAdmin,
  getCompetitionState,
  startCompetition,
  endCompetition,
  resetCompetition,
  getChallenges,
  saveChallenge,
  deleteChallenge,
  resetChallengesToDefault,
  getLeaderboardByYear,
  clearAllLeaderboardData,
  subscribeToBroadcast
} from '../utils/storage';
import { 
  Shield, 
  Lock, 
  Play, 
  Square, 
  RotateCcw, 
  Trophy, 
  Plus, 
  Trash2, 
  Edit3, 
  Code, 
  LogOut, 
  Users, 
  CheckCircle, 
  Clock, 
  FileText,
  Home
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  // Admin tabs: 'control' | 'questions' | 'leaderboard'
  const [activeTab, setActiveTab] = useState('control');

  // Competition state
  const [compState, setCompState] = useState(getCompetitionState());

  // Question editor state
  const [questionYear, setQuestionYear] = useState('SY');
  const [challenges, setChallenges] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [qTitle, setQTitle] = useState('');
  const [qLanguage, setQLanguage] = useState('python');
  const [qCode, setQCode] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Leaderboard state
  const [leaderboardYear, setLeaderboardYear] = useState('SY');
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    loadChallenges(questionYear);
    loadLeaderboard(leaderboardYear);

    const unsubscribe = subscribeToBroadcast((msg) => {
      if (msg.type === 'COMPETITION_STARTED' || msg.type === 'COMPETITION_ENDED' || msg.type === 'COMPETITION_RESET') {
        setCompState(getCompetitionState());
      }
      if (msg.type === 'PARTICIPANT_REGISTERED' || msg.type === 'PARTICIPANT_UPDATED' || msg.type === 'LEADERBOARD_CLEARED') {
        loadLeaderboard(leaderboardYear);
      }
      if (msg.type === 'CHALLENGES_UPDATED') {
        loadChallenges(questionYear);
      }
    });

    const interval = setInterval(() => {
      loadLeaderboard(leaderboardYear);
      setCompState(getCompetitionState());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [authenticated, questionYear, leaderboardYear]);

  const loadChallenges = (year) => {
    setChallenges(getChallenges(year));
  };

  const loadLeaderboard = (year) => {
    setLeaderboard(getLeaderboardByYear(year));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      setAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setAuthenticated(false);
    setPassword('');
  };

  // Competition Control actions
  const handleStartComp = () => {
    const newState = startCompetition();
    setCompState(newState);
  };

  const handleEndComp = () => {
    const newState = endCompetition();
    setCompState(newState);
  };

  const handleResetComp = () => {
    const newState = resetCompetition();
    setCompState(newState);
  };

  // Question editing actions
  const handleOpenAddQuestion = () => {
    setEditingId(null);
    setQTitle('');
    setQLanguage('python');
    setQCode('');
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (item) => {
    setEditingId(item.id);
    setQTitle(item.title);
    setQLanguage(item.language || 'python');
    const rawCode = Array.isArray(item.code) ? item.code.join('\n') : (item.code || '');
    setQCode(rawCode);
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = (id) => {
    const updated = deleteChallenge(questionYear, id);
    setChallenges(updated);
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!qTitle.trim() || !qCode.trim()) return;

    // Split code into distinct lines for the drag-and-drop shuffler
    const lines = qCode.split('\n');

    const challengePayload = {
      id: editingId || `${questionYear.toLowerCase()}-${Date.now()}`,
      title: qTitle.trim(),
      language: qLanguage,
      code: lines
    };

    saveChallenge(questionYear, challengePayload);
    loadChallenges(questionYear);
    setShowQuestionForm(false);
    setEditingId(null);
  };

  const handleResetDefaultQuestions = () => {
    const defaults = resetChallengesToDefault(questionYear);
    setChallenges(defaults);
  };

  const handleClearResults = () => {
    clearAllLeaderboardData();
    setLeaderboard([]);
  };

  const formatSeconds = (sec) => {
    if (sec == null) return '--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  // =================== AUTH LOGIN SCREEN ===================
  if (!authenticated) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '440px', width: '100%' }}>
          <div className="text-center mb-6">
            <div className="pulse-ring mb-4" style={{ margin: '0 auto 1.5rem', background: 'rgba(59, 130, 246, 0.2)' }}>
              <Shield size={36} color="var(--primary-color)" />
            </div>
            <h2 className="title-gradient" style={{ fontSize: '1.8rem' }}>Admin Access</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Enter administrator password to manage challenges, start the timer, and view private results.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="field-label">Admin Passcode</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter admin password (default: admin123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {authError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                  Incorrect password. (Default is: <code style={{ color: '#fff' }}>admin123</code>)
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              <Lock size={16} /> Authenticate Admin
            </button>
          </form>

          <div className="text-center">
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← Return to Participant Lobby
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =================== AUTHENTICATED DASHBOARD ===================
  return (
    <div className="container" style={{ maxWidth: '1050px', paddingBottom: '4rem' }}>
      {/* Admin Navbar */}
      <header className="glass-panel mb-4" style={{ padding: '1rem 1.5rem' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex items-center" style={{ gap: '0.75rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
              <Shield size={22} color="#60a5fa" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Coding Club Admin</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Competition Control Center</span>
            </div>
          </div>

          <div className="flex items-center" style={{ gap: '0.75rem' }}>
            <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <Home size={16} /> Lobby View
            </Link>
            <button className="btn btn-secondary" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex mb-6" style={{ gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'control' ? 'active' : ''}`}
          onClick={() => setActiveTab('control')}
        >
          <Play size={16} /> 1. Competition Control
        </button>
        <button
          className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <Code size={16} /> 2. Question Bank (SY & TY Code)
        </button>
        <button
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={16} /> 3. Private Results & Leaderboards
        </button>
      </div>

      {/* TAB 1: COMPETITION CONTROL */}
      {activeTab === 'control' && (
        <div className="glass-panel">
          <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Live Competition Orchestrator</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Both SY and TY participants will start at the exact same second when you trigger Start.
              </p>
            </div>
            <div>
              <span className={`status-pill status-${compState.status.toLowerCase()}`}>
                Status: {compState.status}
              </span>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            marginBottom: '2rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Simultaneous Competition Controls</h4>
            <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ background: compState.status === 'RUNNING' ? 'rgba(59, 130, 246, 0.4)' : undefined }}
                onClick={handleStartComp}
                disabled={compState.status === 'RUNNING'}
              >
                <Play size={18} /> Start Competition for ALL (SY & TY)
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleEndComp}
                disabled={compState.status !== 'RUNNING'}
              >
                <Square size={18} /> End Competition
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleResetComp}
              >
                <RotateCcw size={18} /> Reset to Waiting
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>SY Questions Configured</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#a78bfa' }}>
                {getChallenges('SY').length} Questions
              </div>
            </div>

            <div className="stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>TY Questions Configured</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#34d399' }}>
                {getChallenges('TY').length} Questions
              </div>
            </div>

            <div className="stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Submissions</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {getLeaderboardByYear('SY').length + getLeaderboardByYear('TY').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS MANAGER (WRITE CODE IN APP) */}
      {activeTab === 'questions' && (
        <div>
          {/* Year selector for questions */}
          <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="flex" style={{ gap: '0.5rem' }}>
              <button
                className={`year-toggle-btn ${questionYear === 'SY' ? 'active-sy' : ''}`}
                onClick={() => setQuestionYear('SY')}
              >
                SY Challenge Set ({getChallenges('SY').length})
              </button>
              <button
                className={`year-toggle-btn ${questionYear === 'TY' ? 'active-ty' : ''}`}
                onClick={() => setQuestionYear('TY')}
              >
                TY Challenge Set ({getChallenges('TY').length})
              </button>
            </div>

            <div className="flex" style={{ gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={handleResetDefaultQuestions}>
                <RotateCcw size={16} /> Restore Defaults
              </button>
              <button className="btn btn-primary" onClick={handleOpenAddQuestion}>
                <Plus size={16} /> Add New {questionYear} Question
              </button>
            </div>
          </div>

          {/* Question Add/Edit Form Modal / Drawer */}
          {showQuestionForm && (
            <div className="glass-panel mb-6" style={{ border: '1px solid var(--primary-color)' }}>
              <h3 style={{ marginTop: 0 }}>
                {editingId ? `Edit ${questionYear} Question` : `Add New ${questionYear} Question`}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Type or paste your code below. Each line you write will become an individual block that students must shuffle into place!
              </p>

              <form onSubmit={handleSaveQuestion}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="field-label">Challenge Title</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Reverse a Linked List or Two Sum"
                      value={qTitle}
                      onChange={(e) => setQTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Language</label>
                    <select
                      className="input-field"
                      value={qLanguage}
                      onChange={(e) => setQLanguage(e.target.value)}
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="field-label">
                    Code Content (Line by line in correct order)
                  </label>
                  <textarea
                    rows={12}
                    className="code-textarea"
                    placeholder={`def example_solution(arr):\n    result = []\n    for item in arr:\n        result.append(item * 2)\n    return result`}
                    value={qCode}
                    onChange={(e) => setQCode(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Total lines: {qCode.split('\n').filter(Boolean).length} blocks will be created.
                  </span>
                </div>

                <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowQuestionForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <CheckCircle size={16} /> Save Question
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of current questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {challenges.length === 0 ? (
              <div className="glass-panel text-center" style={{ padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No questions added for {questionYear} yet.</p>
                <button className="btn btn-primary" onClick={handleOpenAddQuestion}>
                  <Plus size={16} /> Add First Question
                </button>
              </div>
            ) : (
              challenges.map((c, idx) => (
                <div key={c.id} className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center" style={{ gap: '0.75rem' }}>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                        #{idx + 1}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{c.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ({c.language})
                      </span>
                    </div>

                    <div className="flex" style={{ gap: '0.5rem' }}>
                      <button 
                        className="btn-icon" 
                        title="Edit question code"
                        onClick={() => handleEditQuestion(c)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="btn-icon text-danger" 
                        title="Delete question"
                        onClick={() => handleDeleteQuestion(c.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Code preview snippet */}
                  <div className="code-preview-box">
                    <pre style={{ margin: 0 }}>
                      {(Array.isArray(c.code) ? c.code : (c.code || '').split('\n'))
                        .slice(0, 5)
                        .join('\n')}
                      {(Array.isArray(c.code) ? c.code.length : 0) > 5 && '\n... (more lines)'}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRIVATE LEADERBOARDS & RESULTS (ONLY ADMIN CAN SEE) */}
      {activeTab === 'leaderboard' && (
        <div className="glass-panel">
          <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="flex items-center" style={{ gap: '0.5rem' }}>
                <Lock size={20} color="#f59e0b" />
                <h2 style={{ margin: 0 }}>Private Leaderboard Results</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Confidential to Admin. Participants cannot view this leaderboard.
              </p>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={handleClearResults}
            >
              <Trash2 size={16} /> Clear All Results
            </button>
          </div>

          {/* Switch SY vs TY Result tabs */}
          <div className="flex mb-6" style={{ gap: '0.75rem' }}>
            <button
              className={`year-toggle-btn ${leaderboardYear === 'SY' ? 'active-sy' : ''}`}
              onClick={() => setLeaderboardYear('SY')}
            >
              🎓 SY Student Results ({getLeaderboardByYear('SY').length})
            </button>
            <button
              className={`year-toggle-btn ${leaderboardYear === 'TY' ? 'active-ty' : ''}`}
              onClick={() => setLeaderboardYear('TY')}
            >
              🎓 TY Student Results ({getLeaderboardByYear('TY').length})
            </button>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center" style={{ padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <Clock size={40} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
              <h4>No Submissions Yet for {leaderboardYear}</h4>
              <p style={{ fontSize: '0.9rem' }}>
                As students solve or finish the challenges, their live standings will be displayed here automatically.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Roll / PRN</th>
                    <th>Solved</th>
                    <th>Skipped</th>
                    <th>Total Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((student, idx) => (
                    <tr key={student.id} className={idx === 0 ? 'rank-first' : idx === 1 ? 'rank-second' : idx === 2 ? 'rank-third' : ''}>
                      <td>
                        <span className="rank-badge">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{student.rollNo}</td>
                      <td>
                        <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                          {student.solvedCount || 0}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#f59e0b' }}>
                          {student.skippedCount || 0}
                        </span>
                      </td>
                      <td>
                        <span className="time-badge">
                          {formatSeconds(student.totalSeconds)}
                        </span>
                      </td>
                      <td>
                        {student.completed ? (
                          <span className="badge-status-completed">Completed</span>
                        ) : (
                          <span className="badge-status-inprogress">In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
