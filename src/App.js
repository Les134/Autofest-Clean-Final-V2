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

  const [eventName,setEventName] = useState("");
  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  // 🔥 LIVE DATA
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"), snap=>{
      setEntries(snap.docs.map(doc=>doc.data()) || []);
    });
    return ()=>unsub();
  },[]);

  // 🔒 LOCK STATE
  useEffect(()=>{
    const load = async ()=>{
      const snap = await getDoc(doc(db,"settings","event"));
      if(snap.exists()) setEventLocked(snap.data().locked);
    };
    load();
  },[]);

  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add judge");

    setJudges(valid);
    setScreen("judge");
  };

  const submit = async ()=>{
    if(eventLocked) return alert("Event LOCKED");

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

    await addDoc(collection(db,"scores"),{
      car,
      gender,
      carClass,
      finalScore,
      deductions: activeDeductions,
      judge: activeJudge,
      created: new Date().toISOString()
    });

    // RESET (IMPORTANT)
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
  const top150 = sorted.slice(0,150);

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

  // 🏠 HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🏁 AUTOFEST SERIES</h1>

        <button style={big} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={big} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={big} onClick={()=>setScreen("score")}>Resume Judging</button>
        <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={big} onClick={()=>setScreen("classes")}>Class Leaderboards</button>
        <button style={big} onClick={()=>setScreen("top30")}>Top 30 Shootout</button>
        <button style={big} onClick={()=>setScreen("top150")}>Top 150</button>
      </div>
    );
  }

  // SETUP
  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name"
          onChange={(e)=>setEventName(e.target.value)} />

        {judges.map((j,i)=>(
          <input key={i}
            placeholder={`Judge ${i+1}`}
            onChange={(e)=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button style={big} onClick={startEvent}>Start Event</button>
      </div>
    );
  }

  // JUDGE LOGIN
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

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input value={car}
          onChange={(e)=>setCar(e.target.value)}
          placeholder="Entrant No"/>

        <div>
          <button onClick={()=>setGender("Male")}>Male</button>
          <button onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c}
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
                onClick={()=>setScores({...scores,[cat]:i})}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <div>
          <strong>Blown Tyres (+5)</strong><br/>
          <button onClick={()=>setTyres({...tyres,left:!tyres.left})}>Left</button>
          <button onClick={()=>setTyres({...tyres,right:!tyres.right})}>Right</button>
        </div>

        <div>
          <strong>Deductions (-10)</strong><br/>
          {deductionsList.map(d=>(
            <button key={d}
              onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
              {d}
            </button>
          ))}
        </div>

        <button style={big} onClick={submit}>Submit Score</button>
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
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

  // CLASS LEADERBOARDS
  if(screen==="classes"){
    return(
      <div style={{padding:20}}>
        <h2>Class Leaderboards</h2>

        {classes.map(c=>(
          <div key={c}>
            <h3>{c}</h3>
            {renderList(sorted.filter(e=>e.carClass===c))}
          </div>
        ))}

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

  // TOP 150
  if(screen==="top150"){
    return(
      <div style={{padding:20}}>
        <h2>Top 150</h2>
        {renderList(top150)}
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
