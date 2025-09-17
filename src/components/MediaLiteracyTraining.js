import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiBookOpen, FiTarget, FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiAward, FiEye, FiShield, FiZap, FiClock, FiPlay, FiRotateCcw } from 'react-icons/fi';
import '../styles/MediaLiteracyTraining.css';
const MediaLiteracyTraining = ({ onLessonComplete, onTrainingComplete }) => {
    const [currentLesson, setCurrentLesson] = useState(null);
    const [currentExercise, setCurrentExercise] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [totalScore, setTotalScore] = useState(0);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const lessons = [
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
            }
            catch (e) {
                console.error('Error loading completed lessons:', e);
            }
        }
    }, []);
    const startLesson = (lesson) => {
        setCurrentLesson(lesson);
        setCurrentExercise(0);
        setUserAnswers({});
        setShowResults(false);
    };
    const handleAnswer = (exerciseId, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [exerciseId]: answer
        }));
    };
    const nextExercise = () => {
        if (currentLesson && currentExercise < currentLesson.exercises.length - 1) {
            setCurrentExercise(currentExercise + 1);
        }
        else {
            calculateResults();
        }
    };
    const previousExercise = () => {
        if (currentExercise > 0) {
            setCurrentExercise(currentExercise - 1);
        }
    };
    const calculateResults = () => {
        if (!currentLesson)
            return;
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
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner': return '#28a745';
            case 'intermediate': return '#ffc107';
            case 'advanced': return '#dc3545';
            default: return '#6c757d';
        }
    };
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'bias': return _jsx(FiEye, {});
            case 'fact-checking': return _jsx(FiShield, {});
            case 'credibility': return _jsx(FiTarget, {});
            case 'logical-fallacies': return _jsx(FiZap, {});
            case 'rhetoric': return _jsx(FiBookOpen, {});
            case 'advanced': return _jsx(FiAward, {});
            default: return _jsx(FiBookOpen, {});
        }
    };
    if (currentLesson && !showResults) {
        const exercise = currentLesson.exercises[currentExercise];
        return (_jsxs("div", { className: "media-literacy-training lesson-view", children: [_jsxs("div", { className: "lesson-header", children: [_jsxs("button", { onClick: () => setCurrentLesson(null), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Lessons"] }), _jsxs("div", { className: "lesson-progress", children: [_jsxs("span", { children: ["Exercise ", currentExercise + 1, " of ", currentLesson.exercises.length] }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${((currentExercise + 1) / currentLesson.exercises.length) * 100}%` } }) })] })] }), _jsxs("div", { className: "lesson-content", children: [_jsx("h2", { children: currentLesson.title }), _jsxs("div", { className: "lesson-meta", children: [_jsx("span", { className: "difficulty", style: { color: getDifficultyColor(currentLesson.difficulty) }, children: currentLesson.difficulty }), _jsxs("span", { className: "duration", children: [_jsx(FiClock, {}), " ", currentLesson.duration, " min"] })] }), _jsxs("div", { className: "exercise-section", children: [_jsxs("h3", { children: ["Exercise ", currentExercise + 1] }), _jsx("p", { className: "question", children: exercise.question }), exercise.type === 'multiple-choice' && exercise.options && (_jsx("div", { className: "options", children: exercise.options.map((option, index) => (_jsxs("label", { className: "option", children: [_jsx("input", { type: "radio", name: `exercise-${exercise.id}`, value: option, checked: userAnswers[exercise.id] === option, onChange: (e) => handleAnswer(exercise.id, e.target.value) }), _jsx("span", { children: option })] }, index))) })), exercise.type === 'true-false' && (_jsxs("div", { className: "options", children: [_jsxs("label", { className: "option", children: [_jsx("input", { type: "radio", name: `exercise-${exercise.id}`, value: "true", checked: userAnswers[exercise.id] === 'true', onChange: (e) => handleAnswer(exercise.id, e.target.value) }), _jsx("span", { children: "True" })] }), _jsxs("label", { className: "option", children: [_jsx("input", { type: "radio", name: `exercise-${exercise.id}`, value: "false", checked: userAnswers[exercise.id] === 'false', onChange: (e) => handleAnswer(exercise.id, e.target.value) }), _jsx("span", { children: "False" })] })] })), _jsxs("div", { className: "exercise-navigation", children: [currentExercise > 0 && (_jsxs("button", { onClick: previousExercise, className: "nav-button", children: [_jsx(FiArrowLeft, {}), " Previous"] })), _jsx("button", { onClick: nextExercise, disabled: !userAnswers[exercise.id], className: "nav-button primary", children: currentExercise === currentLesson.exercises.length - 1 ? (_jsxs(_Fragment, { children: ["Finish ", _jsx(FiCheckCircle, {})] })) : (_jsxs(_Fragment, { children: ["Next ", _jsx(FiArrowRight, {})] })) })] })] })] })] }));
    }
    if (currentLesson && showResults) {
        return (_jsxs("div", { className: "media-literacy-training results-view", children: [_jsxs("div", { className: "results-header", children: [_jsx("h2", { children: "Lesson Complete!" }), _jsxs("div", { className: "score-display", children: [_jsx("span", { className: "score-label", children: "Your Score:" }), _jsxs("span", { className: "score-value", children: [Math.round((totalScore / currentLesson.exercises.reduce((sum, ex) => sum + ex.points, 0)) * 100), "%"] })] })] }), _jsxs("div", { className: "results-content", children: [_jsx("h3", { children: "Exercise Results" }), currentLesson.exercises.map((exercise, index) => {
                            const userAnswer = userAnswers[exercise.id];
                            const isCorrect = userAnswer === exercise.correctAnswer;
                            return (_jsxs("div", { className: `result-item ${isCorrect ? 'correct' : 'incorrect'}`, children: [_jsxs("div", { className: "result-header", children: [_jsxs("span", { className: "exercise-number", children: ["Exercise ", index + 1] }), isCorrect ? (_jsx(FiCheckCircle, { className: "result-icon correct" })) : (_jsx(FiXCircle, { className: "result-icon incorrect" }))] }), _jsx("p", { className: "question", children: exercise.question }), _jsxs("div", { className: "answer-details", children: [_jsxs("div", { className: "user-answer", children: [_jsx("strong", { children: "Your Answer:" }), " ", userAnswer || 'No answer'] }), _jsxs("div", { className: "correct-answer", children: [_jsx("strong", { children: "Correct Answer:" }), " ", exercise.correctAnswer] }), _jsxs("div", { className: "explanation", children: [_jsx("strong", { children: "Explanation:" }), " ", exercise.explanation] })] })] }, exercise.id));
                        })] }), _jsxs("div", { className: "results-actions", children: [_jsxs("button", { onClick: resetLesson, className: "action-button", children: [_jsx(FiRotateCcw, {}), " Retake Lesson"] }), _jsxs("button", { onClick: () => setCurrentLesson(null), className: "action-button primary", children: [_jsx(FiArrowRight, {}), " Continue Learning"] })] })] }));
    }
    return (_jsxs("div", { className: "media-literacy-training", children: [_jsxs("div", { className: "training-header", children: [_jsxs("div", { className: "header-content", children: [_jsx(FiBookOpen, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h2", { children: "Media Literacy Training" }), _jsx("p", { children: "Master the skills of critical thinking and information evaluation" })] })] }), _jsxs("div", { className: "progress-summary", children: [_jsxs("div", { className: "progress-stat", children: [_jsx("span", { className: "stat-value", children: completedLessons.length }), _jsx("span", { className: "stat-label", children: "Lessons Completed" })] }), _jsxs("div", { className: "progress-stat", children: [_jsxs("span", { className: "stat-value", children: [Math.round((completedLessons.length / lessons.length) * 100), "%"] }), _jsx("span", { className: "stat-label", children: "Progress" })] })] })] }), _jsx("div", { className: "filters-section", children: _jsxs("div", { className: "filter-controls", children: [_jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Categories" }), _jsx("option", { value: "bias", children: "Bias Detection" }), _jsx("option", { value: "fact-checking", children: "Fact-Checking" }), _jsx("option", { value: "credibility", children: "Source Credibility" }), _jsx("option", { value: "logical-fallacies", children: "Logical Fallacies" }), _jsx("option", { value: "rhetoric", children: "Rhetoric Analysis" }), _jsx("option", { value: "advanced", children: "Advanced Topics" })] }), _jsxs("select", { value: selectedDifficulty, onChange: (e) => setSelectedDifficulty(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Difficulties" }), _jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }) }), _jsxs("div", { className: "lessons-section", children: [_jsx("h3", { children: "Available Lessons" }), _jsx("div", { className: "lessons-grid", children: getFilteredLessons().map((lesson) => (_jsxs("div", { className: "lesson-card", children: [_jsxs("div", { className: "lesson-header", children: [_jsx("div", { className: "lesson-icon", children: getCategoryIcon(lesson.category) }), _jsx("div", { className: "lesson-status", children: completedLessons.includes(lesson.id) && (_jsx(FiCheckCircle, { className: "completed-icon" })) })] }), _jsxs("div", { className: "lesson-content", children: [_jsx("h4", { children: lesson.title }), _jsx("p", { children: lesson.description }), _jsxs("div", { className: "lesson-meta", children: [_jsx("span", { className: "difficulty", style: { color: getDifficultyColor(lesson.difficulty) }, children: lesson.difficulty }), _jsxs("span", { className: "duration", children: [_jsx(FiClock, {}), " ", lesson.duration, " min"] }), _jsx("span", { className: "category", children: lesson.category })] })] }), _jsx("div", { className: "lesson-actions", children: _jsx("button", { onClick: () => startLesson(lesson), className: "start-button", children: completedLessons.includes(lesson.id) ? (_jsxs(_Fragment, { children: [_jsx(FiRotateCcw, {}), " Retake"] })) : (_jsxs(_Fragment, { children: [_jsx(FiPlay, {}), " Start Lesson"] })) }) })] }, lesson.id))) })] }), _jsxs("div", { className: "training-stats", children: [_jsx("h3", { children: "Training Statistics" }), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Total Score" }), _jsx("span", { className: "stat-value", children: totalScore })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Lessons Completed" }), _jsxs("span", { className: "stat-value", children: [completedLessons.length, "/", lessons.length] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Average Score" }), _jsx("span", { className: "stat-value", children: completedLessons.length > 0 ? Math.round(totalScore / completedLessons.length) : 0 })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Progress" }), _jsxs("span", { className: "stat-value", children: [Math.round((completedLessons.length / lessons.length) * 100), "%"] })] })] })] })] }));
};
export default MediaLiteracyTraining;
