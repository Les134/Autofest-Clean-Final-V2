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

export default function App(){

  const [screen,setScreen] = useState("home");
  const [entries,setEntries] = useState([]);
  const [eventName,setEventName] = useState("");
  const [eventActive,setEventActive] = useState(false);
  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");
  const [scores,setScores] = useState({});
  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [saving,setSaving] = useState(false);

  // 🔥 Load ONLY current event
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

    const total = Object.values(scores).reduce((a,b)=>a+b,0);

    await addDoc(collection(db,"scores"),{
      eventName,
      judge: activeJudge,
      car,
      gender,
      carClass,
      finalScore: total,
      time: Date.now()
    });

    setScores({});
    setCar("");
    setGender("");
    setCarClass("");
    setSaving(false);
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore-a.finalScore);

  const big = {padding:18,margin:10,width:"100%",fontSize:18};

  // 🏠 HOME
  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>AutoFest System</h1>

        <button style={big} onClick={()=>setScreen("setup")}>
          New Event
        </button>

        {eventActive && (
          <>
            <button style={big} onClick={()=>setScreen("judgeSelect")}>
              Judge Login
            </button>

            <button style={big} onClick={()=>setScreen("score")}>
              Resume Judging
            </button>

            <button style={big} onClick={()=>setScreen("leader")}>
              Leaderboard
            </button>
          </>
        )}
      </div>
    );
  }

  // 🧾 SETUP (FIXED)
  if(screen==="setup"){
    return (
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
        />

        <h3>Judges</h3>

        {judges.map((j,i)=>(
          <input
            key={i}
            placeholder={`Judge ${i+1}`}
            value={j}
            onChange={(e)=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button style={big} onClick={startEvent}>
          Start Event
        </button>

        <button style={big} onClick={()=>setScreen("home")}>
          Back
        </button>
      </div>
    );
  }

  // 👨‍⚖️ JUDGE SELECT (FIXED)
  if(screen==="judgeSelect"){
    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button
            key={i}
            style={big}
            onClick={()=>{
              setActiveJudge(j);
              setScreen("score");
            }}
          >
            {j}
          </button>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // 🏆 LEADERBOARD
  if(screen==="leader"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {sorted.length === 0 && <p>No results yet</p>}

        {sorted.map((e,i)=>(
          <div key={i}>
            #{i+1} | Car {e.car} | {e.carClass} | {e.gender} | {e.finalScore}
          </div>
        ))}

        <button style={big} onClick={()=>window.print()}>
          Print
        </button>

        <button style={big} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // 🧾 SCOREBOARD
  if(screen==="score"){
    return (
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input
          placeholder="Car #"
          value={car}
          onChange={(e)=>setCar(e.target.value)}
        />

        <div>
          <button onClick={()=>setGender("Male")}>Male</button>
          <button onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c} onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <strong>{cat}</strong><br/>
            {Array.from({length:21},(_,i)=>(
              <button
                key={i}
                onClick={()=>setScores({...scores,[cat]:i})}
              >
                {i}
              </button>
            ))}
          </div>
        ))}

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit & Next"}
        </button>

        <button style={big} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  return <div style={{padding:20}}>Loading...</div>;
}
