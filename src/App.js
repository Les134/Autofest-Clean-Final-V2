import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = ["Smoke","Commitment","Style","Control","Entertainment"];
const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","Rotary"];

export default function App(){

  // EVENT CONTROL
  const [eventName,setEventName] = useState("");
  const [eventId,setEventId] = useState("");
  const [locked,setLocked] = useState(false);

  const [judges,setJudges] = useState(["","","","","",""]);
  const [judge,setJudge] = useState("");

  const [screen,setScreen] = useState("home");

  // SCORING
  const [scores,setScores] = useState({});
  const [data,setData] = useState([]);

  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  // 🔥 LOAD DATA PER EVENT
  useEffect(()=>{
    if(!eventId) return;

    const unsub = onSnapshot(collection(db,"scores_"+eventId), snap=>{
      setData(snap.docs.map(d=>d.data()));
    });

    return ()=>unsub();
  },[eventId]);

  function lockEvent(){

    if(!eventName){
      alert("Enter event name");
      return;
    }

    const id = Date.now().toString();

    setEventId(id);
    setLocked(true);

    setDoc(doc(db,"events",id),{
      name:eventName,
      judges,
      created:Date.now()
    });

    alert("Event Locked");
  }

  function submit(){

    const total = Object.values(scores).reduce((a,b)=>a+b,0);

    addDoc(collection(db,"scores_"+eventId),{
      car,
      driver,
      gender,
      carClass,
      total,
      judge
    });

    // CLEAR
    setScores({});
    setCar("");
    setDriver("");
  }

  function combine(){

    const map={};

    data.forEach(e=>{
      const key = e.car + "_" + e.driver;

      if(!map[key]){
        map[key]={...e,total:0};
      }

      map[key].total += e.total;
    });

    return Object.values(map).sort((a,b)=>b.total-a.total);
  }

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        {judges.map((j,i)=>(
          <input key={i}
            placeholder={"Judge "+(i+1)}
            value={judges[i]}
            onChange={e=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button onClick={lockEvent}>Lock Event</button>

        <br/><br/>

        <button onClick={()=>setScreen("judgeSelect")}>
          Enter Scoring
        </button>
      </div>
    );
  }

  // ---------------- JUDGE SELECT ----------------

  if(screen==="judgeSelect"){
    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i}
            onClick={()=>{
              setJudge(j);
              setScreen("score");
            }}>
            {j || ("Judge "+(i+1))}
          </button>
        ))}
      </div>
    );
  }

  // ---------------- LEADERBOARD ----------------

  if(screen==="board"){
    return (
      <div style={{padding:20}}>
        <h2>{eventName} Leaderboard</h2>

        {combine().map((e,i)=>(
          <div key={i}>
            #{i+1} | {e.car} / {e.driver} - {e.total}
          </div>
        ))}

        <button onClick={()=>setScreen("score")}>Back</button>
      </div>
    );
  }

  // ---------------- SCORE ----------------

  return (
    <div style={{padding:20}}>

      <h2>{judge}</h2>

      <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
      <input placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />

      {classes.map(c=>(
        <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
      ))}

      {categories.map(cat=>(
        <div key={cat}>
          <h4>{cat}</h4>
          {Array.from({length:21},(_,i)=>(
            <button key={i} onClick={()=>setScores({...scores,[cat]:i})}>{i}</button>
          ))}
        </div>
      ))}

      <button onClick={submit}>Submit</button>
      <button onClick={()=>setScreen("board")}>Leaderboard</button>

    </div>
  );
}
