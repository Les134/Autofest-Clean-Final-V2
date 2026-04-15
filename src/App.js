import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

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
  const [eventLocked,setEventLocked] = useState(false);

  const [syncStatus,setSyncStatus] = useState("🟢 Synced");

  const [eventName,setEventName] = useState("");
  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"), snap=>{
      setEntries(snap.docs.map(doc=>doc.data()) || []);
      setSyncStatus("🟢 Synced");
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const fetchLock = async ()=>{
      const snap = await getDoc(doc(db,"settings","event"));
      if(snap.exists()) setEventLocked(snap.data().locked);
    };
    fetchLock();
  },[]);

  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add judge");

    setJudges(valid);
    setScreen("judge");
  };

  const submit = async ()=>{
    if(eventLocked) return alert("Event is LOCKED");

    if(!car || !gender || !carClass){
      return alert("Complete all fields");
    }

    if(Object.keys(scores).length !== categories.length){
      return alert("Score all categories");
    }

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const activeDeductions = Object.keys(deductions).filter(d=>deductions[d]);
    const finalScore = base + tyreScore - (activeDeductions.length*10);

    setSyncStatus("🟡 Saving...");

    try{
      await addDoc(collection(db,"scores"),{
        car,
        gender,
        carClass,
        finalScore,
        deductions: activeDeductions,
        judge: activeJudge,
        created: new Date().toISOString()
      });

      setSyncStatus("🟢 Synced");

    }catch{
      setSyncStatus("🔴 Offline - Will Sync");
    }

    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setGender("");
    setCarClass("");
  };

  const lockEvent = async ()=>{
    await setDoc(doc(db,"settings","event"),{locked:true});
    setEventLocked(true);
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore-a.finalScore);
  const top30 = sorted.slice(0,30);

  const big={padding:18,margin:10,width:"100%",fontSize:18};

  const renderList = (list)=>(
    (list||[]).map((e,i)=>(
      <div key={i}>
        #{i+1} | Car {e.car} | {e.gender}
        {e.deductions?.length>0 && (
          <> | Less Deduction {e.deductions.join(", ")}</>
        )}
        {" "} - Score {e.finalScore}
      </div>
    ))
  );

  // HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🏁 AUTOFEST SERIES</h1>

        <div>{syncStatus}</div>

        <button style={big} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={big} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={big} onClick={()=>setScreen("score")}>Resume Judging</button>
        <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={big} onClick={()=>setScreen("classes")}>Class Leaderboards</button>
        <button style={big} onClick={()=>setScreen("top30")}>Top 30 Shootout</button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leader"){
    return(
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {renderList(sorted)}

        <button onClick={lockEvent}>🔒 Lock</button>
        <button onClick={()=>window.print()}>🖨 Print</button>

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // TOP 30
  if(screen==="top30"){
    return(
      <div style={{padding:20}}>
        <h2>Top 30 Shootout</h2>
        {renderList(top30)}
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
