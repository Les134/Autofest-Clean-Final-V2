import React, { useState } from "react";
import ScoreSheet from "./ScoreSheet";
import Leaderboard from "./Leaderboard";

export default function App() {
  const [eventName, setEventName] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div style={{ padding: 20 }}>
        <h1>AutoFest Scoring</h1>

        <div style={{ marginBottom: 10 }}>
          <input
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="Judge Name"
            value={judgeName}
            onChange={(e) => setJudgeName(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            if (!eventName || !judgeName) {
              alert("Enter event and judge name");
              return;
            }
            setStarted(true);
          }}
        >
          Start Judging
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{eventName} — Judge: {judgeName}</h2>

      <ScoreSheet eventName={eventName} judgeName={judgeName} />
      <Leaderboard eventName={eventName} />
    </div>
  );
}
