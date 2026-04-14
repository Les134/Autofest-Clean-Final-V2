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
  const [archivedEvents,setArchivedEvents] = useState([]);

  const [eventName,setEventName] = useState("");
  const [eventActive,setEventActive] = useState(false);
  const [locked,setLocked] = useState(false);

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

  const [saving,setSaving] = useState(false);

  useEffect(()=>{
    if(!eventName){
      setEntries([]);
      return;
    }

    const unsub = onSnapshot(collection(db,"scores"),(snap)=>{
      const filtered = snap.docs.map(doc=>doc.data())
        .filter(e => e.eventName === eventName);
      setEntries(filtered);
    });

    return ()=>unsub();
  },[eventName]);

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"archivedEvents"),(snap)=>{
      setArchivedEvents(snap.docs.map(doc=>doc.data()));
    });
    return ()=>unsub();
  },[]);

  const setScore = (cat,val)=> setScores({...scores,[cat]:val});
  const toggleDeduction = (d)=> setDeductions({...deductions,[d]:!deductions[d]});
  const toggleTyre = (t)=> setTyres({...tyres,[t]:!tyres[t]});

  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length < 1) return alert("Add judges");

    setJudges(valid);
    setEventActive(true);
    setLocked(false);
    setScreen("judgeSelect");
  };

  const submit = async ()=>{
    if(locked) return alert("Event Locked 🔒");
    if(saving) return;
    setSaving(true);

    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;
    const baseScore = Object.values(scores).reduce((a,b)=>a+b,0);

    await addDoc(collection(db,"scores"),{
      eventName,
      judge: activeJudge,
      car, driver, rego, carName,
      gender, carClass,
      finalScore: baseScore + tyreScore - deductionTotal,
      time: Date.now()
    });

    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar(""); setDriver(""); setRego(""); setCarName("");
    setGender(""); setCarClass("");

    setSaving(false);
  };

  const archiveEvent = async ()=>{
    await addDoc(collection(db,"archivedEvents"),{
      eventName,
      results: entries,
      archivedAt: Date.now()
    });

    setEntries([]);
    setEventName("");
    setEventActive(false);
    setLocked(false);
    setScreen("home");
  };

  const exportResults = ()=>{
    const rows = entries.map(e =>
      `${e.car},${e.driver},${e.carClass},${e.gender},${e.finalScore}`
    );
    const csv = "Car,Driver,Class,Gender,Score\n" + rows.join("\n");
    const blob = new Blob([csv]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${eventName}.csv`;
    a.click();
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore - a.finalScore);
  const top150 = sorted.slice(0,150);
  const top30 = top150.slice(0,30);

  const grouped = {};
  sorted.forEach(e=>{
    const key = `${e.carClass}-${e.gender}`;
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(e);
  });

  const classWinners = {};
  Object.keys(grouped).forEach(k=>{
    classWinners[k] = grouped[k].slice(0,3);
  });

  const big = {padding:18,margin:10,width:"100%",fontSize:18};
  const row = {marginBottom:25};

  const scoreBtn = {padding:14,margin:6};
  const scoreActive = {padding:14,margin:6,background:"red",color:"#fff"};

  const genderBtn = {padding:14,margin:6,background:"#1976d2",color:"#fff"};
  const genderActive = {padding:14,margin:6,background:"#0d47a1",color:"#fff"};

  const classBtn = {padding:14,margin:6,background:"#00e676"};
  const classActive = {padding:14,margin:6,background:"#00c853",color:"#fff"};

  const deductionBtn = {padding:14,margin:6,background:"#555",color:"#fff"};
  const deductionActive = {padding:14,margin:6,background:"#b71c1c",color:"#fff"};

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
            <button style={big} onClick={()=>setScreen("classWinners")}>Class Winners</button>
            <button style={big} onClick={exportResults}>Export Results</button>
            <button style={big} onClick={()=>setLocked(true)}>Lock Event</button>
            <button style={big} onClick={()=>setScreen("eventLog")}>Event Log</button>
          </>
        )}
      </div>
    );
  }

  if(screen==="leader"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {sorted.map((e,i)=>(
          <div key={i}>#{i+1} | Car {e.car} | {e.carClass} | {e.gender} | {e.finalScore}</div>
        ))}
        <button style={big} onClick={archiveEvent}>Archive Event</button>
        <button style={big} onClick={()=>window.print()}>Print</button>
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="score"){
    return (
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />

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
              <button key={i} style={scores[cat]===i?scoreActive:scoreBtn} onClick={()=>setScore(cat,i)}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit & Next"}
        </button>

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return <div style={{padding:20}}>Loading...</div>;
}
