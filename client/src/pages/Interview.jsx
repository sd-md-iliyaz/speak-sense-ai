import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import AvatarFigure from "./AvatarFigure";
import FeedbackSidebar from "./FeedbackSidebar";
import "./interview.css";
import "./AvatarFigure.css";

export default function Interview() {
  const navigate = useNavigate();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarSelect, setShowAvatarSelect] = useState(true);
  const [useChat, setUseChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewActive, setInterviewActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Avatar posture state
  const [avatarPosture, setAvatarPosture] = useState("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  // Hover preview posture
  const [hoveredAvatarId, setHoveredAvatarId] = useState(null);
  // Feedback sidebar
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [interviewConfig, setInterviewConfig] = useState({
    mode: "balanced",
    difficulty: "intermediate",
    questionCount: 5
  });

  const videoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const timerRef = useRef(null);
  const speakTimerRef = useRef(null);

  const avatarCatalog = {
    default: [
      { id: 1, name: "Alex", gender: "male", role: "Technical Interviewer", avatar: "👨‍💼", color: "#4f9eff", bgColor: "linear-gradient(135deg, #0066cc, #004080)" },
      { id: 2, name: "Sarah", gender: "female", role: "HR Specialist", avatar: "👩‍💼", color: "#f687b3", bgColor: "linear-gradient(135deg, #d53f8c, #97266d)" },
      { id: 3, name: "Michael", gender: "male", role: "Senior Developer", avatar: "👨‍💻", color: "#48bb78", bgColor: "linear-gradient(135deg, #2f855a, #1e4b3c)" },
      { id: 4, name: "Luna", species: "animal", role: "Confidence Coach (Owl)", avatar: "🦉", color: "#9f7aea", bgColor: "linear-gradient(135deg, #5b21b6, #312e81)" },
      { id: 5, name: "Rex", species: "animal", role: "Behavior Mentor (Fox)", avatar: "🦊", color: "#ed8936", bgColor: "linear-gradient(135deg, #dd6b20, #9c4221)" },
      { id: 6, name: "Coco", species: "animal", role: "Communication Coach (Panda)", avatar: "🐼", color: "#38b2ac", bgColor: "linear-gradient(135deg, #0f766e, #234e52)" }
    ],
    software: [
      { id: 11, name: "Nova", gender: "female", role: "Frontend Architect", avatar: "👩‍💻", color: "#60a5fa", bgColor: "linear-gradient(135deg, #2563eb, #0f172a)" },
      { id: 12, name: "Kai", gender: "male", role: "System Design Lead", avatar: "👨‍💻", color: "#22d3ee", bgColor: "linear-gradient(135deg, #0e7490, #0f172a)" },
      { id: 13, name: "Byte", species: "animal", role: "Coding Pace Coach (Otter)", avatar: "🦦", color: "#34d399", bgColor: "linear-gradient(135deg, #047857, #052e16)" }
    ],
    data: [
      { id: 21, name: "Iris", gender: "female", role: "ML Interviewer", avatar: "👩‍🔬", color: "#818cf8", bgColor: "linear-gradient(135deg, #4338ca, #1f2937)" },
      { id: 22, name: "Atlas", gender: "male", role: "Analytics Lead", avatar: "👨‍🔬", color: "#2dd4bf", bgColor: "linear-gradient(135deg, #0f766e, #1f2937)" },
      { id: 23, name: "Pixel", species: "animal", role: "Insight Coach (Koala)", avatar: "🐨", color: "#f472b6", bgColor: "linear-gradient(135deg, #9d174d, #3f3f46)" }
    ]
  };

  const avatars = useMemo(() => {
    const industry = (userProfile?.industry || "").toLowerCase();
    if (industry.includes("software") || industry.includes("technology") || industry.includes("it")) {
      return [...avatarCatalog.software, ...avatarCatalog.default.slice(3)];
    }
    if (industry.includes("data") || industry.includes("ml") || industry.includes("machine")) {
      return [...avatarCatalog.data, ...avatarCatalog.default.slice(0, 3)];
    }
    return avatarCatalog.default;
  }, [userProfile]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    API.get("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setUserProfile(res.data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer
  useEffect(() => {
    if (interviewActive) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [interviewActive]);

  // ---- Posture helpers ----
  // Trigger "AI is speaking" animation for given duration (ms)
  const triggerSpeak = useCallback((durationMs = 3000) => {
    setAvatarPosture("speaking");
    setIsSpeaking(true);
    clearTimeout(speakTimerRef.current);
    speakTimerRef.current = setTimeout(() => {
      setIsSpeaking(false);
      setAvatarPosture("listening");
    }, durationMs);
  }, []);

  const triggerThinking = useCallback(() => {
    setAvatarPosture("thinking");
    setIsSpeaking(false);
  }, []);

  const triggerNod = useCallback(() => {
    setAvatarPosture("nodding");
    setTimeout(() => setAvatarPosture("listening"), 2000);
  }, []);

  // Request camera/mic
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setUseChat(false);
    } catch {
      setUseChat(true);
    }
  };

  // Start interview
  const startInterview = async (avatar) => {
    setSelectedAvatar(avatar);
    setShowAvatarSelect(false);
    await requestPermissions();
    setInterviewActive(true);
    triggerThinking();

    try {
      const response = await API.post("/interview/start", {
        avatar: { name: avatar.name },
        role: avatar.role,
        config: interviewConfig,
        industry: userProfile?.industry || ""
      });
      const greeting = response.data.message || `Hello! I'm ${avatar.name}, your ${avatar.role}. Let's begin. Please introduce yourself.`;
      setMessages([{ id: Date.now(), sender: "ai", message: greeting, timestamp: new Date().toLocaleTimeString() }]);
      triggerSpeak(greeting.length * 60);
    } catch {
      const greeting = `Hello! I'm ${avatar.name}, your ${avatar.role}. Let's begin. Please introduce yourself.`;
      setMessages([{ id: Date.now(), sender: "ai", message: greeting, timestamp: new Date().toLocaleTimeString() }]);
      triggerSpeak(greeting.length * 60);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = { id: Date.now(), sender: "user", message: inputMessage, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    const userInput = inputMessage;
    setInputMessage("");
    setLastUserMessage(userInput); // feed to feedback sidebar

    // Avatar starts thinking while waiting
    triggerThinking();
    setIsAiTyping(true);

    try {
      const response = await API.post("/interview/chat", {
        message: userInput,
        avatar: { name: selectedAvatar.name },
        role: selectedAvatar.role,
        questionCount: currentQuestion + 1,
        config: interviewConfig,
        industry: userProfile?.industry || ""
      });

      const aiMsg = { id: Date.now() + 1, sender: "ai", message: response.data.response, timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentQuestion(prev => prev + 1);

      // Nod briefly, then speak for the estimated time
      triggerNod();
      setTimeout(() => triggerSpeak(response.data.response.length * 65), 800);

      if (response.data.isComplete) {
        setTimeout(() => endInterview(), 3500);
      }
    } catch {
      const fallback = { id: Date.now() + 1, sender: "ai", message: "I'm having a little trouble. Please continue.", timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, fallback]);
      triggerSpeak(2000);
    } finally {
      setIsAiTyping(false);
    }
  };

  const endInterview = () => {
    setInterviewActive(false);
    clearInterval(timerRef.current);
    clearTimeout(speakTimerRef.current);
    setIsSpeaking(false);
    setAvatarPosture("idle");

    localStorage.setItem(
      "latestInterviewSummary",
      JSON.stringify({
        completedAt: new Date().toISOString(),
        interviewer: selectedAvatar?.name,
        role: selectedAvatar?.role,
        mode: useChat ? "Chat" : "Video",
        durationSeconds: timeElapsed,
        questionsAnswered: currentQuestion,
        config: interviewConfig,
        industry: userProfile?.industry || ""
      })
    );

    setShowResults(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMute = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getAudioTracks();
      tracks.forEach(t => (t.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getVideoTracks();
      tracks.forEach(t => (t.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="interview-page">
      {/* Background */}
      <div className="interview-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
      </div>

      <div className="interview-container">
        {/* Header */}
        <div className="interview-header">
          <Link to="/dashboard" className="back-link">
            <span className="back-icon">←</span>
            Back to Dashboard
          </Link>
          <h1>AI Mock Interview</h1>
          {interviewActive && (
            <div className="interview-timer">
              <span className="timer-icon">⏱️</span>
              <span className="timer-text">{formatTime(timeElapsed)}</span>
            </div>
          )}
        </div>

        {showAvatarSelect ? (
          /* ===== AVATAR SELECTION ===== */
          <div className="avatar-selection">
            <h2>Choose Your Interviewer</h2>
            <p>
              {userProfile?.industry
                ? `Personalized for ${userProfile.industry}.`
                : "Select an AI interviewer and start your 1:1 mock interview"}
            </p>

            <div className="interview-config-panel">
              <div className="config-item">
                <label htmlFor="configMode">Interview Focus</label>
                <select
                  id="configMode"
                  value={interviewConfig.mode}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, mode: e.target.value }))}
                >
                  <option value="balanced">Balanced</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="communication">Communication</option>
                </select>
              </div>

              <div className="config-item">
                <label htmlFor="configDifficulty">Difficulty</label>
                <select
                  id="configDifficulty"
                  value={interviewConfig.difficulty}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, difficulty: e.target.value }))}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="config-item">
                <label htmlFor="configCount">Question Count</label>
                <input
                  id="configCount"
                  type="number"
                  min="3"
                  max="10"
                  value={interviewConfig.questionCount}
                  onChange={(e) => setInterviewConfig((prev) => ({ ...prev, questionCount: Number(e.target.value) || 5 }))}
                />
              </div>
            </div>

            <div className="avatars-grid">
              {avatars.map(avatar => (
                <div
                  key={avatar.id}
                  className={`avatar-card ${hoveredAvatarId === avatar.id ? "avatar-card-hovered" : ""}`}
                  onClick={() => startInterview(avatar)}
                  onMouseEnter={() => setHoveredAvatarId(avatar.id)}
                  onMouseLeave={() => setHoveredAvatarId(null)}
                  style={{ background: avatar.bgColor }}
                >
                  {/* Animated SVG avatar preview */}
                  <div className="avatar-preview">
                    <AvatarFigure
                      avatar={avatar}
                      isSpeaking={hoveredAvatarId === avatar.id}
                      posture={hoveredAvatarId === avatar.id ? "speaking" : "idle"}
                    />
                  </div>

                  <h3>{avatar.name}</h3>
                  <p className="avatar-role">{avatar.role}</p>
                  <button className="select-avatar-btn">
                    Start Interview →
                  </button>
                </div>
              ))}
            </div>
          </div>

        ) : showResults ? (
          /* ===== RESULTS ===== */
          <div className="results-screen">
            <div className="results-card">
              <div className="results-icon">🏆</div>
              <h2>Interview Completed!</h2>
              <p>Great job! Your interview has been analyzed.</p>

              <div className="results-stats">
                <div className="result-stat">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{formatTime(timeElapsed)}</span>
                </div>
                <div className="result-stat">
                  <span className="stat-label">Questions</span>
                  <span className="stat-value">{currentQuestion}</span>
                </div>
                <div className="result-stat">
                  <span className="stat-label">Mode</span>
                  <span className="stat-value">{useChat ? "Chat" : "Video"}</span>
                </div>
              </div>

              <div className="results-actions">
                <Link to="/results" className="view-results-btn">View Detailed Results →</Link>
                <button
                  className="new-interview-btn"
                  onClick={() => {
                    setShowAvatarSelect(true);
                    setSelectedAvatar(null);
                    setMessages([]);
                    setCurrentQuestion(0);
                    setTimeElapsed(0);
                    setAvatarPosture("idle");
                  }}
                >
                  New Interview
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* ===== ACTIVE INTERVIEW SESSION ===== */
          <div className="interview-session">
            <div className="interview-main">
              {/* Left: AI avatar panel + user video */}
              <div className="interview-area">
                {/* AI Avatar Panel (always visible) */}
                <div className="ai-avatar-panel">
                  <div className="panel-bg-lines"></div>

                  {/* Animated human avatar */}
                  <AvatarFigure
                    avatar={selectedAvatar}
                    isSpeaking={isSpeaking}
                    posture={avatarPosture}
                  />

                  <div className="ai-panel-name">{selectedAvatar?.name}</div>
                  <div className="ai-panel-role">{selectedAvatar?.role}</div>
                  <div className="ai-panel-status">
                    <span className="status-dot"></span>
                    <span>{isAiTyping ? "Thinking…" : isSpeaking ? "Speaking…" : "Listening"}</span>
                  </div>

                  <div className="panel-desk"></div>
                </div>

                {/* User video / chat toggle */}
                {!useChat ? (
                  <div className="video-container video-container-user">
                    <video ref={videoRef} autoPlay playsInline muted={isMuted} className={isVideoOff ? "video-off" : ""} />
                    {isVideoOff && (
                      <div className="video-off-placeholder">
                        <span className="video-off-icon">📹</span>
                        <p>Camera is off</p>
                      </div>
                    )}
                    <div className="video-controls">
                      <button className={`control-btn ${isMuted ? "active" : ""}`} onClick={toggleMute}>
                        {isMuted ? "🔇" : "🎤"}
                      </button>
                      <button className={`control-btn ${isVideoOff ? "active" : ""}`} onClick={toggleVideo}>
                        {isVideoOff ? "📷" : "🎥"}
                      </button>
                      <button className="control-btn settings" onClick={() => setUseChat(true)}>
                        💬 Chat Mode
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Chat mode */
                  <div className="chat-container">
                    <div className="chat-header">
                      <div className="chat-avatar">
                        <span className="chat-avatar-icon">{selectedAvatar?.avatar}</span>
                        <div>
                          <h3>{selectedAvatar?.name}</h3>
                          <p>{selectedAvatar?.role}</p>
                        </div>
                      </div>
                      <button className="switch-video-btn" onClick={() => setUseChat(false)}>
                        📹 Video Mode
                      </button>
                    </div>

                    <div className="chat-messages" ref={chatContainerRef}>
                      {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.sender === "user" ? "user-message" : "ai-message"}`}>
                          <div className="message-avatar">
                            {msg.sender === "user" ? "👤" : selectedAvatar?.avatar}
                          </div>
                          <div className="message-content">
                            <div className="message-header">
                              <span className="message-sender">
                                {msg.sender === "user" ? "You" : selectedAvatar?.name}
                              </span>
                              <span className="message-time">{msg.timestamp}</span>
                            </div>
                            <p className="message-text">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                      {isAiTyping && (
                        <div className="message ai-message">
                          <div className="message-avatar">{selectedAvatar?.avatar}</div>
                          <div className="message-content">
                            <div className="typing-indicator">
                              <span></span><span></span><span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={sendMessage} className="chat-input-form">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        placeholder="Type your response…"
                        className="chat-input"
                        disabled={isAiTyping}
                      />
                      <button type="submit" className="send-btn" disabled={isAiTyping || !inputMessage.trim()}>
                        Send →
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Feedback Sidebar (grammar, improvements, topics) */}
              <FeedbackSidebar
                lastUserMessage={lastUserMessage}
                isOpen={feedbackOpen}
                onToggle={() => setFeedbackOpen(o => !o)}
              />

              {/* Right Interview Detail Sidebar */}
              <div className="interview-sidebar">
                <div className="current-question">
                  <h3>Interview Progress</h3>
                  <div className="question-box">
                    <p>{messages.filter(m => m.sender === "ai").slice(-1)[0]?.message || "Waiting for interview to start…"}</p>
                  </div>
                  <div className="question-progress">
                    <span>Question {currentQuestion} / 5</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min((currentQuestion / 5) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="interview-info">
                  <h3>Interview Details</h3>
                  <div className="info-item">
                    <span className="info-label">Interviewer:</span>
                    <span className="info-value">{selectedAvatar?.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{selectedAvatar?.role}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mode:</span>
                    <span className="info-value">{useChat ? "Chat" : "Video"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duration:</span>
                    <span className="info-value">{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value" style={{ color: isSpeaking ? "#10b981" : isAiTyping ? "#f59e0b" : "#99aacc" }}>
                      {isAiTyping ? "🤔 Thinking" : isSpeaking ? "🗣️ Speaking" : "👂 Listening"}
                    </span>
                  </div>
                </div>

                <div className="interview-tips">
                  <h3>Quick Tips</h3>
                  <ul>
                    <li>✓ Speak clearly and confidently</li>
                    <li>✓ Use the STAR method for answers</li>
                    <li>✓ Take your time before answering</li>
                    <li>✓ Maintain eye contact</li>
                  </ul>
                </div>

                <button className="end-interview-btn" onClick={endInterview}>
                  End Interview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}