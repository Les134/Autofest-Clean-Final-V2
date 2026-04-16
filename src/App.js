import React, { useState } from "react";
import Scoreboard from "./Scoreboard";
import Leaderboard from "./Leaderboard";

export default function App() {
  const [eventName, setEventName] = useState("");
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState([]);

  if (!started) {
    return (
      <div style={{ padding: 20 }}>
        <h1>AutoFest Scoring</h1>

        <input
          placeholder="Enter Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          style={{ padding: 10 }}
        />

        <br /><br />

        <button onClick={() => setStarted(true)}>
          Start Event
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <Scoreboard eventName={eventName} setResults={setResults} />
      <Leaderboard results={results} />
    </div>
  );
}
