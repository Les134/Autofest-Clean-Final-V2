import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Drivers Skill & Control"
];

const classes = [
  "V8 Pro","V8 N/A","6Cyl Pro","6Cyl N/A","4Cyl / Rotary"
];

const deductionsList = [
  "Barrier",
  "Reversing",
  "Fail Off Pad",
  "Fire"
];

export default function App(){

  const [screen,setScreen] = useState("home");
  const [judge,setJudge] = useState("");
  const [data,setData] = useState([]);

  const [carNumber,setCarNumber] = useState("");
  const [carRego,setCarRego] = useState("");
  const [driver,setDriver] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({one:false,two:false});

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"), snap=>{
      setData(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  const entryValid = carNumber.trim() !== "" || carRego.trim() !== "";

  function setScore(cat,val){
    if(!entryValid) return;
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev=>({...prev,[d]:!prev[d]}));
  }

  function total(){
    let t = Object.values(scores).reduce((a,b)=>a+b,0);

    Object.entries(deductions).forEach(([k,v])=>{
      if(v) t -= 10;
    });

    if(tyres.one) t += 5;
    if(tyres.two) t += 5;

    return t;
  }

  function submit(){

    if(!entryValid) return alert("Enter Car Number or Rego");

    const activeDeductions = Object.keys(deductions).filter(d => deductions[d]);

    addDoc(collection(db,"scores"),{
      carNumber,
      carRego,
      driver,
      carClass,
      total: total(),
      deductions: activeDeductions,
      judge
    });

    setScores({});
    setDeductions({});
    setTyres({one:false,two:false});
    setCarNumber("");
    setCarRego("");
    setDriver("");
  }

  function combine(){

    const map = {};

    data.forEach(e=>{
      const key = (e.carNumber || e.carRego) + "_" + e.driver;

      if(!map[key]){
        map[key] = {
          ...e,
          total: 0,
          deductions: []
        };
      }

      map[key].total += e.total;

      if(e.deductions){
        map[key].deductions.push(...e.deductions);
      }
    });

    return Object.values(map).sort((a,b)=>b.total-a.total);
  }

  function formatEntry(e){

    const name = `${e.driver} / ${e.carNumber || e.carRego}`;
    const ded = e.deductions && e.deductions.length > 0
      ? ` (${[...new Set(e.deductions)].join(", ")})`
      : "";

    return `${name} - ${e.total}${ded}`;
  }

  const combined = combine();

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>AutoFest</h1>

        <button onClick={()=>setScreen("judge")}>Judge Login</button>
        <button onClick={()=>setScreen("score")}>Score Sheet</button>
        <button onClick={()=>setScreen("board")}>Leaderboard</button>
      </div>
    );
  }

  // ---------------- LEADERBOARD ----------------

  if(screen==="board"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {combined.map((e,i)=>(
          <div key={i}>
            #{i+1} {formatEntry(e)}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- SCORE ----------------

  return (
    <div style={{padding:20}}>

      <h2>{judge}</h2>

      <input placeholder="Driver Name" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input placeholder="Car Number" value={carNumber} onChange={e=>setCarNumber(e.target.value)} />
      <input placeholder="Car Rego / Number" value={carRego} onChange={e=>setCarRego(e.target.value)} />

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      <h3>Deductions</h3>
      {deductionsList.map(d=>(
        <button key={d} onClick={()=>toggleDeduction(d)}>
          {d}
        </button>
      ))}

      <button onClick={submit}>Submit</button>
    </div>
  );
}
