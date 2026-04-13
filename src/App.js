import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

// 🔥 FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CONFIG
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const classes = [
  "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4Cyl Open/Rotary"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("login");
  const [entries,setEntries] = useState([]);
  const [saving,setSaving] = useState(false);

  const [eventName,setEventName] = useState("");
  const [judge,setJudge] = useState("");

  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [rego,setRego] = useState("");
  const [carName,setCarName] = useState("");

  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  // 🔥 LIVE SYNC
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"),(snap)=>{
      setEntries(snap.docs.map(doc=>doc.data()));
    });
    return ()=>unsub();
  },[]);

  // HELPERS
  const setScore = (cat,val)=> setScores({...scores,[cat]:val});
  const toggleDeduction = (d)=> setDeductions({...deductions,[d]:!deductions[d]});
  const toggleTyre = (t)=> setTyres({...tyres,[t]:!tyres[t]});

  // SUBMIT
  const submit = async () => {

    if(saving) return;
    setSaving(true);

    if(!eventName || !judge){
      alert("Enter event + judge");
      setSaving(false);
      return;
    }

    if(!car && !driver && !rego && !carName){
      alert("Enter competitor");
      setSaving(false);
      return;
    }

    if(Object.keys(scores).length === 0){
      alert("Add scores");
      setSaving(false);
      return;
    }

    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length * 10;
    const baseScore = Object.values(scores).reduce((a,b)=>a+b,0);

    const finalScore = baseScore + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      eventName,
      judge,
      car, driver, rego, carName,
      gender, carClass,
      finalScore,
      time: Date.now()
    });

    // 🔥 CLEAN RESET
    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar(""); setDriver(""); setRego(""); setCarName("");
    setGender(""); setCarClass("");

    setSaving(false);
  };

  // SORTING
  const sorted = [...entries].sort((a,b)=>b.finalScore - a.finalScore);
  const top150 = sorted.slice(0,150);
  const top30 = sorted.slice(0,30);

  // 🎨 STYLES
  const row = {marginBottom:30};

  const scoreBtn = {padding:14,margin:6};
  const scoreActive = {padding:14,margin:6,background:"red",color:"#fff"};

  const genderBtn = {padding:14,margin:6,background:"#1976d2",color:"#fff"};
  const genderActive = {padding:14,margin:6,background:"#0d47a1",color:"#fff"};

  const classBtn = {padding:14,margin:6,background:"#ff9800"};
  const classActive = {padding:14,margin:6,background:"#e65100",color:"#fff"};

  const deductionBtn = {padding:14,margin:6,background:"#555",color:"#fff"};
  const deductionActive = {padding:14,margin:6,background:"#b71c1c",color:"#fff"};

  // LOGIN SCREEN
  if(screen==="login"){
    return (
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name" value={eventName} onChange={e=>setEventName(e.target.value)} />

        <h3>Select Judge</h3>
        {[1,2,3,4,5,6].map(j=>(
          <button key={j} onClick={()=>{setJudge("Judge "+j);setScreen("score")}}>
            Judge {j}
          </button>
        ))}
      </div>
    );
  }

  // TOP 150
  if(screen==="top150"){
    return (
      <div style={{padding:20}}>
        <h2>Top 150</h2>
        {top150.map((e,i)=>(
          <div key={i}>#{i+1} | Car {e.car} | {e.carClass} | {e.gender} | {e.finalScore}</div>
        ))}
        <button onClick={()=>setScreen("score")}>Back</button>
      </div>
    );
  }

  // TOP 30
  if(screen==="top30"){
    return (
      <div style={{padding:20}}>
        <h2>Top 30 Finals</h2>
        {top30.map((e,i)=>(
          <div key={i}>#{i+1} | Car {e.car} | {e.finalScore}</div>
        ))}
        <button onClick={()=>setScreen("score")}>Back</button>
      </div>
    );
  }

  // MAIN SCORING
  return (
    <div style={{padding:20}}>

      <h3>{eventName} | {judge}</h3>

      <input style={{width:"100%",padding:12}} placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
      <input style={{width:"100%",padding:12}} placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input style={{width:"100%",padding:12}} placeholder="Rego" value={rego} onChange={e=>setRego(e.target.value)} />
      <input style={{width:"100%",padding:12}} placeholder="Car Name" value={carName} onChange={e=>setCarName(e.target.value)} />

      {/* GENDER */}
      <div style={row}>
        <button style={gender==="Male"?genderActive:genderBtn} onClick={()=>setGender("Male")}>Male</button>
        <button style={gender==="Female"?genderActive:genderBtn} onClick={()=>setGender("Female")}>Female</button>
      </div>

      {/* CLASS */}
      <div style={row}>
        {classes.map(c=>(
          <button key={c} style={carClass===c?classActive:classBtn} onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* SCORES */}
      {categories.map(cat=>(
        <div key={cat} style={row}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i} style={scores[cat]===i?scoreActive:scoreBtn} onClick={()=>setScore(cat,i)}>
              {i}
            </button>
          ))}
        </div>
      ))}

      {/* TYRES */}
      <div style={row}>
        <strong>Blown Tyres (5 pts each)</strong><br/>
        <button style={tyres.left?scoreActive:scoreBtn} onClick={()=>toggleTyre("left")}>Left</button>
        <button style={tyres.right?scoreActive:scoreBtn} onClick={()=>toggleTyre("right")}>Right</button>
      </div>

      {/* DEDUCTIONS */}
      <div style={row}>
        <strong>Deductions</strong><br/>
        {deductionsList.map(d=>(
          <button key={d} style={deductions[d]?deductionActive:deductionBtn} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      {/* ACTIONS */}
      <button onClick={submit}>{saving ? "Saving..." : "Submit & Next"}</button>
      <button onClick={()=>setScreen("top150")}>Top 150</button>
      <button onClick={()=>setScreen("top30")}>Top 30</button>

      <hr/>

      <h2>Live Leaderboard</h2>
      {sorted.slice(0,20).map((e,i)=>(
        <div key={i}>
          #{i+1} | Car {e.car} | {e.carClass} | {e.gender} | {e.finalScore}
        </div>
      ))}

    </div>
  );
}
