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
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [judges, setJudges] = useState(["", "", "", "", "", ""]);
  const [activeJudge, setActiveJudge] = useState("");

  const [events, setEvents] = useState([]);
  const [entries, setEntries] = useState([]);

  const [car, setCar] = useState("");
  const [name, setName] = useState("");
  const [rego, setRego] = useState("");
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

      setEntries(
        data.filter(e => e.eventName === eventName)
      );
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
      createdAt: new Date(),
      locked: false
    });

    setJudges(valid);
    setSelectedEvent({ name: eventName, judges: valid });
    setScreen("judge");
  };

  // ================= SUBMIT SCORE =================
  const submit = async () => {

    if (saving) return;
    if (!car) return alert("Enter Car #");

    const alreadyScored = entries.find(e =>
      e.car === car &&
      e.judge === activeJudge &&
      e.eventName === eventName
    );

    if (alreadyScored) {
      return alert("You already scored this car");
    }

    setSaving(true);

    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    await addDoc(collection(db, "scores"), {
      eventName,
      car,
      name,
      rego,
      carClass,
      judge: activeJudge,
      total,
      createdAt: new Date()
    });

    setScores({});
    setCar("");
    setName("");
    setRego("");
    setCarClass("");

    setSaving(false);
  };

  // ================= LEADERBOARD =================
  const grouped = {};

  entries.forEach(e => {
    const key = e.car + "_" + e.carClass;

    if (!grouped[key]) {
      grouped[key] = {
        car: e.car,
        carClass: e.carClass,
        total: 0
      };
    }

    grouped[key].total += e.total;
  });

  const leaderboard = Object.values(grouped)
    .sort((a, b) => b.total - a.total);

  const classGroups = {};

  leaderboard.forEach(e => {
    if (!classGroups[e.carClass]) {
      classGroups[e.carClass] = [];
    }
    classGroups[e.carClass].push(e);
  });

  // ================= STYLES =================
  const big = { padding: 18, margin: 10, width: "100%" };
  const btn = { padding: 10, margin: 5 };
  const active = { ...btn, background: "red", color: "#fff" };
  const classActive = { ...btn, background: "green", color: "#fff" };

  // ================= HOME =================
  if (screen === "home") {
    return (
      <div style={{ padding: 20 }}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={big} onClick={() => setScreen("setup")}>Start Event</button>
        <button style={big} onClick={() => setScreen("eventSelect")}>Judge Login</button>
        <button style={big} onClick={() => setScreen("leader")}>Leaderboard</button>
      </div>
    );
  }

  // ================= SETUP =================
  if (screen === "setup") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Event Setup</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        {judges.map((j, i) => (
          <input key={i}
            placeholder={`Judge ${i + 1}`}
            value={judges[i]}
            onChange={(e) => {
              const copy = [...judges];
              copy[i] = e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button style={big} onClick={startEvent}>Start Event</button>
        <button style={big} onClick={() => setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= EVENT SELECT =================
  if (screen === "eventSelect") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Select Event</h2>

        {events.map(e => (
          <button key={e.id} style={big}
            onClick={() => {
              setSelectedEvent(e);
              setJudges(e.judges);
              setEventName(e.name);
              setScreen("judge");
            }}>
            {e.name}
          </button>
        ))}

        <button style={big} onClick={() => setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= JUDGE =================
  if (screen === "judge") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Select Judge</h2>

        {judges.map((j, i) => (
          <button key={i} style={big}
            onClick={() => {
              setActiveJudge(j);
              setScreen("score");
            }}>
            {j}
          </button>
        ))}

        <button style={big} onClick={() => setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= SCORE =================
  if (screen === "score") {
    return (
      <div style={{ padding: 20 }}>
        <h3>{eventName} | {activeJudge}</h3>

        <input placeholder="Car #" value={car} onChange={(e) => setCar(e.target.value)} />
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Rego" value={rego} onChange={(e) => setRego(e.target.value)} />

        <div>
          {classes.map(c => (
            <button key={c}
              style={carClass === c ? classActive : btn}
              onClick={() => setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat => (
          <div key={cat}>
            <strong>{cat}</strong><br />
            {Array.from({ length: 21 }, (_, i) => (
              <button key={i}
                style={scores[cat] === i ? active : btn}
                onClick={() => setScores({ ...scores, [cat]: i })}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit Score"}
        </button>

        <button style={big} onClick={() => setScreen("judge")}>Next Judge</button>
        <button style={big} onClick={() => setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= LEADERBOARD =================
  if (screen === "leader") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Leaderboard</h2>

        {Object.keys(classGroups).map(cls => (
          <div key={cls}>
            <h3>{cls}</h3>

            {classGroups[cls].map((e, i) => (
              <div key={i}>
                #{i + 1} | Car: {e.car} | Score: {e.total}
              </div>
            ))}
          </div>
        ))}

        <button style={big} onClick={() => setScreen("home")}>Back</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
