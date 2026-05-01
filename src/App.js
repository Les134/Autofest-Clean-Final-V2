import React, { useState } from "react";
import ScoreSheet from "./scoresheet";
import Leaderboard from "./leaderboard";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [eventName] = useState("autofest-live");
  const [judgeName, setJudgeName] = useState("");
  const [round, setRound] = useState("round1");

  const rounds = [
    "round1",
    "round2",
    "top150",
    "top30",
    "finals"
  ];

  const btn = { width: "100%", padding: 16, margin: 6 };

  if (screen === "home") {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={btn} onClick={() => setScreen("login")}>
          Judge Login
        </button>

        <button style={btn} onClick={() => setScreen("leader")}>
          Leaderboard
        </button>

        <button style={btn} onClick={() => setScreen("admin")}>
          Admin
        </button>
      </div>
    );
  }

  if (screen === "login") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Judge Login</h2>

        <input
          placeholder="Judge Name"
          onChange={(e) => setJudgeName(e.target.value)}
        />

        <h3>Select Round</h3>
        {rounds.map(r => (
          <button key={r} onClick={() => setRound(r)}>
            {r}
          </button>
        ))}

        <button onClick={() => setScreen("score")}>Start</button>
      </div>
    );
  }

  if (screen === "score") {
    return (
      <ScoreSheet
        eventName={eventName}
        judgeName={judgeName}
        round={round}
      />
    );
  }

  if (screen === "leader") {
    return (
      <Leaderboard
        eventName={eventName}
        round={round}
      />
    );
  }

  if (screen === "admin") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Admin Panel</h2>

        <p>Round Control</p>
        {rounds.map(r => (
          <button key={r} onClick={() => setRound(r)}>
            {r}
          </button>
        ))}

        <p>Archive event handled in Firebase console</p>

        <button onClick={() => setScreen("home")}>Back</button>
      </div>
    );
  }

  return null;
}
