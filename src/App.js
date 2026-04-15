import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

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
  const [eventLocked,setEventLocked] = useState(false);

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
    });
    return ()=>unsub();
  },[]);

  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add judge");

    setJudges(valid);
    setScreen("judge");
  };

  const submit = async ()=>{
    if(eventLocked) return alert("Event locked");

    if(!car || !gender || !carClass) return alert("Complete fields");

    if(Object.keys(scores).length !== categories.length){
      return alert("Score all categories");
    }

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const activeDeductions = Object.keys(deductions).filter(d=>deductions[d]);
    const finalScore = base + tyreScore - (activeDeductions.length*10);

    await addDoc(collection(db,"scores"),{
      car, gender, carClass,
      finalScore,
      deductions: activeDeductions,
      judge: activeJudge,
      created: new Date().toISOString()
    });

    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setGender("");
    setCarClass("");
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore-a.finalScore);

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

  const grouped = {};
  classes.forEach(c=>{
    grouped[c] = entries.filter(e=>e.carClass===c)
      .sort((a,b)=>b.finalScore-a.finalScore);
  });

  const big={padding:18,margin:10,width:"100%"};

  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🔥 AUTOFEST 🔥</h1>
        <button style={big} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={big} onClick={()=>setScreen("classes")}>Class Leaderboards</button>
      </div>
    );
  }

  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <input placeholder="Event Name" onChange={e=>setEventName(e.target.value)}/>
        {judges.map((j,i)=>(
          <input key={i} placeholder={`Judge ${i+1}`}
            onChange={e=>{
              const c=[...judges]; c[i]=e.target.value; setJudges(c);
            }}
          />
        ))}
        <button onClick={startEvent}>Start Event</button>
      </div>
    );
  }

  if(screen==="judge"){
    return(
      <div style={{padding:20}}>
        {judges.map((j,i)=>(
          <button key={i} style={big}
            onClick={()=>{setActiveJudge(j);setScreen("score")}}>
            {j}
          </button>
        ))}
      </div>
    );
  }

  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input value={car} onChange={e=>setCar(e.target.value)} placeholder="Car"/>

        <button onClick={()=>setGender("Male")}>Male</button>
        <button onClick={()=>setGender("Female")}>Female</button>

        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
        ))}

        {categories.map(cat=>(
          <div key={cat}>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                onClick={()=>setScores({...scores,[cat]:i})}>{i}</button>
            ))}
          </div>
        ))}

        <button style={big} onClick={submit}>Submit</button>
      </div>
    );
  }

  if(screen==="leader"){
    return(
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {renderList(sorted)}
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="classes"){
    return(
      <div style={{padding:20}}>
        <h2>Class Leaderboards</h2>
        {classes.map(c=>(
          <div key={c}>
            <h3>{c}</h3>
            {renderList(grouped[c])}
          </div>
        ))}
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
