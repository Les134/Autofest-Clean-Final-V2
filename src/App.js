import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// LOCKED ROWS
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Drivers Skill & Control"
];

const classes = ["V8 Pro","V8 N/A","6Cyl Pro","6Cyl N/A","4Cyl / Rotary"];

const deductionsList = [
  "Hi Barrier",
  "Reversing / Stall",
  "Fail To Drive Off Pad",
  "Large Fire"
];

export default function App(){

  const [screen,setScreen] = useState("home");

  // ADMIN
  const [admin,setAdmin] = useState(localStorage.getItem("admin") || "");
  const [isAdmin,setIsAdmin] = useState(false);

  // EVENT
  const [eventName,setEventName] = useState("");
  const [eventId,setEventId] = useState("");
  const [events,setEvents] = useState([]);

  // JUDGES
  const [judges,setJudges] = useState(["","","","","",""]);
  const [judge,setJudge] = useState("");

  // DATA
  const [data,setData] = useState([]);

  // ENTRY
  const [carNumber,setCarNumber] = useState("");
  const [carRego,setCarRego] = useState("");
  const [driver,setDriver] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState(0);

  // LOAD EVENTS
  useEffect(()=>{
    getDocs(collection(db,"events")).then(snap=>{
      setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[]);

  // LOAD SCORES PER EVENT
  useEffect(()=>{
    if(!eventId) return;

    const unsub = onSnapshot(collection(db,"scores_"+eventId), snap=>{
      setData(snap.docs.map(d=>d.data()));
    });

    return ()=>unsub();
  },[eventId]);

  // ADMIN
  function setAdminPass(){
    const pass = prompt("Set Admin Password");
    if(pass){
      localStorage.setItem("admin",pass);
      setAdmin(pass);
    }
  }

  function loginAdmin(){
    const pass = prompt("Enter Admin Password");
    if(pass === admin){
      setIsAdmin(true);
      alert("Admin Logged In");
    }
  }

  function deleteEvent(id){
    if(!isAdmin) return alert("Admin Only");

    deleteDoc(doc(db,"events",id)).then(()=>{
      alert("Deleted");
      window.location.reload();
    });
  }

  // EVENT LOCK
  function lockEvent(){
    if(!eventName) return alert("Enter event name");

    const id = Date.now().toString();

    setEventId(id);

    setDoc(doc(db,"events",id),{
      name:eventName,
      judges
    });

    setData([]);
    setScreen("judgeLogin");
  }

  // VALIDATION
  const entryValid =
    carNumber.trim() !== "" ||
    carRego.trim() !== "";

  function setScore(cat,val){
    if(!entryValid) return;
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    if(!entryValid) return;
    setDeductions(prev=>({...prev,[d]:!prev[d]}));
  }

  function total(){
    let t = Object.values(scores).reduce((a,b)=>a+b,0);

    Object.values(deductions).forEach(v=>{
      if(v) t -= 10;
    });

    t += tyres * 5;

    return t;
  }

  function submit(){

    if(!entryValid){
      alert("Enter Car Number or Rego");
      return;
    }

    addDoc(collection(db,"scores_"+eventId),{
      carNumber,
      carRego,
      driver,
      gender,
      carClass,
      total: total(),
      judge
    });

    setScores({});
    setDeductions({});
    setTyres(0);
    setCarNumber("");
    setCarRego("");
    setDriver("");
  }

  function leaderboard(){
    return [...data].sort((a,b)=>b.total-a.total);
  }

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={homeWrap}>

        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("eventSetup")}>New Event</button>
        <button style={menuBtn} onClick={()=>setScreen("judgeLogin")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Resume Scoring</button>
        <button style={menuBtn} onClick={()=>setScreen("board")}>Leaderboard</button>
        <button style={menuBtn} onClick={()=>setScreen("archive")}>Event Archive</button>

        <button style={menuBtn} onClick={setAdminPass}>Set Admin</button>
        <button style={menuBtn} onClick={loginAdmin}>Admin Login</button>

      </div>
    );
  }

  // ---------------- ARCHIVE ----------------

  if(screen==="archive"){
    return (
      <div style={{padding:20}}>
        <h2>Event Archive</h2>

        {events.map(e=>(
          <div key={e.id}>
            {e.name}

            <button onClick={()=>{
              setEventId(e.id);
              setEventName(e.name);
              setScreen("board");
            }}>Open</button>

            <button onClick={()=>deleteEvent(e.id)}>Delete</button>
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- EVENT SETUP ----------------

  if(screen==="eventSetup"){
    return (
      <div style={{padding:20}}>
        <h2>Setup Event</h2>

        <input placeholder="Event Name" value={eventName} onChange={e=>setEventName(e.target.value)} />

        {judges.map((j,i)=>(
          <input key={i} placeholder={"Judge "+(i+1)}
            value={judges[i]}
            onChange={e=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button onClick={lockEvent}>Lock Event</button>
        <button onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // ---------------- JUDGE LOGIN ----------------

  if(screen==="judgeLogin"){
    return (
      <div style={homeWrap}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i} style={menuBtn}
            onClick={()=>{setJudge(j || ("Judge "+(i+1))); setScreen("score");}}>
            {j || ("Judge "+(i+1))}
          </button>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- LEADERBOARD ----------------

  if(screen==="board"){
    const sorted = leaderboard();

    return (
      <div style={{padding:20}}>
        <h2>{eventName} Leaderboard</h2>

        {sorted.map((e,i)=>(
          <div key={i}>
            #{i+1} {e.carNumber || e.carRego} - {e.total}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- SCORE ----------------

  return (
    <div style={scoreWrap}>

      <h2>{judge}</h2>

      <input style={input} placeholder="Driver Name" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input style={input} placeholder="Car Number" value={carNumber} onChange={e=>setCarNumber(e.target.value)} />
      <input style={input} placeholder="Car Rego / Number" value={carRego} onChange={e=>setCarRego(e.target.value)} />

      {!entryValid && <div style={{color:"orange"}}>Enter Car Number or Rego</div>}

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i}
              disabled={!entryValid}
              onClick={()=>setScore(cat,i)}>
              {i}
            </button>
          ))}
        </div>
      ))}

      <button onClick={submit}>Submit</button>
      <button onClick={()=>setScreen("home")}>Home</button>

    </div>
  );
}

// STYLES
const homeWrap = {background:"#fff",height:"100vh",padding:20,textAlign:"center"};
const menuBtn = {width:"90%",padding:18,margin:"8px auto",display:"block",fontSize:18};
const scoreWrap = {background:"#111",color:"#fff",padding:20};
const input = {width:"95%",padding:14,margin:5};
