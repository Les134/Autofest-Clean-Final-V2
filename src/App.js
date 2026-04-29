import React, { useState } from "react";
import ScoreSheet from "./ScoreSheet";
import Leaderboard from "./Leaderboard";

export default function App() {
  const [eventName, setEventName] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
        <h1 style={{ textAlign: "center" }}>🔥 AUTOFEST SCORING 🔥</h1>

        <input
          style={{ width: "100%", marginBottom: 10 }}
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        <input
          style={{ width: "100%", marginBottom: 20 }}
          placeholder="Judge Name"
          value={judgeName}
          onChange={(e) => setJudgeName(e.target.value)}
        />

        <button
          style={{ width: "100%", padding: 10 }}
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
