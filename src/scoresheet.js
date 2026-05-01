import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export default function ScoreSheet({ eventName, judgeName, eventLocked }) {
  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [classType, setClassType] = useState("");

  const [scores, setScores] = useState({
    instant: 0,
    volume: 0,
    constant: 0,
    skill: 0
  });

  const [blownTyres, setBlownTyres] = useState({
    left: false,
    right: false
  });

  const [deductions, setDeductions] = useState({
    reversing: false,
    stopping: false,
    barrier: false,
    fire: false
  });

  const [total, setTotal] = useState(0);

  useEffect(() => {
    let base =
      scores.instant +
      scores.volume +
      scores.constant +
      scores.skill;

    let tyreBonus =
      (blownTyres.left ? 5 : 0) +
      (blownTyres.right ? 5 : 0);

    let deduction =
      Object.values(deductions).filter(Boolean).length * 10;

    setTotal(base + tyreBonus - deduction);
  }, [scores, blownTyres, deductions]);

  const handleSubmit = async () => {
    if (eventLocked) return alert("Event locked");

    if (!car || !gender || !classType)
      return alert("Fill all fields");

    const q = query(
      collection(db, "scores"),
      where("eventName", "==", eventName),
      where("car", "==", car),
      where("judgeName", "==", judgeName)
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
      return alert("Already scored this car");
    }

    await addDoc(collection(db, "scores"), {
      eventName,
      judgeName,
      car,
      gender,
      classType,
      scores,
      blownTyres,
      deductions,
      total,
      createdAt: new Date()
    });

    // RESET FORM
    setCar("");
    setGender("");
    setClassType("");
    setScores({
      instant: 0,
      volume: 0,
      constant: 0,
      skill: 0
    });
    setBlownTyres({ left: false, right: false });
    setDeductions({
      reversing: false,
      stopping: false,
      barrier: false,
      fire: false
    });

    alert("Saved — next car");
  };

  const btn = { margin: 3, padding: 10 };
  const active = { ...btn, background: "#333", color: "#fff" };

  const scoreRow = (label, key) => (
    <div style={{ marginBottom: 20 }}>
      <strong>{label}</strong><br />
      {Array.from({ length: 21 }, (_, i) => (
        <button
          key={i}
          style={scores[key] === i ? active : btn}
          onClick={() => setScores({ ...scores, [key]: i })}
        >
          {i}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ padding: 20 }}>

      <input
        style={{ fontSize: 20, width: "200px" }}
        placeholder="Entrant No"
        value={car}
        onChange={(e) => setCar(e.target.value.toUpperCase())}
      />

      <div>
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

      <div>
        {["V8 Pro", "V8 N/A", "6 Cyl Pro", "6 Cyl N/A", "4 Cyl / Rotary"].map((c) => (
          <button
            key={c}
            style={classType === c ? active : btn}
            onClick={() => setClassType(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {scoreRow("Instant Smoke", "instant")}
      {scoreRow("Volume of Smoke", "volume")}
      {scoreRow("Constant Smoke", "constant")}
      {scoreRow("Driver Skill & Control", "skill")}

      <div>
        <strong>Blown Tyres (+5)</strong><br />
        <button
          style={blownTyres.left ? active : btn}
          onClick={() =>
            setBlownTyres({ ...blownTyres, left: !blownTyres.left })
          }
        >
          Left
        </button>
        <button
          style={blownTyres.right ? active : btn}
          onClick={() =>
            setBlownTyres({ ...blownTyres, right: !blownTyres.right })
          }
        >
          Right
        </button>
      </div>

      <div>
        <strong>Deductions (-10)</strong><br />
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

      <h2>Total: {total}</h2>

      <button
        style={{ width: "100%", padding: 15, fontSize: 18 }}
        onClick={handleSubmit}
      >
        Submit & Next
      </button>
    </div>
  );
}
