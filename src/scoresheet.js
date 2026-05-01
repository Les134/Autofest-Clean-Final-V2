import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ScoreSheet({ eventName, judgeName, eventLocked }) {
  const [car, setCar] = useState("");
  const [classType, setClassType] = useState("");
  const [gender, setGender] = useState("");

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

  const [total, setTotal] = useState(0);

  useEffect(() => {
    const base = scores.burnout + scores.showmanship + scores.crowd;
    const ded = Object.values(deductions).filter(Boolean).length * 10;
    setTotal(base - ded);
  }, [scores, deductions]);

  const btn = {
    padding: 12,
    margin: 4,
    minWidth: 50
  };

  const active = {
    ...btn,
    background: "red",
    color: "#fff"
  };

  const submit = async () => {
    if (eventLocked) return alert("Locked");
    if (!car || !classType || !gender) return alert("Fill all fields");

    await addDoc(collection(db, "scores"), {
      eventName,
      judgeName,
      car,
      classType,
      gender,
      total,
      scores,
      deductions
    });

    alert("Saved");
  };

  return (
    <div>

      <input
        style={{ fontSize: 28, width: "100%", padding: 10 }}
        placeholder="CAR NO / REGO"
        value={car}
        onChange={(e) => setCar(e.target.value.toUpperCase())}
      />

      <h3>GENDER</h3>
      <button style={gender==="Male"?active:btn} onClick={()=>setGender("Male")}>Male</button>
      <button style={gender==="Female"?active:btn} onClick={()=>setGender("Female")}>Female</button>

      <h3>CLASS</h3>
      <button style={classType==="Pro"?active:btn} onClick={()=>setClassType("Pro")}>PRO</button>
      <button style={classType==="Street"?active:btn} onClick={()=>setClassType("Street")}>STREET</button>

      <h3>BURNOUT</h3>
      {[...Array(21).keys()].map(n=>(
        <button key={n} style={scores.burnout===n?active:btn}
          onClick={()=>setScores({...scores, burnout:n})}>{n}</button>
      ))}

      <h3>SHOWMANSHIP</h3>
      {[...Array(21).keys()].map(n=>(
        <button key={n} style={scores.showmanship===n?active:btn}
          onClick={()=>setScores({...scores, showmanship:n})}>{n}</button>
      ))}

      <h3>CROWD</h3>
      {[...Array(21).keys()].map(n=>(
        <button key={n} style={scores.crowd===n?active:btn}
          onClick={()=>setScores({...scores, crowd:n})}>{n}</button>
      ))}

      <h3>DEDUCTIONS (-10)</h3>
      {Object.keys(deductions).map(d=>(
        <button key={d} style={deductions[d]?active:btn}
          onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
          {d}
        </button>
      ))}

      <h2>TOTAL: {total}</h2>

      <button style={{padding:20,fontSize:20}} onClick={submit}>
        SUBMIT SCORE
      </button>

    </div>
  );
}
