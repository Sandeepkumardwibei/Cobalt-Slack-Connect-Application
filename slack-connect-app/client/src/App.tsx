import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

interface ScheduledMessage {
  id: string;
  channel: string;
  text: string;
  time: string;
}

const App: React.FC = () => {
  const [channel, setChannel] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [timer, setTimer] = useState<number | null>(null);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);

  const fetchScheduledMessages = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/scheduledMessages");
      setScheduledMessages(res.data);
    } catch {
      console.error("❌ Failed to fetch scheduled messages");
    }
  };

  useEffect(() => {
    fetchScheduledMessages();
    const interval = setInterval(fetchScheduledMessages, 1000);
    return () => clearInterval(interval);
  }, []);

  const getCountdown = (time: string) => {
    const diff = Math.floor((new Date(time).getTime() - Date.now()) / 1000);
    if (diff <= 0) return "🚀 Sent!";
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    return `${min}m ${sec}s`;
  };

  const sendMessage = async () => {
    try {
      await axios.post("http://localhost:3001/api/sendMessage", { channel, text: message });
      toast.success("✅ Message Sent!");
      fetchScheduledMessages();
    } catch {
      toast.error("❌ Failed to send message");
    }
  };

  const scheduleMessage = async () => {
    try {
      await axios.post("http://localhost:3001/api/scheduleMessage", {
        id: Date.now().toString(),
        channel,
        text: message,
        time: scheduleTime,
      });
      const diff = Math.floor((new Date(scheduleTime).getTime() - Date.now()) / 1000);
      setTimer(diff);
      toast.info("⏳ Message Scheduled!");
      fetchScheduledMessages();
    } catch {
      toast.error("❌ Failed to schedule message");
    }
  };

  const deleteScheduledMessage = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/scheduledMessages/${id}`);
      toast.warn("🗑️ Scheduled Message Deleted");
      fetchScheduledMessages();
    } catch {
      toast.error("❌ Failed to delete message");
    }
  };

  return (
    <div className="app-container fade-in">
      {/* Slack Connect */}
      <div className="slack-connect">
        <a href="https://d05eeb4f0332.ngrok-free.app/auth/slack/callback" target="_blank" rel="noopener noreferrer">
          <button className="connect-btn">🔗 Connect to Slack</button>
        </a>
      </div>

      <h1 className="title">Slack Connect Dashboard</h1>

      {/* Input Form */}
      <div className="form-group">
        <label>Channel</label>
        <input
          type="text"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="#general"
        />
      </div>

      <div className="form-group">
        <label>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        ></textarea>
      </div>

      <div className="form-group">
        <label>Schedule Time</label>
        <input
          type="datetime-local"
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="button-group">
        <button onClick={sendMessage} className="send-btn">Send Now</button>
        <button onClick={scheduleMessage} className="schedule-btn">Schedule</button>
      </div>

      {timer !== null && timer > 0 && <p className="timer pulse">⏱ Sending in: {timer}s</p>}

      {/* Scheduled Messages */}
      <h2 className="scheduled-heading">📅 Scheduled Messages</h2>
      {scheduledMessages.length === 0 ? (
        <p>No scheduled messages</p>
      ) : (
        <ul className="scheduled-list">
          {scheduledMessages.map((msg) => {
            const diff = Math.floor((new Date(msg.time).getTime() - Date.now()) / 1000);
            return (
              <li
                key={msg.id}
                className={`scheduled-item ${diff <= 10 && diff > 0 ? "urgent" : ""}`}
              >
                <span>
                  <b>{msg.channel}</b> — {msg.text}
                  <span className="countdown"> ({getCountdown(msg.time)})</span>
                </span>
                <button className="delete-btn" onClick={() => deleteScheduledMessage(msg.id)}>
                  ❌
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default App;
