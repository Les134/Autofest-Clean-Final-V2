import React, { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export default function Scoreboard({ eventName }) {

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [scores, setScores] = useState({});
  const [deductions, setDeductions] = useState({});

  const categories = ["Smoke","Volume","Constant","Skill"];

  const setScore = (cat, val) => {
    setScores(prev => ({ ...prev, [cat]: val }));
  };

  const toggleDeduction = (d) => {
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  };

  const calcTotal = () => {
    let t = 0;

    Object.keys(scores).forEach(k => {
      if(k === "blown") t += scores[k]*5;
      else t += scores[k];
    });

    Object.keys(deductions).forEach(d => {
      if(deductions[d]) t -= 10;
    });

    return t;
  };

  const submit = async () => {

    if(Object.keys(scores).length < categories.length){
      alert("Complete scoring");
      return;
    }

    const total = calcTotal();

    await addDoc(collection(db, "results"), {
      name,
      number,
      total,
      event: eventName,
      created: new Date()
    });

    alert("Saved to leaderboard");

    // CLEAR
    setName("");
    setNumber("");
    setScores({});
    setDeductions({});
  };

  return (
    <div>

      <h2>Scoring</h2>

      <input placeholder="Driver Name" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Entrant Number" value={number} onChange={e=>setNumber(e.target.value)} />

      {categories.map(cat => (
        <div key={cat}>
          <h4>{cat}</h4>
          {[...Array(21).keys()].map(i => (
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      <h4>Blown Tyres</h4>
      <button onClick={()=>setScore("blown",1)}>1</button>
      <button onClick={()=>setScore("blown",2)}>2</button>

      <h4>Deductions</h4>
      <button onClick={()=>toggleDeduction("Barrier")}>Barrier</button>
      <button onClick={()=>toggleDeduction("Fire")}>Fire</button>

      <h3>Total: {calcTotal()}</h3>

      <button onClick={submit}>Submit</button>

    </div>
  );
}
