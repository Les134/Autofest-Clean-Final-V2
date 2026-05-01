import React, { useState, useEffect } from "react";
import ScoreSheet from "./scoresheet";
import Leaderboard from "./leaderboard";

import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState(["", "", "", "", "", ""]);
  const [activeJudge, setActiveJudge] = useState("");
  const [eventLocked, setEventLocked] = useState(false);

  useEffect(() => {
    if (!eventName) return;
    const unsub = onSnapshot(doc(db, "events", eventName), (snap) => {
      if (snap.exists()) setEventLocked(snap.data().locked);
    });
    return () => unsub();
  }, [eventName]);

  const startEvent = async () => {
    const valid = judges.filter(j => j.trim());
    if (!eventName) return alert("Enter event name");
    if (!valid.length) return alert("Add judges");

    setJudges(valid);
    await setDoc(doc(db, "events", eventName), { locked: false });
    setScreen("judge");
  };

  const btn = {
    padding: 16,
    margin: 10,
    fontSize: 20,
    width: "100%",
    maxWidth: 300
  };

  if (screen === "home") {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <h1>🏁 AUTOFEST SERIES</h1>

        <button style={btn} onClick={() => setScreen("setup")}>
          START EVENT
        </button>

        <button style={btn} onClick={() => setScreen("judge")}>
          JUDGE LOGIN
        </button>

        <button style={btn} onClick={() => setScreen("leader")}>
          LEADERBOARD
        </button>
      </div>
    );
  }

  if (screen === "setup") {
    return (
      <div style={{ padding: 20 }}>
        <h2>EVENT SETUP</h2>

        <input
          style={{ fontSize: 20, padding: 10, width: "100%" }}
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        {judges.map((j, i) => (
          <input
            key={i}
            style={{ marginTop: 10, width: "100%" }}
            placeholder={`Judge ${i + 1}`}
            onChange={(e) => {
              const copy = [...judges];
              copy[i] = e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button style={btn} onClick={startEvent}>
          START
        </button>
      </div>
    );
  }

  if (screen === "judge") {
    return (
      <div style={{ padding: 20 }}>
        <h2>SELECT JUDGE</h2>

        {judges.map((j, i) => (
          <button
            key={i}
            style={btn}
            onClick={() => {
              setActiveJudge(j);
              setScreen("score");
            }}
          >
            {j}
          </button>
        ))}
      </div>
    );
  }

  if (screen === "score") {
    return (
      <div style={{ padding: 20 }}>
        <h2>{eventName}</h2>
        <h3>{activeJudge}</h3>

        {eventLocked && <h2 style={{ color: "red" }}>LOCKED</h2>}

        <ScoreSheet
          eventName={eventName}
          judgeName={activeJudge}
          eventLocked={eventLocked}
        />
      </div>
    );
  }

  if (screen === "leader") {
    return <Leaderboard eventName={eventName} />;
  }

  return null;
}
