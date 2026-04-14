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
  "Driver Skill & Control"
];

const classes = [
  "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4Cyl Open/Rotary"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");
  const [entries,setEntries] = useState([]);
  const [saving,setSaving] = useState(false);

  const [eventName,setEventName] = useState("");
  const [eventActive,setEventActive] = useState(false);

  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");

  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [rego,setRego] = useState("");
  const [carName,setCarName] = useState("");

  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  // 🔥 ONLY CURRENT EVENT DATA
  useEffect(()=>{
    if(!eventName) return;

    const unsub = onSnapshot(collection(db,"scores"),(snap)=>{
      const data = snap.docs.map(doc=>doc.data())
        .filter(e => e.eventName === eventName);
      setEntries(data);
    });

    return ()=>unsub();
  },[eventName]);

  const setScore = (cat,val)=> setScores({...scores,[cat]:val});
  const toggleDeduction = (d)=> setDeductions({...deductions,[d]:!deductions[d]});
  const toggleTyre = (t)=> setTyres({...tyres,[t]:!tyres[t]});

  const startEvent = ()=>{
    const validJudges = judges.filter(j=>j.trim() !== "");

    if(!eventName) return alert("Enter event name");
    if(validJudges.length < 1) return alert("Add at least 1 judge");

    setJudges(validJudges);
    setEventActive(true);
    setScreen("judgeSelect");
  };

  const submit = async ()=>{
    if(saving) return;
    setSaving(true);

    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;
    const baseScore = Object.values(scores).reduce((a,b)=>a+b,0);

    const finalScore = baseScore + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      eventName,
      judge: activeJudge,
      car, driver, rego, carName,
      gender, carClass,
      finalScore,
      time: Date.now()
    });

    // RESET ENTRY ONLY (NOT SESSION)
    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar(""); setDriver(""); setRego(""); setCarName("");
    setGender(""); setCarClass("");

    setSaving(false);
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore - a.finalScore);

  const bigBtn = {padding:18,margin:10,width:"100%",fontSize:18};

  // 🏠 HOME
  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>AutoFest</h1>

        {!eventActive && (
          <button style={bigBtn} onClick={()=>setScreen("setup")}>
            Start New Event
          </button>
        )}

        {eventActive && (
          <>
            <button style={bigBtn} onClick={()=>setScreen("judgeSelect")}>
              Resume Judging
            </button>

            <button style={bigBtn} onClick={()=>setScreen("leader")}>
              View Leaderboard
            </button>
          </>
        )}
      </div>
    );
  }

  // SETUP
  if(screen==="setup"){
    return (
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name" value={eventName} onChange={e=>setEventName(e.target.value)} />

        {judges.map((j,i)=>(
          <input key={i} placeholder={`Judge ${i+1}`} value={j}
            onChange={e=>{
              const newJ=[...judges];
              newJ[i]=e.target.value;
              setJudges(newJ);
            }}
          />
        ))}

        <button style={bigBtn} onClick={startEvent}>Start Event</button>
      </div>
    );
  }

  // SELECT JUDGE
  if(screen==="judgeSelect"){
    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i} style={bigBtn} onClick={()=>{setActiveJudge(j);setScreen("score")}}>
            {j}
          </button>
        ))}

        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leader"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {sorted.length === 0 && <p>No scores yet</p>}

        {sorted.map((e,i)=>(
          <div key={i}>
            #{i+1} | Car {e.car} | {e.carClass} | {e.gender} | {e.finalScore}
          </div>
        ))}

        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORING
  return (
    <div style={{padding:20}}>

      <h3>{eventName} | {activeJudge}</h3>

      <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
      <input placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input placeholder="Rego" value={rego} onChange={e=>setRego(e.target.value)} />
      <input placeholder="Car Name" value={carName} onChange={e=>setCarName(e.target.value)} />

      <div>
        <button onClick={()=>setGender("Male")}>Male</button>
        <button onClick={()=>setGender("Female")}>Female</button>
      </div>

      <div>
        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
        ))}
      </div>

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      <button style={bigBtn} onClick={submit}>
        {saving ? "Saving..." : "Submit & Next"}
      </button>

      <button style={bigBtn} onClick={()=>setScreen("home")}>
        Home
      </button>

    </div>
  );
}
