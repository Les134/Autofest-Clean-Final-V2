import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const classes = [
  "V8 Pro",
  "V8 N/A",
  "6 Cyl Pro",
  "6 Cyl N/A",
  "4Cyl Open/Rotary"
];

export default function App() {
  const [screen, setScreen] = useState("home");

  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState(["", "", "", "", "", ""]);
  const [activeJudge, setActiveJudge] = useState("");

  const [events, setEvents] = useState([]);
  const [entries, setEntries] = useState([]);

  const [car, setCar] = useState("");
  const [carClass, setCarClass] = useState("");
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  // ================= FIREBASE =================
  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, "events"), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubScores = onSnapshot(collection(db, "scores"), snap => {
      const data = snap.docs.map(d => d.data());
      setEntries(data.filter(e => e.eventName === eventName));
    });

    return () => {
      unsubEvents();
      unsubScores();
    };
  }, [eventName]);

  // ================= START EVENT =================
  const startEvent = async () => {
    const valid = judges.filter(j => j.trim() !== "");
    if (!eventName) return alert("Enter event name");
    if (valid.length === 0) return alert("Add at least 1 judge");

    await addDoc(collection(db, "events"), {
      name: eventName,
      judges: valid,
      createdAt: new Date()
    });

    setJudges(valid);
    setScreen("judge");
  };

  // ================= SUBMIT SCORE =================
  const submit = async () => {
    if (saving) return;
    if (!car) return alert("Enter Car #");

    const already = entries.find(e =>
      e.car === car &&
      e.judge === activeJudge &&
      e.eventName === eventName
    );

    if (already) return alert("Already scored");

    setSaving(true);

    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    await addDoc(collection(db, "scores"), {
      eventName,
      car,
      carClass,
      judge: activeJudge,
      total,
      createdAt: new Date()
    });

    setScores({});
    setCar("");
    setCarClass("");
    setSaving(false);
  };

  // ================= LEADERBOARD =================
  const grouped = {};
  entries.forEach(e => {
    const key = e.car + "_" + e.carClass;
    if (!grouped[key]) {
      grouped[key] = { car: e.car, carClass: e.carClass, total: 0 };
    }
    grouped[key].total += e.total;
  });

  const leaderboard = Object.values(grouped).sort((a, b) => b.total - a.total);

  const classGroups = {};
  leaderboard.forEach(e => {
    if (!classGroups[e.carClass]) classGroups[e.carClass] = [];
    classGroups[e.carClass].push(e);
  });

  const big = { padding: 15, margin: 10, width: "100%" };
  const btn = { margin: 5 };

  // ================= SCREENS =================
  if (screen === "home") {
    return (
      <div style={{ padding: 20 }}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>
        <button style={big} onClick={() => setScreen("setup")}>Start Event</button>
        <button style={big} onClick={() => setScreen("judge")}>Judge Login</button>
        <button style={big} onClick={() => setScreen("leader")}>Leaderboard</button>
      </div>
    );
  }

  if (screen === "setup") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Event Setup</h2>
        <input placeholder="Event Name" value={eventName} onChange={e => setEventName(e.target.value)} />
        {judges.map((j, i) => (
          <input key={i} placeholder={`Judge ${i + 1}`} value={j}
            onChange={e => {
              const copy = [...judges];
              copy[i] = e.target.value;
              setJudges(copy);
            }} />
        ))}
        <button style={big} onClick={startEvent}>Start Event</button>
      </div>
    );
  }

  if (screen === "judge") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Select Judge</h2>
        {judges.map((j, i) => (
          <button key={i} style={big} onClick={() => {
            setActiveJudge(j);
            setScreen("score");
          }}>{j}</button>
        ))}
      </div>
    );
  }

  if (screen === "score") {
    return (
      <div style={{ padding: 20 }}>
        <h3>{eventName} | {activeJudge}</h3>

        <input placeholder="Car #" value={car} onChange={e => setCar(e.target.value)} />

        <div>
          {classes.map(c => (
            <button key={c} style={btn} onClick={() => setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat => (
          <div key={cat}>
            <strong>{cat}</strong><br />
            {Array.from({ length: 21 }, (_, i) => (
              <button key={i} style={btn}
                onClick={() => setScores({ ...scores, [cat]: i })}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit"}
        </button>
      </div>
    );
  }

  if (screen === "leader") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Leaderboard</h2>
        {Object.keys(classGroups).map(cls => (
          <div key={cls}>
            <h3>{cls}</h3>
            {classGroups[cls].map((e, i) => (
              <div key={i}>
                #{i + 1} | {e.car} | {e.total}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return <div>Loading...</div>;
}
