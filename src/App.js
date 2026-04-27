import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  getDocs
} from "firebase/firestore";

import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// SCORE ROWS
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Drivers Skill & Control"
];

const deductionsList = ["Barrier","Reversing","Fail Off Pad","Fire"];

const classes = [
  "V8 Pro",
  "V8 N/A",
  "6Cyl Pro",
  "6Cyl N/A",
  "4Cyl / Rotary"
];

export default function App(){

  const [screen,setScreen] = useState("home");
  const [data,setData] = useState([]);

  const [eventName,setEventName] = useState("");
  const [eventId,setEventId] = useState("");
  const [events,setEvents] = useState([]);
  const [judges,setJudges] = useState(["","","","","",""]);

  const [driver,setDriver] = useState("");
  const [carNumber,setCarNumber] = useState("");
  const [carRego,setCarRego] = useState("");

  const [carClass,setCarClass] = useState("");
  const [gender,setGender] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({one:false,two:false});

  // AUTH
  useEffect(()=>{
    signInAnonymously(auth).catch(console.error);
  },[]);

  // LOAD EVENTS
  useEffect(()=>{
    getDocs(collection(db,"events")).then(snap=>{
      setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[]);

  // LOAD SCORES
  useEffect(()=>{
    if(!eventId) return;

    const unsub = onSnapshot(collection(db,"scores_"+eventId), snap=>{
      setData(snap.docs.map(d=>d.data()));
    });

    return ()=>unsub();
  },[eventId]);

  // VALIDATION
  const entryValid =
    (carNumber.trim() !== "" || carRego.trim() !== "") &&
    carClass !== "" &&
    gender !== "";

  function setScore(cat,val){
    if(!entryValid) return;
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev=>({...prev,[d]:!prev[d]}));
  }

  function total(){
    let t = Object.values(scores).reduce((a,b)=>a+b,0);

    Object.values(deductions).forEach(v=>{
      if(v) t -= 10;
    });

    if(tyres.one) t += 5;
    if(tyres.two) t += 5;

    return t;
  }

  function submit(){

    if(!entryValid){
      alert("Enter Car + Class + Gender");
      return;
    }

    const activeDeductions = Object.keys(deductions).filter(d=>deductions[d]);

    addDoc(collection(db,"scores_"+eventId),{
      driver,
      carNumber,
      carRego,
      carClass,
      gender,
      total: total(),
      deductions: activeDeductions
    });

    setScores({});
    setDeductions({});
    setTyres({one:false,two:false});
    setDriver("");
    setCarNumber("");
    setCarRego("");
    setCarClass("");
    setGender("");
  }

  function combine(){
    const map={};

    data.forEach(e=>{
      const key = (e.carNumber || e.carRego) + "_" + e.driver;

      if(!map[key]){
        map[key]={...e,total:0,deductions:[]};
      }

      map[key].total += e.total;

      if(e.deductions){
        map[key].deductions.push(...e.deductions);
      }
    });

    return Object.values(map).sort((a,b)=>b.total-a.total);
  }

  const combined = combine();

  function format(e){
    const name = `${e.driver} / Car Number: ${e.carNumber || e.carRego}`;
    const ded = e.deductions?.length
      ? ` (${[...new Set(e.deductions)].join(", ")})`
      : "";

    return `${name} - Score: ${e.total}${ded} [${e.carClass} - ${e.gender}]`;
  }

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={homeWrap}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("eventSetup")}>Event Setup</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Score Sheet</button>

        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
        <button style={menuBtn} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={menuBtn} onClick={()=>setScreen("top30")}>Top 30</button>

        <button style={menuBtn} onClick={()=>setScreen("archive")}>Archive</button>
      </div>
    );
  }

  // ---------------- EVENT SETUP ----------------

  if(screen==="eventSetup"){
    return (
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        <h3>Judges</h3>

        {judges.map((j,i)=>(
          <input
            key={i}
            placeholder={"Judge "+(i+1)}
            value={judges[i]}
            onChange={e=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button onClick={()=>{
          const id = Date.now().toString();
          setEventId(id);

          setDoc(doc(db,"events",id),{
            name:eventName,
            judges
          });

          alert("Event Created");
          setScreen("home");
        }}>
          Save Event
        </button>

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- LEADERBOARDS ----------------

  if(screen==="leaderboard" || screen==="top150" || screen==="top30"){

    let list = combined;
    if(screen==="top150") list = combined.slice(0,150);
    if(screen==="top30") list = combined.slice(0,30);

    return (
      <div style={{padding:20}}>
        <h2>{screen.toUpperCase()}</h2>

        {list.map((e,i)=>(
          <div key={i}>
            #{i+1} {format(e)}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- SCORE ----------------

  return (
    <div style={scoreWrap}>

      <input style={input} placeholder="Driver Name" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input style={input} placeholder="Car Number" value={carNumber} onChange={e=>setCarNumber(e.target.value)} />
      <input style={input} placeholder="Car Rego / Number" value={carRego} onChange={e=>setCarRego(e.target.value)} />

      {/* CLASS */}
      <div>
        <strong>Class</strong><br/>
        {classes.map(c=>(
          <button key={c}
            onClick={()=>setCarClass(c)}
            style={carClass===c?activeBtn:btn}>
            {c}
          </button>
        ))}
      </div>

      {/* GENDER */}
      <div>
        <strong>Gender</strong><br/>
        <button onClick={()=>setGender("Male")} style={gender==="Male"?activeBtn:btn}>Male</button>
        <button onClick={()=>setGender("Female")} style={gender==="Female"?activeBtn:btn}>Female</button>
      </div>

      {!entryValid && <div style={{color:"orange"}}>Complete all required fields</div>}

      {categories.map(cat=>(
        <div key={cat} style={rowBlock}>
          <strong>{cat}</strong>
          <div style={row}>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                disabled={!entryValid}
                onClick={()=>setScore(cat,i)}
                style={scores[cat]===i?activeBtn:btn}>
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <strong>Blown Tyres</strong><br/>
        <button style={tyres.one?activeBtn:btn} onClick={()=>setTyres(p=>({...p,one:!p.one}))}>1</button>
        <button style={tyres.two?activeBtn:btn} onClick={()=>setTyres(p=>({...p,two:!p.two}))}>2</button>
      </div>

      <div>
        <strong>Deductions</strong><br/>
        {deductionsList.map(d=>(
          <button key={d}
            onClick={()=>toggleDeduction(d)}
            style={deductions[d]?activeBtn:btn}>
            {d}
          </button>
        ))}
      </div>

      <h2>Total: {total()}</h2>

      <button style={submitBtn} onClick={submit}>SUBMIT</button>
      <button style={submitBtn} onClick={()=>setScreen("home")}>HOME</button>

    </div>
  );
}

// STYLES
const homeWrap = {background:"#fff",height:"100vh",padding:20,textAlign:"center"};
const menuBtn = {width:"90%",padding:18,margin:"8px auto",fontSize:18};

const scoreWrap = {background:"#111",color:"#fff",padding:20};
const input = {width:"95%",padding:14,margin:5};

const rowBlock = {marginBottom:20};
const row = {display:"flex",flexWrap:"wrap"};

const btn = {padding:14,margin:3,minWidth:50};
const activeBtn = {...btn,background:"red",color:"#fff"};

const submitBtn = {padding:18,margin:10};
