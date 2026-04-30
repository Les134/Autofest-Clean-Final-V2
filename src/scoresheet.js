// force deploy
import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
export default function ScoreSheet({ eventName, judgeName, eventLocked }) {
export default function ScoreSheet({ eventName, judgeName }) {
  const [carName, setCarName] = useState("");
  const [carClass, setCarClass] = useState("");
  const [gender, setGender] = useState("");

  const [scores, setScores] = useState({
    burnout: "",
    showmanship: "",
    crowd: ""
  });

  const [deductions, setDeductions] = useState({
    reversing: false,
    stopping: false,
    barrier: false,
    fire: false
  });

  const [total, setTotal] = useState(0);

  // TOTAL CALCULATION
  useEffect(() => {
    const base =
      (Number(scores.burnout) || 0) +
      (Number(scores.showmanship) || 0) +
      (Number(scores.crowd) || 0);

    const deductionTotal =
      Object.values(deductions).filter((d) => d).length * 10;

    const final = base - deductionTotal;

    setTotal(final);
  }, [scores, deductions]);

  const handleSubmit = async () => {
    if (!carName.trim()) return alert("Enter car number / rego");
    if (!carClass) return alert("Select class first");
    if (!gender) return alert("Select gender first");
    if (eventLocked) {
  return alert("Event is locked. No more scoring allowed.");
}
    const q = query(
      collection(db, "scores"),
      where("eventName", "==", eventName),
      where("carName", "==", carName),
      where("judgeName", "==", judgeName)
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
      return alert("You already scored this car");
    }

    await addDoc(collection(db, "scores"), {
      eventName,
      judgeName,
      carName,
      carClass,
      gender,
      total,
      scores,
      deductions,
      createdAt: new Date()
    });

    // RESET
    setCarName("");
    setCarClass("");
    setGender("");
    setScores({ burnout: "", showmanship: "", crowd: "" });
    setDeductions({
      reversing: false,
      stopping: false,
      barrier: false,
      fire: false
    });
  };

  const btn = { margin: 5, padding: 10 };
  const active = { ...btn, background: "red", color: "#fff" };

  return (
    <div style={{ marginTop: 20 }}>

      {/* CAR INPUT (BIG) */}
      <input
        style={{ fontSize: 22, padding: 10, width: "100%", marginBottom: 10 }}
        placeholder="Car No / Rego"
        value={carName}
        onChange={(e) => setCarName(e.target.value)}
      />

      {/* GENDER */}
      <div>
        <strong>Select Gender</strong><br />
        <button
          style={gender === "Male" ? active : btn}
          onClick={() => setGender("Male")}
        >
          Male
        </button>
        <button
          style={gender === "Female" ? active : btn}
          onClick={() => setGender("Female")}
        >
          Female
        </button>
      </div>

      {/* CLASS */}
      <div>
        <strong>Select Class</strong><br />
        {["Pro", "Street"].map((c) => (
          <button
            key={c}
            style={carClass === c ? active : btn}
            onClick={() => setCarClass(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* BLOCK SCORING UNTIL READY */}
      {!gender || !carClass ? (
        <p style={{ color: "red" }}>
          Select Gender and Class before scoring
        </p>
      ) : (
        <>
          {/* SCORES */}
          {["burnout", "showmanship", "crowd"].map((cat) => (
            <div key={cat}>
              <strong>{cat}</strong><br />
              {Array.from({ length: 21 }, (_, i) => (
                <button
                  key={i}
                  style={scores[cat] === i ? active : btn}
                  onClick={() =>
                    setScores({ ...scores, [cat]: i })
                  }
                >
                  {i}
                </button>
              ))}
            </div>
          ))}

          {/* DEDUCTIONS */}
          <div>
            <strong>Deductions (-10 each)</strong><br />
            {Object.keys(deductions).map((d) => (
              <button
                key={d}
                style={deductions[d] ? active : btn}
                onClick={() =>
                  setDeductions({
                    ...deductions,
                    [d]: !deductions[d]
                  })
                }
              >
                {d}
              </button>
            ))}
          </div>

          <h3>Total: {total}</h3>

          <button onClick={handleSubmit}>Submit Score</button>
        </>
      )}
    </div>
  );
}

