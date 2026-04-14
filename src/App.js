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
  const [eventName,setEventName] = useState("");
  const [eventActive,setEventActive] = useState(false);

  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  const [saving,setSaving] = useState(false);

  useEffect(()=>{
    if(!eventName){
      setEntries([]);
      return;
    }

    const unsub = onSnapshot(collection(db,"scores"),(snap)=>{
      const data = snap.docs.map(d=>d.data())
        .filter(e=>e.eventName===eventName);
      setEntries(data);
    });

    return ()=>unsub();
  },[eventName]);

  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add at least 1 judge");

    setJudges(valid);
    setEventActive(true);
    setScreen("judgeSelect");
  };

  const submit = async ()=>{
    if(saving) return;
    setSaving(true);

    const baseScore = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;

    const finalScore = baseScore + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      eventName,
      judge: activeJudge,
      car,
      gender,
      carClass,
      finalScore,
      time: Date.now()
    });

    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setGender("");
    setCarClass("");

    setSaving(false);
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore-a.finalScore);

  const top150 = sorted.slice(0,150);
  const top30 = top150.slice(0,30);

  const grouped = {};
  sorted.forEach(e=>{
    const key = `${e.carClass} - ${e.gender}`;
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(e);
  });

  const big = {padding:18,margin:10,width:"100%",fontSize:18};

  // HOME
  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>AutoFest System</h1>

        <button style={big} onClick={()=>setScreen("setup")}>New Event</button>

        {eventActive && (
          <>
            <button style={big} onClick={()=>setScreen("judgeSelect")}>Judge Login</button>
            <button style={big} onClick={()=>setScreen("score")}>Resume Judging</button>
            <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
            <button style={big} onClick={()=>setScreen("classLeader")}>Leaderboard by Class</button>
            <button style={big} onClick={()=>setScreen("top150")}>Top 150</button>
            <button style={big} onClick={()=>setScreen("top30")}>Top 30 Finals</button>
          </>
        )}
      </div>
    );
  }

  // TOP 150
  if(screen==="top150"){
    return (
      <div style={{padding:20}}>
        <h2>Top 150</h2>
        {top150.map((e,i)=>(
          <div key={i}>#{i+1} | Car {e.car} | {e.finalScore}</div>
        ))}
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
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
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // CLASS LEADERBOARD
  if(screen==="classLeader"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard by Class</h2>

        {Object.keys(grouped).map(group=>(
          <div key={group}>
            <h3>{group}</h3>
            {grouped[group].map((e,i)=>(
              <div key={i}>#{i+1} | Car {e.car} | {e.finalScore}</div>
            ))}
          </div>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leader"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {sorted.map((e,i)=>(
          <div key={i}>
            #{i+1} | Car {e.car} | {e.carClass} | {e.gender} | {e.finalScore}
          </div>
        ))}

        <button style={big} onClick={()=>window.print()}>Print</button>
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCOREBOARD (same working version)
  if(screen==="score"){
    const row = {marginBottom:30};

    const scoreBtn = {padding:14,margin:6};
    const scoreActive = {padding:14,margin:6,background:"red",color:"#fff"};

    const genderBtn = {padding:14,margin:6,background:"#1976d2",color:"#fff"};
    const genderActive = {padding:14,margin:6,background:"#0d47a1",color:"#fff"};

    const classBtn = {padding:14,margin:6,background:"#00e676"};
    const classActive = {padding:14,margin:6,background:"#00c853",color:"#fff"};

    const deductionBtn = {padding:14,margin:6,background:"#555",color:"#fff"};
    const deductionActive = {padding:14,margin:6,background:"#b71c1c",color:"#fff"};

    return (
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input value={car} onChange={(e)=>setCar(e.target.value)} placeholder="Car #" />

        <div style={row}>
          <button style={gender==="Male"?genderActive:genderBtn} onClick={()=>setGender("Male")}>Male</button>
          <button style={gender==="Female"?genderActive:genderBtn} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div style={row}>
          {classes.map(c=>(
            <button key={c} style={carClass===c?classActive:classBtn} onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat} style={row}>
            <strong>{cat}</strong><br/>
            {Array.from({length:21},(_,i)=>(
              <button
                key={i}
                style={scores[cat]===i?scoreActive:scoreBtn}
                onClick={()=>setScores({...scores,[cat]:i})}
              >
                {i}
              </button>
            ))}
          </div>
        ))}

        {/* BLOWN TYRES */}
        <div style={row}>
          <strong>Blown Tyres</strong><br/>
          <button style={tyres.left?scoreActive:scoreBtn} onClick={()=>setTyres({...tyres,left:!tyres.left})}>Left</button>
          <button style={tyres.right?scoreActive:scoreBtn} onClick={()=>setTyres({...tyres,right:!tyres.right})}>Right</button>
        </div>

        {/* DEDUCTIONS */}
        <div style={row}>
          <strong>Deductions</strong><br/>
          {deductionsList.map(d=>(
            <button key={d} style={deductions[d]?deductionActive:deductionBtn} onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
              {d}
            </button>
          ))}
        </div>

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit & Next"}
        </button>

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return <div style={{padding:20}}>Loading...</div>;
}
