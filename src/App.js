import React, { useState, useEffect } from "react";
import Scoreboard from "./Scoreboard";
import Leaderboard from "./Leaderboard";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function App() {
  const [eventName, setEventName] = useState("");
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState([]);

  // 🔥 REAL-TIME FIREBASE LISTENER
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "results"), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setResults(data);
    });

    return () => unsub();
  }, []);

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
      <Scoreboard eventName={eventName} />
      <Leaderboard results={results} />
    </div>
  );
}
