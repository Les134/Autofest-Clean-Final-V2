import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  deleteDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// SCORE ROWS
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Drivers Skill & Control"
];

const deductionsList = ["Barrier","Reversing","Fail Off Pad","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  // ADMIN
  const [adminPass,setAdminPass] = useState(localStorage.getItem("admin") || "");
  const [isAdmin,setIsAdmin] = useState(false);

  // EVENTS
  const [eventName,setEventName] = useState("");
  const [eventId,setEventId] = useState("");
  const [events,setEvents] = useState([]);

  // DATA
  const [data,setData] = useState([]);

  // ENTRY
  const [driver,setDriver] = useState("");
  const [carNumber,setCarNumber] = useState("");
  const [carRego,setCarRego] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({one:false,two:false});

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

  // ADMIN
  function setAdmin(){
    const pass = prompt("Set Admin Password");
    if(pass){
      localStorage.setItem("admin",pass);
      setAdminPass(pass);
    }
  }

  function loginAdmin(){
    const pass = prompt("Enter Admin Password");
    if(pass === adminPass){
      setIsAdmin(true);
      alert("Admin Logged In");
    } else {
      alert("Incorrect Password");
    }
  }

  function deleteEvent(id){
    if(!isAdmin) return alert("Admin Only");

    deleteDoc(doc(db,"events",id)).then(()=>{
      alert("Event Deleted");
      window.location.reload();
    });
  }

  // EVENT SETUP
  function createEvent(){
    if(!eventName) return alert("Enter Event Name");

    const id = Date.now().toString();

    setEventId(id);

    setDoc(doc(db,"events",id),{
      name:eventName
    });

    setScreen("score");
  }

  function loadEvent(e){
    setEventId(e.id);
    setEventName(e.name);
    setScreen("leaderboard");
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

    if(tyres.one) t += 5;
    if(tyres.two) t += 5;

    return t;
  }

  function submit(){

    if(!entryValid) return alert("Enter Car Number or Rego");

    const activeDeductions = Object.keys(deductions).filter(d=>deductions[d]);

    addDoc(collection(db,"scores_"+eventId),{
      driver,
      carNumber,
      carRego,
      total: total(),
      deductions: activeDeductions
    });

    setScores({});
    setDeductions({});
    setTyres({one:false,two:false});
    setDriver("");
    setCarNumber("");
    setCarRego("");
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
    const name = `${e.driver} / ${e.carNumber || e.carRego}`;
    const ded = e.deductions?.length
      ? ` (${[...new Set(e.deductions)].join(", ")})`
      : "";
    return `${name} - ${e.total}${ded}`;
  }

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={homeWrap}>

        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("eventSetup")}>Event Login / Setup</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Score Sheet</button>
        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
        <button style={menuBtn} onClick={()=>setScreen("archive")}>Event Archive</button>

        <button style={menuBtn} onClick={setAdmin}>Set Admin</button>
        <button style={menuBtn} onClick={loginAdmin}>Admin Login</button>

      </div>
    );
  }

  // ---------------- EVENT SETUP ----------------

  if(screen==="eventSetup"){
    return (
      <div style={{padding:20}}>
        <h2>Create Event</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        <button onClick={createEvent}>Start Event</button>
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- ARCHIVE ----------------

  if(screen==="archive"){
    return (
      <div style={{padding:20}}>
        <h2>Event Archive</h2>

        {events.map(e=>(
          <div key={e.id} style={{marginBottom:10}}>
            {e.name}

            <button onClick={()=>loadEvent(e)}>Open</button>

            {isAdmin && (
              <button onClick={()=>deleteEvent(e.id)}>Delete</button>
            )}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- LEADERBOARD ----------------

  if(screen==="leaderboard"){
    return (
      <div style={{padding:20}}>
        <h2>{eventName} Leaderboard</h2>

        {combined.map((e,i)=>(
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

      <input placeholder="Driver Name" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input placeholder="Car Number" value={carNumber} onChange={e=>setCarNumber(e.target.value)} />
      <input placeholder="Car Rego / Number" value={carRego} onChange={e=>setCarRego(e.target.value)} />

      {!entryValid && <div style={{color:"orange"}}>Enter Car Number or Rego</div>}

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      <div>
        <strong>Blown Tyres</strong><br/>
        <button onClick={()=>setTyres(p=>({...p,one:!p.one}))}>1</button>
        <button onClick={()=>setTyres(p=>({...p,two:!p.two}))}>2</button>
      </div>

      <div>
        <strong>Deductions</strong><br/>
        {deductionsList.map(d=>(
          <button key={d} onClick={()=>toggleDeduction(d)}>{d}</button>
        ))}
      </div>

      <h2>Total: {total()}</h2>

      <button onClick={submit}>Submit</button>
      <button onClick={()=>setScreen("home")}>Home</button>
    </div>
  );
}

// STYLES
const homeWrap = {background:"#fff",height:"100vh",padding:20,textAlign:"center"};
const menuBtn = {width:"90%",padding:18,margin:"8px auto",display:"block",fontSize:18};
const scoreWrap = {background:"#111",color:"#fff",padding:20};
