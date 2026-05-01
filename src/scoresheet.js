import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export default function ScoreSheet({ eventName, judgeName, eventLocked }) {
  const [carName, setCarName] = useState("");
  const [carClass, setCarClass] = useState("");
  const [gender, setGender] = useState("");
  const [total, setTotal] = useState(0);

  const [scores, setScores] = useState({
    burnout: 0,
    showmanship: 0,
    crowd: 0
  });

  const [deductions, setDeductions] = useState({
    reversing: false,
    stopping: false,
    barrier: false,
    fire: false
  });

  useEffect(() => {
    const base = scores.burnout + scores.showmanship + scores.crowd;
    const deduction = Object.values(deductions).filter(Boolean).length * 10;
    setTotal(base - deduction);
  }, [scores, deductions]);

  const handleSubmit = async () => {
    if (eventLocked) return alert("Event locked");
    if (!carName || !gender || !carClass) return alert("Fill all fields");

    const q = query(
      collection(db, "scores"),
      where("carName", "==", carName),
      where("judgeName", "==", judgeName)
    );

    const existing = await getDocs(q);
    if (!existing.empty) return alert("Already scored");

    await addDoc(collection(db, "scores"), {
      eventName,
      judgeName,
      carName,
      carClass,
      gender,
      total,
      scores,
      deductions
    });

    alert("Score Submitted");
  };

  const btn = { padding: 8, margin: 4 };

  return (
    <div>

      <input
        style={{ fontSize: 24, width: "100%" }}
        placeholder="Car No / Rego"
        value={carName}
        onChange={(e) => setCarName(e.target.value)}
      />

      <div>
        <button style={btn} onClick={() => setGender("Male")}>Male</button>
        <button style={btn} onClick={() => setGender("Female")}>Female</button>
      </div>

      <div>
        <button style={btn} onClick={() => setCarClass("Pro")}>Pro</button>
        <button style={btn} onClick={() => setCarClass("Street")}>Street</button>
      </div>

      {["burnout","showmanship","crowd"].map(cat => (
        <div key={cat}>
          <h4>{cat}</h4>
          {[...Array(21).keys()].map(n => (
            <button key={n} style={btn}
              onClick={() => setScores({...scores, [cat]: n})}>
              {n}
            </button>
          ))}
        </div>
      ))}

      <div>
        <h4>Deductions (-10)</h4>
        {Object.keys(deductions).map(d => (
          <button key={d} style={btn}
            onClick={() => setDeductions({...deductions, [d]: !deductions[d]})}>
            {d}
          </button>
        ))}
      </div>

      <h2>Total: {total}</h2>

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
