import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// SCORE ROWS
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Drivers Skill & Control"
];

// CLASSES
const classes = [
  "V8 Pro",
  "V8 N/A",
  "6Cyl Pro",
  "6Cyl N/A",
  "4Cyl / Rotary"
];

// DEDUCTIONS
const deductionsList = ["Barrier","Reversing","Fail Off Pad","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");
  const [judge,setJudge] = useState("");

  const [data,setData] = useState([]);

  const [driver,setDriver] = useState("");
  const [carNumber,setCarNumber] = useState("");
  const [carRego,setCarRego] = useState("");

  const [carClass,setCarClass] = useState("");
  const [gender,setGender] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({one:false,two:false});

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"), snap=>{
      setData(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  const entryValid =
    (carNumber.trim() !== "" || carRego.trim() !== "") &&
    carClass !== "" &&
    gender !== "";

  function setScore(cat,val){
    if(!entryValid) return;
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev=>({...prev,[d]:!prev[d]}));
  }

  function total(){
    let t = Object.values(scores).reduce((a,b)=>a+b,0);

    Object.values(deductions).forEach(v=>{
      if(v) t -= 10;
    });

    if(tyres.one) t += 5;
    if(tyres.two) t += 5;

    return t;
  }

  function submit(){

    if(!entryValid){
      alert("Complete all required fields");
      return;
    }

    const activeDeductions = Object.keys(deductions).filter(d=>deductions[d]);

    addDoc(collection(db,"scores"),{
      driver,
      carNumber,
      carRego,
      carClass,
      gender,
      total: total(),
      deductions: activeDeductions,
      judge
    });

    setScores({});
    setDeductions({});
    setTyres({one:false,two:false});
    setDriver("");
    setCarNumber("");
    setCarRego("");
    setCarClass("");
    setGender("");
  }

  function combine(){
    const map={};

    data.forEach(e=>{
      const key = (e.carNumber || e.carRego) + "_" + e.driver;

      if(!map[key]){
        map[key]={...e,total:0,deductions:[]};
      }

      map[key].total += e.total;

      if(e.deductions){
        map[key].deductions.push(...e.deductions);
      }
    });

    return Object.values(map).sort((a,b)=>b.total-a.total);
  }

  const combined = combine();

  function format(e){
    const name = `${e.driver} / Car Number: ${e.carNumber || e.carRego}`;
    const ded = e.deductions?.length
      ? ` (${[...new Set(e.deductions)].join(", ")})`
      : "";

    return `${name} - Score: ${e.total}${ded} [${e.carClass} - ${e.gender}]`;
  }

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={homeWrap}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("event")}>New Event</button>
        <button style={menuBtn} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Resume Scoring</button>

        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
        <button style={menuBtn}>Event Archive</button>

        <button style={menuBtn}>Set Admin</button>
        <button style={menuBtn}>Admin Login</button>
      </div>
    );
  }

  // ---------------- JUDGE LOGIN ----------------

  if(screen==="judge"){
    return (
      <div style={homeWrap}>
        <h2>Select Judge</h2>

        {[1,2,3,4,5,6].map(j=>(
          <button key={j} style={menuBtn}
            onClick={()=>{setJudge("Judge "+j); setScreen("score");}}>
            Judge {j}
          </button>
        ))}

        <button style={menuBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- LEADERBOARD ----------------

  if(screen==="leaderboard"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {combined.map((e,i)=>(
          <div key={i}>
            #{i+1} {format(e)}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- SCORE ----------------

  return (
    <div style={scoreWrap}>

      <h2>{judge}</h2>

      <input style={input} placeholder="Driver Name" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input style={input} placeholder="Car Number" value={carNumber} onChange={e=>setCarNumber(e.target.value)} />
      <input style={input} placeholder="Car Rego / Number" value={carRego} onChange={e=>setCarRego(e.target.value)} />

      {/* CLASS */}
      <div>
        <strong>Class</strong><br/>
        {classes.map(c=>(
          <button key={c}
            onClick={()=>setCarClass(c)}
            style={carClass===c?activeBtn:btn}>
            {c}
          </button>
        ))}
      </div>

      {/* GENDER */}
      <div>
        <strong>Gender</strong><br/>
        <button onClick={()=>setGender("Male")} style={gender==="Male"?activeBtn:btn}>Male</button>
        <button onClick={()=>setGender("Female")} style={gender==="Female"?activeBtn:btn}>Female</button>
      </div>

      {!entryValid && <div style={{color:"orange"}}>Complete all required fields</div>}

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i}
              disabled={!entryValid}
              onClick={()=>setScore(cat,i)}
              style={scores[cat]===i?activeBtn:btn}>
              {i}
            </button>
          ))}
        </div>
      ))}

      <button onClick={submit}>Submit</button>
      <button onClick={()=>setScreen("home")}>Home</button>

    </div>
  );
}

// STYLES (UNCHANGED)
const homeWrap = {background:"#fff",height:"100vh",padding:20,textAlign:"center"};
const menuBtn = {width:"90%",padding:18,margin:"8px auto",display:"block",fontSize:18};

const scoreWrap = {background:"#111",color:"#fff",padding:20};
const input = {width:"95%",padding:14,margin:5};

const btn = {padding:12,margin:3};
const activeBtn = {...btn,background:"red",color:"#fff"};
