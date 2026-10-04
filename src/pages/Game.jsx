import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  getChallenges, 
  getCurrentParticipant, 
  updateCurrentParticipantProgress,
  getCompetitionState,
  subscribeToCompetitionState
} from '../utils/storage';
import { SortableItem } from '../components/SortableItem';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  SkipForward, 
  Clock, 
  Trophy, 
  Code,
  Flame,
  UserCheck
} from 'lucide-react';

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function Game() {
  const navigate = useNavigate();
  const [participant, setParticipant] = useState(null);
  const [challengesList, setChallengesList] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [blocks, setBlocks] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showError, setShowError] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize participant and challenges for their specific year
  useEffect(() => {
    const initGame = async () => {
      const current = getCurrentParticipant();
      if (!current) {
        navigate('/');
        return;
      }
      setParticipant(current);

      const questions = await getChallenges(current.year);
      if (!questions || questions.length === 0) {
        alert(`No questions found for ${current.year}! Please ask Admin to configure questions.`);
        navigate('/');
        return;
      }
      setChallengesList(questions);

      // Set competition start time
      const comp = await getCompetitionState();
      const start = comp.startedAt || current.startTime || Date.now();
      setStartTime(start);

      // Initial load of challenge 0
      initChallenge(0, questions);
    };

    initGame();

    // Subscribe to competition state changes
    const unsubscribe = subscribeToCompetitionState((state) => {
      if (state.status === 'WAITING') {
        alert('The Admin has reset the competition.');
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Live timer tick
  useEffect(() => {
    if (gameFinished || !startTime) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, gameFinished]);

  const initChallenge = (index, list = challengesList) => {
    if (!list || index >= list.length) {
      handleFinalFinish(solvedCount, skippedCount);
      return;
    }
    const current = list[index];
    const lines = Array.isArray(current.code) 
      ? current.code 
      : (typeof current.code === 'string' ? current.code.split('\n') : []);

    const formatted = lines.map((line, idx) => ({
      id: `block-${index}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      content: line,
      originalIndex: idx
    }));

    // Ensure shuffled is distinct from original if length > 1
    let shuffled = shuffleArray(formatted);
    let attempts = 0;
    while (
      attempts < 20 && 
      formatted.length > 1 && 
      shuffled.every((item, i) => item.originalIndex === i)
    ) {
      shuffled = shuffleArray(formatted);
      attempts++;
    }

    setBlocks(shuffled);
    setIsCorrect(false);
    setShowError(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    setShowError(false);
  };

  const handleCheckCode = () => {
    const isMatching = blocks.every((block, idx) => block.originalIndex === idx);
    if (isMatching) {
      setIsCorrect(true);
      setShowError(false);
    } else {
      setShowError(true);
      setIsCorrect(false);
    }
  };

  const handleNext = async () => {
    const newSolved = solvedCount + 1;
    setSolvedCount(newSolved);
    await updateCurrentParticipantProgress({
      solvedCount: newSolved,
      skippedCount,
      totalQuestions: challengesList.length
    });

    const nextIndex = currentIdx + 1;
    if (nextIndex >= challengesList.length) {
      handleFinalFinish(newSolved, skippedCount);
    } else {
      setCurrentIdx(nextIndex);
      initChallenge(nextIndex);
    }
  };

  const handleSkip = async () => {
    const newSkipped = skippedCount + 1;
    setSkippedCount(newSkipped);
    await updateCurrentParticipantProgress({
      solvedCount,
      skippedCount: newSkipped,
      totalQuestions: challengesList.length
    });

    const nextIndex = currentIdx + 1;
    if (nextIndex >= challengesList.length) {
      handleFinalFinish(solvedCount, newSkipped);
    } else {
      setCurrentIdx(nextIndex);
      initChallenge(nextIndex);
    }
  };

  const handleFinalFinish = async (finalSolved, finalSkipped) => {
    const end = Date.now();
    const totalSecs = Math.max(1, Math.floor((end - (startTime || end)) / 1000));
    setGameFinished(true);

    await updateCurrentParticipantProgress({
      completed: true,
      solvedCount: finalSolved,
      skippedCount: finalSkipped,
      totalQuestions: challengesList.length,
      startTime,
      endTime: end,
      totalSeconds: totalSecs
    });
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentChallenge = challengesList[currentIdx];

  if (gameFinished) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel text-center" style={{ maxWidth: '600px', width: '100%' }}>
          <div className="pulse-ring mb-4" style={{ margin: '0 auto 1.5rem', background: 'rgba(16, 185, 129, 0.2)' }}>
            <Trophy size={48} color="var(--accent-color)" />
          </div>

          <span className="pill-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-color)' }}>
            Competition Finished
          </span>

          <h1 className="title-gradient" style={{ marginTop: '0.75rem', fontSize: '2.2rem' }}>
            Well Done, {participant?.name}!
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            You have completed all challenge submissions for <strong style={{ color: '#fff' }}>{participant?.year}</strong>.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            margin: '2rem 0',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Solved</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                {solvedCount}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Skipped</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {skippedCount}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Time</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {formatTimer(elapsedSeconds)}
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            padding: '1rem',
            fontSize: '0.9rem',
            color: '#93c5fd',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <UserCheck size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            <strong>Results Notice:</strong> The final consolidated leaderboard is maintained privately on the Admin portal. Your score and time have been securely saved and submitted to the Club Admin!
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ width: '100%' }}
            onClick={() => navigate('/')}
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!currentChallenge) {
    return (
      <div className="container text-center" style={{ paddingTop: '5rem' }}>
        <p>Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      {/* Top Bar */}
      <div className="glass-panel mb-4" style={{ padding: '1rem 1.5rem' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex items-center" style={{ gap: '0.75rem' }}>
            <span className={`year-badge ${participant?.year === 'SY' ? 'year-sy' : 'year-ty'}`}>
              {participant?.year} Track
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {participant?.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({participant?.rollNo})</span>
            </div>
          </div>

          <div className="flex items-center" style={{ gap: '1.5rem' }}>
            <div className="flex items-center" style={{ gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <Flame size={16} color="#f59e0b" />
              <span>Solved: <strong style={{ color: '#fff' }}>{solvedCount}</strong></span>
            </div>

            <div className="timer-badge">
              <Clock size={16} color="var(--primary-color)" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Challenge Panel */}
      <div className="glass-panel">
        <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span className="pill-badge" style={{ marginBottom: '0.5rem' }}>
              Question {currentIdx + 1} of {challengesList.length}
            </span>
            <h2 style={{ fontSize: '1.6rem', marginTop: '0.25rem', marginBottom: 0 }}>
              {currentChallenge.title}
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-muted)', 
              background: 'rgba(255,255,255,0.05)',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)'
            }}>
              Language: <strong style={{ color: '#60a5fa' }}>{currentChallenge.language}</strong>
            </span>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          💡 Drag & drop the code blocks into the correct logical order from top to bottom.
        </p>

        {/* Drag and Drop Area */}
        <div className="code-drag-container">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block, idx) => (
                <SortableItem 
                  key={block.id} 
                  id={block.id} 
                  content={block.content} 
                  index={idx}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Feedback Messages */}
        <div style={{ minHeight: '2.5rem', margin: '1rem 0' }}>
          {showError && (
            <div className="alert-message error">
              <AlertCircle size={18} />
              <span>Logical order is incorrect. Inspect your syntax and conditions!</span>
            </div>
          )}
          {isCorrect && (
            <div className="alert-message success">
              <CheckCircle2 size={18} />
              <span>Correct sequence! Click "Next Challenge" to proceed.</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          {/* Skip Button */}
          <button
            type="button"
            className="btn btn-skip"
            onClick={handleSkip}
            title="Skip this question if you are stuck"
          >
            <SkipForward size={16} /> Skip Question
          </button>

          {/* Check / Next Button */}
          <div className="flex" style={{ gap: '0.75rem' }}>
            {!isCorrect ? (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleCheckCode}
              >
                <Code size={16} /> Check Order
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-success"
                onClick={handleNext}
              >
                {currentIdx === challengesList.length - 1 ? 'Finish Challenge' : 'Next Question'}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
