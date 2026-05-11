import React, { useState, useEffect } from "react";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  getDocs
} from "firebase/firestore";

import { db } from "./firebase";

export default function App() {

  const [screen, setScreen] = useState("home");
  const [events, setEvents] = useState([]);
  const [scores, setScores] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedJudge, setSelectedJudge] = useState("");
  const [selectedRound, setSelectedRound] = useState("Round One");

  const [eventName, setEventName] = useState("");
  const [judgeName, setJudgeName] = useState("");

  const blankScore = {
    car: "",
    driver: "",
    gender: "",
    carClass: "",
    instant: 0,
    volume: 0,
    constant: 0,
    skill: 0,
    tyres: [],
    deductions: [],
    total: 0
  };

  const [score, setScore] = useState(blankScore);

  useEffect(() => {

    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        setEvents(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }))
        );
      }
    );

    const unsubScores = onSnapshot(
      collection(db, "scores"),
      (snapshot) => {
        setScores(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }))
        );
      }
    );

    return () => {
      unsubEvents();
      unsubScores();
    };

  }, []);

  // Always derive selectedEvent from live events so judges/lock/archive
  // status update instantly after any change.
  const selectedEvent =
    events.find((e) => e.id === selectedEventId) || null;

  const createEvent = async () => {

    if (!eventName) return;

    const trimmed = eventName.trim();
    if (!trimmed) return;

    // Archive protection: don't allow creating an event with the same
    // name as an existing (active OR archived) one.
    const clash = events.find(
      (e) => (e.name || "").toLowerCase() === trimmed.toLowerCase()
    );

    if (clash) {
      alert(
        clash.archived
          ? "An archived event already uses this name"
          : "An event with this name already exists"
      );
      return;
    }

    await addDoc(collection(db, "events"), {
      name: trimmed,
      judges: [],
      archived: false,
      locked: false,
      created: Date.now()
    });

    setEventName("");
  };

  const addJudge = async () => {

    if (!selectedEvent) return;
    if (!judgeName) return;

    if (selectedEvent.archived) {
      alert("Event Archived");
      return;
    }

    if (selectedEvent.locked) {
      alert("Event Locked");
      return;
    }

    const trimmed = judgeName.trim();
    if (!trimmed) return;

    const exists = selectedEvent.judges?.includes(trimmed);

    if (exists) {
      alert("Judge already exists");
      return;
    }

    const updated = [
      ...(selectedEvent.judges || []),
      trimmed
    ];

    await updateDoc(
      doc(db, "events", selectedEvent.id),
      {
        judges: updated
      }
    );

    setJudgeName("");
  };

  const archiveEvent = async (id) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    if (ev.archived) return;

    await updateDoc(doc(db, "events", id), {
      archived: true,
      locked: true
    });
  };

  const lockEvent = async (id) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    if (ev.archived) return;
    if (ev.locked) return;

    await updateDoc(doc(db, "events", id), {
      locked: true
    });
  };

  const calculateTotal = (data) => {

    let total =
      Number(data.instant) +
      Number(data.volume) +
      Number(data.constant) +
      Number(data.skill);

    total += data.tyres.length * 5;

    total -= data.deductions.length * 10;

    setScore({
      ...data,
      total
    });
  };

  const setScoreValue = (field, value) => {

    calculateTotal({
      ...score,
      [field]: value
    });
  };

  const toggleDeduction = (name) => {

    let updated = [...score.deductions];

    if (updated.includes(name)) {
      updated = updated.filter((d) => d !== name);
    } else {
      updated.push(name);
    }

    calculateTotal({
      ...score,
      deductions: updated
    });
  };

  const toggleTyre = (side) => {

    let updated = [...score.tyres];

    if (updated.includes(side)) {
      updated = updated.filter((t) => t !== side);
    } else {
      updated.push(side);
    }

    calculateTotal({
      ...score,
      tyres: updated
    });
  };

  const submitScore = async () => {

    if (!selectedEvent) return;
    if (!selectedJudge) return;
    if (!score.car) return;

    if (selectedEvent.archived) {
      alert("Event Archived");
      return;
    }

    if (selectedEvent.locked) {
      alert("Event Locked");
      return;
    }

    const duplicateQuery = query(
      collection(db, "scores"),
      where("eventId", "==", selectedEvent.id),
      where("round", "==", selectedRound),
      where("judge", "==", selectedJudge),
      where("car", "==", score.car.trim().toUpperCase())
    );

    const duplicateSnapshot = await getDocs(duplicateQuery);

    if (!duplicateSnapshot.empty) {
      alert("Judge already scored this entrant");
      return;
    }

    await addDoc(collection(db, "scores"), {
      ...score,
      car: score.car.trim().toUpperCase(),
      judge: selectedJudge,
      round: selectedRound,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      tyreBonus: score.tyres.length * 5,
      deductionTotal: score.deductions.length * 10,
      created: Date.now()
    });

    setScore(blankScore);

    alert("Score Saved");
  };

  // Strict round separation — leaderboards only show scores from the
  // currently selected round of the currently selected event.
  const results = scores.filter(
    (s) =>
      s.eventId === selectedEvent?.id &&
      s.round === selectedRound
  );

  const grouped = {};

  results.forEach((r) => {

    const key = `${r.car}_${r.round}_${r.eventId}`;

    if (!grouped[key]) {
  grouped[key] = {
    car: r.car,
    driver: r.driver,
    gender: r.gender,
    carClass: r.carClass,
    total: 0,
    tyreBonus: 0,
    deductionTotal: 0,
    deductionNames: [],
    judges: new Set()
  };
}

if (!grouped[key].judges.has(r.judge)) {

  grouped[key].total += Number(r.total || 0);

  grouped[key].tyreBonus += Number(r.tyreBonus || 0);

  grouped[key].deductionTotal += Number(
    r.deductionTotal || 0
  );

  grouped[key].deductionNames = [
    ...new Set([
      ...grouped[key].deductionNames,
      ...(r.deductions || [])
    ])
  ];

  grouped[key].judges.add(r.judge);
}
  });

  const leaderboard = Object.values(grouped)
    .map((r) => ({
      ...r,
      judges: Array.from(r.judges),
      combinedTotal: r.total
    }))
    .sort((a, b) => b.combinedTotal - a.combinedTotal);

  const female = leaderboard.filter(
    (r) => r.gender === "Female"
  );

  const byClass = {};

  leaderboard.forEach((r) => {

    if (!byClass[r.carClass]) {
      byClass[r.carClass] = [];
    }

    byClass[r.carClass].push(r);
  });

  const styles = {

    page: {
      minHeight: "100vh",
      background: "#050816",
      padding: 20,
      color: "white",
      fontFamily: "Arial"
    },

    title: {
      fontSize: 34,
      fontWeight: "bold",
      marginBottom: 20
    },

    input: {
      width: "100%",
      padding: 14,
      marginBottom: 10,
      background: "#10182f",
      color: "white",
      border: "1px solid #444"
    },

    button: {
      width: "100%",
      padding: 14,
      marginBottom: 10,
      background: "#10182f",
      color: "white",
      border: "1px solid #444",
      fontWeight: "bold"
    },

    active: {
      background: "red"
    },

    row: {
      display: "flex",
      gap: 4,
      overflowX: "auto",
      marginBottom: 10
    },

    scoreButton: {
      minWidth: 58,
      height: 46,
      background: "#10182f",
      color: "white",
      border: "1px solid #444",
      fontWeight: "bold"
    }
  };

  const renderResults = (list) => (
  <div>
    {list.map((r, i) => (
      <div
        key={i}
        style={{
          padding: 10,
          borderBottom: "1px solid #333"
        }}
      >
        #{i + 1} | {r.car} | {r.carClass} |

        Judges: {r.judges.length} |

        Tyres: +{r.tyreBonus} |

        Deductions: -{r.deductionTotal}

        {r.deductionNames?.length > 0 && (
          <>
            {" "}|
            {" "}
            {r.deductionNames.join(", ")}
          </>
        )}

        {" "}|
        {" "}
        Total: {r.combinedTotal}
      </div>
    ))}
  </div>
);



  // Shared footer for every leaderboard screen.
  const leaderboardFooter = (
    <>
      <button style={styles.button} onClick={() => window.print()}>
        Print
      </button>

      <button style={styles.button} onClick={() => setScreen("home")}>
        Home
      </button>
    </>
  );

  if (screen === "home") {
    return (
      <div style={styles.page}>

        <div style={styles.title}>
          🔥 AUTOFEST 🔥
        </div>

        <button style={styles.button} onClick={() => setScreen("event")}>
          Event / Judge Login
        </button>

        <button style={styles.button} onClick={() => setScreen("scoresheet")}>
          Return To Scoresheet
        </button>

        <button style={styles.button} onClick={() => setScreen("leaderboard")}>
          Leaderboard
        </button>

        <button style={styles.button} onClick={() => setScreen("class")}>
          Class Leaderboard
        </button>

        <button style={styles.button} onClick={() => setScreen("female")}>
          Female Overall
        </button>

        <button style={styles.button} onClick={() => setScreen("top150")}>
          Top 150
        </button>

        <button style={styles.button} onClick={() => setScreen("top30")}>
          Top 30 Finals
        </button>

      </div>
    );
  }

  if (screen === "event") {
    return (
      <div style={styles.page}>

        <div style={styles.title}>EVENT LOGIN</div>

        <input
          style={styles.input}
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Event Name"
        />

        <button style={styles.button} onClick={createEvent}>
          Create Event
        </button>

        {events.filter((e) => !e.archived).map((event) => (
          <div key={event.id}>

            <button
              style={{
                ...styles.button,
                ...(selectedEventId === event.id
                  ? styles.active
                  : {})
              }}
              onClick={() => setSelectedEventId(event.id)}
            >
              {event.name}
              {event.locked ? " 🔒" : ""}
            </button>

            <button
              style={styles.button}
              onClick={() => archiveEvent(event.id)}
            >
              Archive Event
            </button>

            {!event.locked && (
              <button
                style={styles.button}
                onClick={() => lockEvent(event.id)}
              >
                Lock Event
              </button>
            )}

          </div>
        ))}

        {selectedEvent && (
          <>

            {!selectedEvent.locked && !selectedEvent.archived && (
              <>

                <input
                  style={styles.input}
                  value={judgeName}
                  onChange={(e) => setJudgeName(e.target.value)}
                  placeholder="Judge Name"
                />

                <button style={styles.button} onClick={addJudge}>
                  Add Judge
                </button>

              </>
            )}

            <div style={styles.row}>
              {["Round One", "Round Two", "Finals"].map((r) => (
                <button
                  key={r}
                  style={{
                    ...styles.scoreButton,
                    ...(selectedRound === r
                      ? styles.active
                      : {})
                  }}
                  onClick={() => setSelectedRound(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            {selectedEvent.judges?.map((j, i) => (
              <button
                key={i}
                style={{
                  ...styles.button,
                  ...(selectedJudge === j
                    ? styles.active
                    : {})
                }}
                onClick={() => {
                  setSelectedJudge(j);
                  setScreen("scoresheet");
                }}
              >
                {j}
              </button>
            ))}

          </>
        )}

        <button style={styles.button} onClick={() => setScreen("home")}>
          Home
        </button>

      </div>
    );
  }

  if (screen === "scoresheet") {

    const locked = selectedEvent?.locked || selectedEvent?.archived;

    return (
      <div style={styles.page}>

        <h1>SCORESHEET</h1>

        <h2>{selectedEvent?.name}{locked ? " 🔒" : ""}</h2>
        <h3>{selectedRound}</h3>
        <h3>{selectedJudge}</h3>

        {locked && (
          <h3 style={{ color: "red" }}>
            {selectedEvent?.archived ? "EVENT ARCHIVED" : "EVENT LOCKED"} — no edits allowed
          </h3>
        )}

        <input
          style={styles.input}
          placeholder="Car No OR Rego"
          value={score.car}
          disabled={locked}
          onChange={(e) =>
            setScore({
              ...score,
              car: e.target.value
            })
          }
        />

        <input
          style={styles.input}
          placeholder="Driver Name (Optional)"
          value={score.driver}
          disabled={locked}
          onChange={(e) =>
            setScore({
              ...score,
              driver: e.target.value
            })
          }
        />

        <div style={styles.row}>
          {["Male", "Female"].map((g) => (
            <button
              key={g}
              disabled={locked}
              style={{
                ...styles.scoreButton,
                ...(score.gender === g
                  ? styles.active
                  : {})
              }}
              onClick={() =>
                setScore({
                  ...score,
                  gender: g
                })
              }
            >
              {g}
            </button>
          ))}
        </div>

        <div style={styles.row}>
          {[
            "V8 Pro",
            "V8 N/A",
            "6 Cyl Pro",
            "6 Cyl N/A",
            "4 Cyl Open/Rotary"
          ].map((c) => (
            <button
              key={c}
              disabled={locked}
              style={{
                ...styles.scoreButton,
                ...(score.carClass === c
                  ? styles.active
                  : {})
              }}
              onClick={() =>
                setScore({
                  ...score,
                  carClass: c
                })
              }
            >
              {c}
            </button>
          ))}
        </div>

        {[
          ["instant", "Instant Smoke"],
          ["volume", "Volume of Smoke"],
          ["constant", "Constant Smoke"],
          ["skill", "Driver Skill"]
        ].map(([field, title]) => (
          <div key={field}>
            <div style={{ marginTop: 10 }}>
              {title}
            </div>

            <div style={styles.row}>
              {[...Array(20)].map((_, i) => {
                const val = i + 1;

                return (
                  <button
                    key={val}
                    disabled={locked}
                    style={{
                      ...styles.scoreButton,
                      ...(score[field] === val
                        ? styles.active
                        : {})
                    }}
                    onClick={() =>
                      setScoreValue(field, val)
                    }
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <h3>Blown Tyres</h3>

        <div style={styles.row}>
          {["Left", "Right"].map((t) => (
            <button
              key={t}
              disabled={locked}
              style={{
                ...styles.scoreButton,
                ...(score.tyres.includes(t)
                  ? styles.active
                  : {})
              }}
              onClick={() => toggleTyre(t)}
            >
              {t} +5
            </button>
          ))}
        </div>

        <h3>Deductions</h3>

        <div style={styles.row}>
          {[
            "Reversing",
            "Stopping",
            "Barrier",
            "Fire"
          ].map((d) => (
            <button
              key={d}
              disabled={locked}
              style={{
                ...styles.scoreButton,
                ...(score.deductions.includes(d)
                  ? styles.active
                  : {})
              }}
              onClick={() => toggleDeduction(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <h2>Total: {score.total}</h2>

        <button
          style={styles.button}
          onClick={submitScore}
          disabled={locked}
        >
          Submit Score
        </button>

        <button style={styles.button} onClick={() => setScreen("home")}>
          Home
        </button>

      </div>
    );
  }

  if (screen === "leaderboard") {
    return (
      <div style={styles.page}>
        <h1>Leaderboard — {selectedRound}</h1>
        {renderResults(leaderboard)}
        {leaderboardFooter}
      </div>
    );
  }

 if (screen === "female") {
  return (
    <div style={styles.page}>

      <h1>Female Overall</h1>

      {renderResults(female)}

      <button
        style={styles.button}
        onClick={() => window.print()}
      >
        Print
      </button>

      <button
        style={styles.button}
        onClick={() => setScreen("home")}
      >
        Home
      </button>

    </div>
  );
}

if (screen === "class") {
  return (
    <div style={styles.page}>

      <h1>Class Leaderboard</h1>

      {Object.keys(byClass).map((cls) => (
        <div key={cls}>
          <h2>{cls}</h2>
          {renderResults(byClass[cls])}
        </div>
      ))}

      <button
        style={styles.button}
        onClick={() => window.print()}
      >
        Print
      </button>

      <button
        style={styles.button}
        onClick={() => setScreen("home")}
      >
        Home
      </button>

    </div>
  );
}

if (screen === "top150") {
  return (
    <div style={styles.page}>

      <h1>Top 150</h1>

      {renderResults(
        leaderboard.slice(0, 150)
      )}

      <button
        style={styles.button}
        onClick={() => window.print()}
      >
        Print
      </button>

      <button
        style={styles.button}
        onClick={() => setScreen("home")}
      >
        Home
      </button>

    </div>
  );
}

 if (screen === "top30") {
  return (
    <div style={styles.page}>

      <h1>Top 30 Finals</h1>

      {renderResults(
        leaderboard.slice(0, 30)
      )}

      <button
        style={styles.button}
        onClick={() => window.print()}
      >
        Print
      </button>

      <button
        style={styles.button}
        onClick={() => setScreen("home")}
      >
        Home
      </button>

    </div>
  );
}

  return null;
}
