import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";

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

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");

  const [events,setEvents] = useState([]);
  const [entries,setEntries] = useState([]);

  const [car,setCar] = useState("");
  const [name,setName] = useState("");
  const [rego,setRego] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  const [saving,setSaving] = useState(false);
  const [isAdmin,setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db,"events"), snap=>{
      setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
    });

    const unsubScores = onSnapshot(collection(db,"scores"), snap=>{
      setEntries(snap.docs.map(d=>d.data()));
    });

    return ()=>{unsubEvents();unsubScores();};
  },[]);

  const startEvent = async ()=>{
    const valid = judges.filter(j=>j.trim() !== "");

    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add at least 1 judge");

    setJudges(valid);

    await addDoc(collection(db,"events"),{
      name:eventName,
      judges:valid,
      createdAt:new Date()
    });

    setScreen("judge");
  };

  const submit = async ()=>{
    if(saving) return;
    if(!car && !name && !rego) return alert("Enter Car #, Name or Rego");

    setSaving(true);

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const activeDeductions = Object.keys(deductions).filter(d=>deductions[d]);
    const deductionTotal = activeDeductions.length*10;

    const total = base + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      eventName,
      car,
      name,
      rego,
      gender,
      carClass,
      judge:activeJudge,
      total,
      deductions:activeDeductions,
      createdAt:new Date()
    });

    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar(""); setName(""); setRego("");
    setGender(""); setCarClass("");

    setSaving(false);
  };

  const big={padding:18,margin:10,width:"100%"};
  const btn={padding:10,margin:5};
  const active={...btn,background:"red",color:"#fff"};
  const classActive={...btn,background:"green",color:"#fff"};

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={big} onClick={()=>setScreen("setup")}>Start Event</button>
        <button style={big} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
      </div>
    );
  }

  // ================= SETUP =================
  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
        />

        {judges.map((j,i)=>(
          <input key={i}
            placeholder={`Judge ${i+1}`}
            value={judges[i]}
            onChange={(e)=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button style={big} onClick={startEvent}>Start Event</button>
        <button style={big} onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= JUDGE =================
  if(screen==="judge"){
    return(
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i} style={big}
            onClick={()=>{setActiveJudge(j);setScreen("score")}}>
            {j}
          </button>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= SCORE =================
  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input placeholder="Car #" value={car} onChange={(e)=>setCar(e.target.value)} />
        <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input placeholder="Rego" value={rego} onChange={(e)=>setRego(e.target.value)} />

        <div>
          <button style={gender==="Male"?active:btn} onClick={()=>setGender("Male")}>Male</button>
          <button style={gender==="Female"?active:btn} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c?classActive:btn}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <strong>{cat}</strong><br/>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                style={scores[cat]===i?active:btn}
                onClick={()=>setScores({...scores,[cat]:i})}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit & Next"}
        </button>

        <button style={big} onClick={()=>setScreen("judge")}>Next Judge</button>
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= LEADER =================
  if(screen==="leader"){
    return(
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {entries.map((e,i)=>(
          <div key={i}>
            {e.car} | {e.carClass} | {e.total}
          </div>
        ))}
        <button style={big} onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}

