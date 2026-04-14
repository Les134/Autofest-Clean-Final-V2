import React, { useState } from "react";

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

const deductionsList = ["Reversing", "Stopping", "Barrier", "Fire"];

export default function App() {
  const [screen, setScreen] = useState("home");

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");

  const [scores, setScores] = useState({});
  const [deductions, setDeductions] = useState({});
  const [tyres, setTyres] = useState({ left: false, right: false });

  const [saving, setSaving] = useState(false);

  const submit = () => {
    if (saving) return;

    if (!car && !gender && !carClass) {
      alert("Enter car / gender / class");
      return;
    }

    setSaving(true);

    const base = Object.values(scores).reduce((a, b) => a + b, 0);
    const tyreScore = (tyres.left ? 5 : 0) + (tyres.right ? 5 : 0);
    const deductionTotal =
      Object.values(deductions).filter((v) => v).length * 10;

    const finalScore = base + tyreScore - deductionTotal;

    console.log("Saved Score:", {
      car,
      gender,
      carClass,
      finalScore
    });

    // RESET CLEAN
    setScores({});
    setDeductions({});
    setTyres({ left: false, right: false });
    setCar("");
    setGender("");
    setCarClass("");

    setSaving(false);

    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
  };

  const row = { marginBottom: 30 };
  const btn = {
    padding: 14,
    margin: 6,
    borderRadius: 6,
    border: "1px solid #ccc"
  };

  const active = {
    ...btn,
    background: "red",
    color: "#fff"
  };

  const classActive = {
    ...btn,
    background: "green",
    color: "#fff"
  };

  const big = {
    padding: 18,
    margin: 10,
    width: "100%",
    fontSize: 18
  };

  if (screen === "home") {
    return (
      <div style={{ padding: 20 }}>
        <h1>AutoFest Scoring</h1>

        <button style={big} onClick={() => setScreen("score")}>
          Start Judging
        </button>
      </div>
    );
  }

  if (screen === "score") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Score Entry</h2>

        <input
          value={car}
          onChange={(e) => setCar(e.target.value)}
          placeholder="Entrant No"
          style={{ padding: 10, width: "100%", marginBottom: 20 }}
        />

        {/* GENDER */}
        <div style={row}>
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
        <div style={row}>
          {classes.map((c) => (
            <button
              key={c}
              style={carClass === c ? classActive : btn}
              onClick={() => setCarClass(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* SCORES */}
        {categories.map((cat) => (
          <div key={cat} style={row}>
            <strong>{cat}</strong>
            <br />
            {Array.from({ length: 21 }, (_, i) => (
              <button
                key={i}
                style={scores[cat] === i ? active : btn}
                onClick={() =>
                  setScores({
                    ...scores,
                    [cat]: i
                  })
                }
              >
                {i}
              </button>
            ))}
          </div>
        ))}

        {/* TYRES */}
        <div style={row}>
          <strong>Blown Tyres (+5)</strong>
          <br />
          <button
            style={tyres.left ? active : btn}
            onClick={() =>
              setTyres({ ...tyres, left: !tyres.left })
            }
          >
            Left
          </button>
          <button
            style={tyres.right ? active : btn}
            onClick={() =>
              setTyres({ ...tyres, right: !tyres.right })
            }
          >
            Right
          </button>
        </div>

        {/* DEDUCTIONS */}
        <div style={row}>
          <strong>Deductions (-10)</strong>
          <br />
          {deductionsList.map((d) => (
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

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit & Next"}
        </button>

        <button style={big} onClick={() => setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
