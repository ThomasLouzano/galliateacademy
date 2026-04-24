import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTrilha, getCourse, QUIZ_QUESTIONS } from '../data/lmsData';
import ProgressBar from '../components/ProgressBar';
import Pill from '../components/Pill';

export default function Quiz() {
  const { trailId, courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trail = getTrilha(trailId);
  const course = getCourse(trailId, courseId);
  const questions = QUIZ_QUESTIONS[courseId] || QUIZ_QUESTIONS[trailId] || QUIZ_QUESTIONS.smash;

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  if (!trail || !course) return null;
  const q = questions[current];

  const handleNext = () => {
    const correct = selected === q.correct;
    const newAns = [...answers, correct];
    setAnswers(newAns);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      const xp = newAns.filter(Boolean).length * 50;
      setEarnedXP(xp);
      setDone(true);
    }
  };

  if (done) {
    const score = answers.filter(Boolean).length;
    const passed = score >= Math.ceil(questions.length * 0.6);
    return (
      <div style={{ padding: '32px 40px', maxWidth: 600, fontFamily: 'Barlow, sans-serif' }}>
        <div style={{ background: '#161616', border: `1px solid ${passed ? trail.color : '#E05A2B'}44`, borderRadius: 16, padding: '48px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>{passed ? '🏆' : '📚'}</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 42, fontWeight: 900, color: passed ? trail.color : '#E05A2B', marginBottom: 6 }}>
            {score}/{questions.length} corretas
          </div>
          <div style={{ color: '#666', fontSize: 15, marginBottom: 22 }}>
            {passed ? 'Parabéns! Você passou no quiz!' : 'Continue estudando e tente novamente.'}
          </div>
          <div style={{ background: '#0D0D0D', borderRadius: 8, padding: '10px 20px', marginBottom: 26, display: 'inline-block' }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, color: '#F9A800', fontWeight: 900 }}>+{earnedXP} XP</span>
            <span style={{ color: '#444', fontSize: 12, marginLeft: 8 }}>ganhos</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {passed && (
              <button onClick={() => navigate(`/certificate/${trailId}/${courseId}`)} style={{ padding: '11px 22px', background: trail.color, border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>VER CERTIFICADO</button>
            )}
            <button onClick={() => navigate(`/course/${trailId}/${courseId}`)} style={{ padding: '11px 22px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#666', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>VOLTAR AO CURSO</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 680, fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Pill label={`Quiz · ${course.title}`} color={trail.color} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, color: '#444' }}>{current + 1}/{questions.length}</span>
      </div>
      <ProgressBar pct={Math.round(current / questions.length * 100)} color={trail.color} h={4} />
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 900, color: '#F0F0F0', lineHeight: 1.3, margin: '24px 0' }}>{q.q}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
        {q.options.map((opt, i) => {
          const isSel = selected === i;
          const isCorrect = selected !== null && i === q.correct;
          const isWrong = isSel && i !== q.correct;
          return (
            <div
              key={i}
              onClick={() => selected === null && setSelected(i)}
              style={{
                padding: '15px 18px',
                background: isCorrect ? trail.color + '1A' : isWrong ? '#E05A2B1A' : '#161616',
                border: `2px solid ${isCorrect ? trail.color : isWrong ? '#E05A2B' : isSel ? '#3A3A3A' : '#1E1E1E'}`,
                borderRadius: 10, cursor: selected !== null ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, transition: 'all .15s'
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: isCorrect ? trail.color : isWrong ? '#E05A2B' : '#1A1A1A',
                border: `2px solid ${isCorrect ? trail.color : isWrong ? '#E05A2B' : '#2A2A2A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12,
                color: isCorrect || isWrong ? '#FFF' : '#444', flexShrink: 0
              }}>{isCorrect ? '✓' : isWrong ? '✗' : 'ABCD'[i]}</div>
              <span style={{ color: isCorrect ? trail.color : isWrong ? '#E05A2B' : '#C0C0C0', fontSize: 14 }}>{opt}</span>
            </div>
          );
        })}
      </div>

      {selected !== null && (
        <button onClick={handleNext} style={{ width: '100%', padding: 13, background: trail.color, border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900, cursor: 'pointer', letterSpacing: 0.5 }}>
          {current + 1 < questions.length ? 'PRÓXIMA PERGUNTA →' : 'VER RESULTADO →'}
        </button>
      )}
    </div>
  );
}
