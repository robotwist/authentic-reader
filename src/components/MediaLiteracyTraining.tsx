import React, { useState, useEffect } from 'react';
import { 
  FiBookOpen, 
  FiTarget, 
  FiCheckCircle, 
  FiXCircle, 
  FiArrowRight,
  FiArrowLeft,
  FiAward,
  FiTrendingUp,
  FiEye,
  FiShield,
  FiZap,
  FiClock,
  FiStar,
  FiPlay,
  FiPause,
  FiRotateCcw
} from 'react-icons/fi';
import '../styles/MediaLiteracyTraining.css';

interface Lesson {
  id: string;
  title: string;
  description: string;
  category: 'bias' | 'fact-checking' | 'credibility' | 'logical-fallacies' | 'rhetoric' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  content: string;
  exercises: Exercise[];
  completed: boolean;
  score?: number;
}

interface Exercise {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'matching' | 'analysis';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

interface MediaLiteracyTrainingProps {
  onLessonComplete?: (lesson: Lesson, score: number) => void;
  onTrainingComplete?: (totalScore: number) => void;
}

const MediaLiteracyTraining: React.FC<MediaLiteracyTrainingProps> = ({ 
  onLessonComplete, 
  onTrainingComplete 
}) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const lessons: Lesson[] = [
    {
      id: 'bias-101',
      title: 'Understanding Media Bias',
      description: 'Learn to identify different types of bias in news reporting and understand their impact on information.',
      category: 'bias',
      difficulty: 'beginner',
      duration: 15,
      content: `Media bias refers to the perceived or actual bias of journalists and news producers within the mass media in the selection of events and stories that are reported and how they are covered.

Types of Media Bias:
1. **Selection Bias**: Choosing which stories to cover and which to ignore
2. **Framing Bias**: How a story is presented and what context is provided
3. **Confirmation Bias**: Reporting that confirms existing beliefs or expectations
4. **Commercial Bias**: Influences from advertisers, owners, or corporate interests
5. **Political Bias**: Favoring one political party or ideology over others

Understanding bias is crucial because:
- It helps you evaluate information more critically
- It enables you to seek multiple perspectives
- It improves your ability to make informed decisions
- It reduces the risk of being manipulated by misleading information

Remember: All media has some degree of bias. The key is recognizing it and accounting for it in your analysis.`,
      exercises: [
        {
          id: 'bias-1',
          type: 'multiple-choice',
          question: 'Which of the following is NOT a type of media bias?',
          options: ['Selection Bias', 'Framing Bias', 'Confirmation Bias', 'Weather Bias'],
          correctAnswer: 'Weather Bias',
          explanation: 'Weather bias is not a recognized type of media bias. The other options are all legitimate forms of media bias.',
          points: 10
        },
        {
          id: 'bias-2',
          type: 'true-false',
          question: 'All media sources have some degree of bias.',
          correctAnswer: 'true',
          explanation: 'True. Every media source has some bias, whether intentional or unintentional. The key is recognizing and accounting for it.',
          points: 10
        },
        {
          id: 'bias-3',
          type: 'multiple-choice',
          question: 'What is the best approach when encountering potentially biased information?',
          options: [
            'Ignore it completely',
            'Accept it as fact',
            'Seek multiple perspectives and sources',
            'Share it immediately on social media'
          ],
          correctAnswer: 'Seek multiple perspectives and sources',
          explanation: 'The best approach is to seek multiple perspectives and sources to get a more complete picture of the issue.',
          points: 15
        }
      ],
      completed: false
    },
    {
      id: 'fact-checking-101',
      title: 'Fact-Checking Fundamentals',
      description: 'Master the essential skills of verifying information and identifying reliable sources.',
      category: 'fact-checking',
      difficulty: 'beginner',
      duration: 20,
      content: `Fact-checking is the process of verifying the accuracy of information before accepting it as true. In today's digital age, this skill is more important than ever.

The Fact-Checking Process:
1. **Stop**: Don't immediately share or believe information
2. **Investigate**: Look for the original source
3. **Find Better Coverage**: Seek reliable news sources
4. **Trace Claims**: Follow the evidence trail
5. **Check the Date**: Ensure information is current

Reliable Sources Include:
- Academic journals and research papers
- Government websites and official documents
- Established news organizations with fact-checking departments
- Expert interviews and statements
- Peer-reviewed studies

Red Flags to Watch For:
- Emotional language and sensational headlines
- Lack of citations or sources
- Anonymous or unverified authors
- Claims that seem too good (or bad) to be true
- Requests to share quickly before fact-checking

Remember: If you're not sure about information, it's better to wait and verify than to spread potentially false information.`,
      exercises: [
        {
          id: 'fact-1',
          type: 'multiple-choice',
          question: 'What is the first step in the fact-checking process?',
          options: ['Share the information', 'Stop and investigate', 'Believe the source', 'Ask friends'],
          correctAnswer: 'Stop and investigate',
          explanation: 'The first step is to stop and investigate. Don\'t immediately share or believe information without verification.',
          points: 10
        },
        {
          id: 'fact-2',
          type: 'true-false',
          question: 'Government websites are generally reliable sources for official information.',
          correctAnswer: 'true',
          explanation: 'True. Government websites (.gov domains) are generally reliable sources for official information and statistics.',
          points: 10
        },
        {
          id: 'fact-3',
          type: 'multiple-choice',
          question: 'Which of the following is a red flag when evaluating information?',
          options: [
            'Clear citations and sources',
            'Emotional language and sensational headlines',
            'Expert interviews',
            'Peer-reviewed studies'
          ],
          correctAnswer: 'Emotional language and sensational headlines',
          explanation: 'Emotional language and sensational headlines are red flags that may indicate bias or unreliable information.',
          points: 15
        }
      ],
      completed: false
    },
    {
      id: 'logical-fallacies-101',
      title: 'Identifying Logical Fallacies',
      description: 'Learn to recognize common logical fallacies and understand how they can mislead reasoning.',
      category: 'logical-fallacies',
      difficulty: 'intermediate',
      duration: 25,
      content: `Logical fallacies are errors in reasoning that can make arguments appear stronger than they actually are. Recognizing these fallacies is crucial for critical thinking.

Common Logical Fallacies:

1. **Ad Hominem**: Attacking the person instead of the argument
   Example: "You can't trust his opinion on climate change because he drives a car."

2. **Straw Man**: Misrepresenting someone's argument to make it easier to attack
   Example: "Environmentalists want to destroy the economy by banning all cars."

3. **Appeal to Authority**: Using an authority figure to support a claim without proper evidence
   Example: "This must be true because a famous actor said it."

4. **False Dilemma**: Presenting only two options when more exist
   Example: "You're either with us or against us."

5. **Hasty Generalization**: Making broad conclusions from limited evidence
   Example: "I met one rude person from that city, so everyone there must be rude."

6. **Slippery Slope**: Suggesting that one action will inevitably lead to extreme consequences
   Example: "If we allow same-sex marriage, next people will want to marry animals."

7. **Appeal to Emotion**: Using emotional manipulation instead of logical reasoning
   Example: "Think of the children! We must pass this law."

8. **Circular Reasoning**: Using the conclusion to support the premise
   Example: "The Bible is true because it says so in the Bible."

Recognizing these fallacies helps you:
- Evaluate arguments more critically
- Avoid being manipulated by flawed reasoning
- Make more informed decisions
- Communicate more effectively`,
      exercises: [
        {
          id: 'fallacy-1',
          type: 'multiple-choice',
          question: 'Which fallacy involves attacking the person instead of their argument?',
          options: ['Straw Man', 'Ad Hominem', 'False Dilemma', 'Appeal to Authority'],
          correctAnswer: 'Ad Hominem',
          explanation: 'Ad Hominem involves attacking the person making the argument rather than addressing the argument itself.',
          points: 15
        },
        {
          id: 'fallacy-2',
          type: 'multiple-choice',
          question: '"You\'re either with us or against us" is an example of which fallacy?',
          options: ['Straw Man', 'False Dilemma', 'Slippery Slope', 'Circular Reasoning'],
          correctAnswer: 'False Dilemma',
          explanation: 'This is a False Dilemma because it presents only two options when more possibilities exist.',
          points: 15
        },
        {
          id: 'fallacy-3',
          type: 'true-false',
          question: 'Recognizing logical fallacies helps you avoid being manipulated by flawed reasoning.',
          correctAnswer: 'true',
          explanation: 'True. Understanding logical fallacies helps you identify flawed arguments and avoid being misled.',
          points: 10
        }
      ],
      completed: false
    }
  ];

  useEffect(() => {
    // Load completed lessons from localStorage
    const saved = localStorage.getItem('completedMediaLiteracyLessons');
    if (saved) {
      try {
        setCompletedLessons(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading completed lessons:', e);
      }
    }
  }, []);

  const startLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCurrentExercise(0);
    setUserAnswers({});
    setShowResults(false);
  };

  const handleAnswer = (exerciseId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [exerciseId]: answer
    }));
  };

  const nextExercise = () => {
    if (currentLesson && currentExercise < currentLesson.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    } else {
      calculateResults();
    }
  };

  const previousExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1);
    }
  };

  const calculateResults = () => {
    if (!currentLesson) return;

    let score = 0;
    let totalPossible = 0;

    currentLesson.exercises.forEach(exercise => {
      totalPossible += exercise.points;
      const userAnswer = userAnswers[exercise.id];
      
      if (userAnswer === exercise.correctAnswer) {
        score += exercise.points;
      }
    });

    const percentage = Math.round((score / totalPossible) * 100);
    setTotalScore(prev => prev + score);
    
    // Mark lesson as completed
    if (!completedLessons.includes(currentLesson.id)) {
      const updatedCompleted = [...completedLessons, currentLesson.id];
      setCompletedLessons(updatedCompleted);
      localStorage.setItem('completedMediaLiteracyLessons', JSON.stringify(updatedCompleted));
    }

    setShowResults(true);

    if (onLessonComplete) {
      onLessonComplete(currentLesson, percentage);
    }
  };

  const resetLesson = () => {
    setCurrentExercise(0);
    setUserAnswers({});
    setShowResults(false);
  };

  const getFilteredLessons = () => {
    let filtered = lessons;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(lesson => lesson.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(lesson => lesson.difficulty === selectedDifficulty);
    }

    return filtered;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#28a745';
      case 'intermediate': return '#ffc107';
      case 'advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bias': return <FiEye />;
      case 'fact-checking': return <FiShield />;
      case 'credibility': return <FiTarget />;
      case 'logical-fallacies': return <FiZap />;
      case 'rhetoric': return <FiBookOpen />;
      case 'advanced': return <FiAward />;
      default: return <FiBookOpen />;
    }
  };

  if (currentLesson && !showResults) {
    const exercise = currentLesson.exercises[currentExercise];
    
    return (
      <div className="media-literacy-training lesson-view">
        <div className="lesson-header">
          <button onClick={() => setCurrentLesson(null)} className="back-button">
            <FiArrowLeft /> Back to Lessons
          </button>
          
          <div className="lesson-progress">
            <span>Exercise {currentExercise + 1} of {currentLesson.exercises.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentExercise + 1) / currentLesson.exercises.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="lesson-content">
          <h2>{currentLesson.title}</h2>
          <div className="lesson-meta">
            <span className="difficulty" style={{ color: getDifficultyColor(currentLesson.difficulty) }}>
              {currentLesson.difficulty}
            </span>
            <span className="duration">
              <FiClock /> {currentLesson.duration} min
            </span>
          </div>

          <div className="exercise-section">
            <h3>Exercise {currentExercise + 1}</h3>
            <p className="question">{exercise.question}</p>

            {exercise.type === 'multiple-choice' && exercise.options && (
              <div className="options">
                {exercise.options.map((option, index) => (
                  <label key={index} className="option">
                    <input
                      type="radio"
                      name={`exercise-${exercise.id}`}
                      value={option}
                      checked={userAnswers[exercise.id] === option}
                      onChange={(e) => handleAnswer(exercise.id, e.target.value)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {exercise.type === 'true-false' && (
              <div className="options">
                <label className="option">
                  <input
                    type="radio"
                    name={`exercise-${exercise.id}`}
                    value="true"
                    checked={userAnswers[exercise.id] === 'true'}
                    onChange={(e) => handleAnswer(exercise.id, e.target.value)}
                  />
                  <span>True</span>
                </label>
                <label className="option">
                  <input
                    type="radio"
                    name={`exercise-${exercise.id}`}
                    value="false"
                    checked={userAnswers[exercise.id] === 'false'}
                    onChange={(e) => handleAnswer(exercise.id, e.target.value)}
                  />
                  <span>False</span>
                </label>
              </div>
            )}

            <div className="exercise-navigation">
              {currentExercise > 0 && (
                <button onClick={previousExercise} className="nav-button">
                  <FiArrowLeft /> Previous
                </button>
              )}
              
              <button 
                onClick={nextExercise}
                disabled={!userAnswers[exercise.id]}
                className="nav-button primary"
              >
                {currentExercise === currentLesson.exercises.length - 1 ? (
                  <>
                    Finish <FiCheckCircle />
                  </>
                ) : (
                  <>
                    Next <FiArrowRight />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentLesson && showResults) {
    return (
      <div className="media-literacy-training results-view">
        <div className="results-header">
          <h2>Lesson Complete!</h2>
          <div className="score-display">
            <span className="score-label">Your Score:</span>
            <span className="score-value">
              {Math.round((totalScore / currentLesson.exercises.reduce((sum, ex) => sum + ex.points, 0)) * 100)}%
            </span>
          </div>
        </div>

        <div className="results-content">
          <h3>Exercise Results</h3>
          {currentLesson.exercises.map((exercise, index) => {
            const userAnswer = userAnswers[exercise.id];
            const isCorrect = userAnswer === exercise.correctAnswer;
            
            return (
              <div key={exercise.id} className={`result-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="exercise-number">Exercise {index + 1}</span>
                  {isCorrect ? (
                    <FiCheckCircle className="result-icon correct" />
                  ) : (
                    <FiXCircle className="result-icon incorrect" />
                  )}
                </div>
                
                <p className="question">{exercise.question}</p>
                
                <div className="answer-details">
                  <div className="user-answer">
                    <strong>Your Answer:</strong> {userAnswer || 'No answer'}
                  </div>
                  <div className="correct-answer">
                    <strong>Correct Answer:</strong> {exercise.correctAnswer}
                  </div>
                  <div className="explanation">
                    <strong>Explanation:</strong> {exercise.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="results-actions">
          <button onClick={resetLesson} className="action-button">
            <FiRotateCcw /> Retake Lesson
          </button>
          <button onClick={() => setCurrentLesson(null)} className="action-button primary">
            <FiArrowRight /> Continue Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="media-literacy-training">
      <div className="training-header">
        <div className="header-content">
          <FiBookOpen className="header-icon" />
          <div>
            <h2>Media Literacy Training</h2>
            <p>Master the skills of critical thinking and information evaluation</p>
          </div>
        </div>
        
        <div className="progress-summary">
          <div className="progress-stat">
            <span className="stat-value">{completedLessons.length}</span>
            <span className="stat-label">Lessons Completed</span>
          </div>
          <div className="progress-stat">
            <span className="stat-value">{Math.round((completedLessons.length / lessons.length) * 100)}%</span>
            <span className="stat-label">Progress</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-controls">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="bias">Bias Detection</option>
            <option value="fact-checking">Fact-Checking</option>
            <option value="credibility">Source Credibility</option>
            <option value="logical-fallacies">Logical Fallacies</option>
            <option value="rhetoric">Rhetoric Analysis</option>
            <option value="advanced">Advanced Topics</option>
          </select>
          
          <select 
            value={selectedDifficulty} 
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="lessons-section">
        <h3>Available Lessons</h3>
        <div className="lessons-grid">
          {getFilteredLessons().map((lesson) => (
            <div key={lesson.id} className="lesson-card">
              <div className="lesson-header">
                <div className="lesson-icon">
                  {getCategoryIcon(lesson.category)}
                </div>
                <div className="lesson-status">
                  {completedLessons.includes(lesson.id) && (
                    <FiCheckCircle className="completed-icon" />
                  )}
                </div>
              </div>
              
              <div className="lesson-content">
                <h4>{lesson.title}</h4>
                <p>{lesson.description}</p>
                
                <div className="lesson-meta">
                  <span 
                    className="difficulty"
                    style={{ color: getDifficultyColor(lesson.difficulty) }}
                  >
                    {lesson.difficulty}
                  </span>
                  <span className="duration">
                    <FiClock /> {lesson.duration} min
                  </span>
                  <span className="category">
                    {lesson.category}
                  </span>
                </div>
              </div>
              
              <div className="lesson-actions">
                <button 
                  onClick={() => startLesson(lesson)}
                  className="start-button"
                >
                  {completedLessons.includes(lesson.id) ? (
                    <>
                      <FiRotateCcw /> Retake
                    </>
                  ) : (
                    <>
                      <FiPlay /> Start Lesson
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Statistics */}
      <div className="training-stats">
        <h3>Training Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Score</h4>
            <span className="stat-value">{totalScore}</span>
          </div>
          <div className="stat-card">
            <h4>Lessons Completed</h4>
            <span className="stat-value">{completedLessons.length}/{lessons.length}</span>
          </div>
          <div className="stat-card">
            <h4>Average Score</h4>
            <span className="stat-value">
              {completedLessons.length > 0 ? Math.round(totalScore / completedLessons.length) : 0}
            </span>
          </div>
          <div className="stat-card">
            <h4>Progress</h4>
            <span className="stat-value">
              {Math.round((completedLessons.length / lessons.length) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLiteracyTraining;
