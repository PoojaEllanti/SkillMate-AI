import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // API Base URL - Change this to your deployed backend URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://skillmate-demo-api.onrender.com';

  // Load history and preferences from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('learningHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  // Save history and preferences
  useEffect(() => {
    localStorage.setItem('learningHistory', JSON.stringify(searchHistory));
    localStorage.setItem('darkMode', darkMode.toString());
  }, [searchHistory, darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skill.trim()) {
      setError('Please enter a skill to learn');
      return;
    }

    setLoading(true);
    setError('');
    setContent(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    setScore(0);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/generate`, {
        skill: skill.trim(),
        difficulty
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const newContent = {
        ...response.data,
        searchedAt: new Date().toISOString()
      };

      setContent(newContent);
      setSearchHistory(prev => [newContent, ...prev.slice(0, 4)]); // Keep last 5 searches
    } catch (err) {
      const errorMsg = err.response?.data?.error || 
                      err.message || 
                      'Failed to generate content';
      setError(errorMsg);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (index) => {
    setContent(searchHistory[index]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const calculateScore = () => {
    if (!content?.mcqs) return 0;
    
    let correct = 0;
    content.mcqs.forEach((question, index) => {
      if (userAnswers[index] === question.answer) {
        correct++;
      }
    });
    return Math.round((correct / content.mcqs.length) * 100);
  };

  const submitQuiz = () => {
    setScore(calculateScore());
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <header className="App-header">
        <div className="header-controls">
          <h1>SkillMate AI</h1>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="generator-form">
          <div className="form-group">
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Enter a skill (e.g., Python, Calculus)"
              disabled={loading}
              aria-label="Skill to learn"
            />
            
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={loading}
              aria-label="Difficulty level"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            
            <button 
              type="submit" 
              disabled={loading}
              aria-label="Generate learning content"
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span> Generating...
                </>
              ) : 'Generate Content'}
            </button>
          </div>
        </form>
        
        {error && <p className="error-message">{error}</p>}
        
        {content && (
          <div className="content-container">
            <div className="content-meta">
              <h2>Learning: {content.meta?.skill || 'Unknown Skill'}</h2>
              <div className="meta-details">
                <span>Level: {content.meta?.difficulty || 'beginner'}</span>
                {content.meta?.generated_at && (
                  <span>Generated: {new Date(content.meta.generated_at).toLocaleString()}</span>
                )}
              </div>
            </div>
            
            <div className="content-section">
              <h3>Micro Lessons</h3>
              <ol className="lessons-list">
                {content.micro_lessons?.map((lesson, index) => (
                  <li key={index}>{lesson}</li>
                ))}
              </ol>
            </div>
            
            <div className="content-section">
              <h3>Test Your Knowledge</h3>
              <ol className="mcq-list">
                {content.mcqs?.map((mcq, index) => {
                  const isCorrect = quizSubmitted && userAnswers[index] === mcq.answer;
                  const isWrong = quizSubmitted && userAnswers[index] !== undefined && userAnswers[index] !== mcq.answer;
                  
                  return (
                    <li 
                      key={index} 
                      className={`mcq-item ${
                        isCorrect ? 'correct' : 
                        isWrong ? 'incorrect' : ''
                      }`}
                    >
                      <p className="question-text">{mcq.question}</p>
                      <ul className="options-list">
                        {mcq.options?.map((option, optIndex) => (
                          <li key={optIndex}>
                            <label className="option-label">
                              <input
                                type="radio"
                                name={`question-${index}`}
                                checked={userAnswers[index] === optIndex}
                                onChange={() => handleAnswerSelect(index, optIndex)}
                                disabled={quizSubmitted}
                                aria-label={`Option ${optIndex + 1}`}
                              />
                              <span className={`option ${
                                quizSubmitted && optIndex === mcq.answer ? 'correct-answer' : ''
                              }`}>
                                {option}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                      {quizSubmitted && (
                        <div className={`explanation ${
                          isCorrect ? 'correct' : isWrong ? 'incorrect' : ''
                        }`}>
                          {isCorrect 
                            ? '✓ Correct!' 
                            : isWrong 
                              ? `✗ Incorrect. The correct answer is: ${mcq.options[mcq.answer]}`
                              : `Correct answer: ${mcq.options[mcq.answer]}`}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              
              {!quizSubmitted ? (
                <button 
                  onClick={submitQuiz}
                  disabled={Object.keys(userAnswers).length !== content.mcqs?.length}
                  className="quiz-button"
                  aria-label="Submit quiz"
                >
                  Submit Quiz
                </button>
              ) : (
                <div className="quiz-results">
                  <h4>Your Score: {score}%</h4>
                  <p className="score-message">
                    {score >= 80 ? 'Excellent!' : 
                     score >= 60 ? 'Good job!' : 
                     'Keep practicing!'}
                  </p>
                  <button 
                    onClick={resetQuiz} 
                    className="quiz-button"
                    aria-label="Retry quiz"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
            
            {content.exercises?.length > 0 && (
              <div className="content-section">
                <h3>Practical Exercises</h3>
                <ol className="exercises-list">
                  {content.exercises.map((exercise, index) => (
                    <li key={index}>{exercise}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {content.key_takeaways?.length > 0 && (
              <div className="content-section">
                <h3>Key Takeaways</h3>
                <ul className="takeaways-list">
                  {content.key_takeaways.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {content.videos?.length > 0 && (
              <div className="content-section">
                <h3>Video Resources</h3>
                <div className="video-grid">
                  {content.videos.map((video, index) => (
                    <div key={index} className="video-card">
                      <h4>{video.title}</h4>
                      <div className="video-wrapper">
                        <iframe
                          src={video.url}
                          title={`Video about ${content.meta?.skill || 'the topic'}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <p className="video-description">{video.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {searchHistory.length > 0 && (
          <div className="history-section">
            <h3>Recent Searches</h3>
            <ul className="history-list">
              {searchHistory.map((item, index) => (
                <li 
                  key={index}
                  onClick={() => loadFromHistory(index)}
                  className={content?.meta?.skill === item.meta?.skill ? 'active' : ''}
                  aria-label={`Load ${item.meta?.skill} (${item.meta?.difficulty})`}
                >
                  {item.meta?.skill || 'Unknown'} ({item.meta?.difficulty || 'beginner'})
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
