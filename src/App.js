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

// 🔐 ADMIN PASSWORD
const ADMIN_PASS = "admin123";

// ✅ CORRECT SCORE CATEGORIES
const categories = [
  "Smoke",
  "Volume",
  "Constant",
  "Commitment",
  "Style"
];

// ✅ CLASSES
const classes = [
  "V8 Pro",
  "V8 N/A",
  "6Cyl Pro",
  "6Cyl N/A",
  "4Cyl / Rotary"
];

export default function App(){

  const [screen,setScreen] = useState("home");

  // EVENT
  const [eventName,setEventName] = useState("");
  const [eventId,setEventId] = useState("");
  const [events,setEvents] = useState([]);

  // ADMIN
  const [isAdmin,setIsAdmin] = useState(false);

  // JUDGES
  const [judges,setJudges] = useState(["","","","","",""]);
  const [judge,setJudge] = useState("");

  // DATA
  const [data,setData] = useState([]);

  // ENTRY
  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});

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

  function loginAdmin(){
    const pass = prompt("Enter Admin Password");
    if(pass === ADMIN_PASS){
      setIsAdmin(true);
      alert("Admin Logged In");
    } else {
      alert("Wrong Password");
    }
  }

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

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function total(){
    return Object.values(scores).reduce((a,b)=>a+b,0);
  }

  function submit(){
    addDoc(collection(db,"scores_"+eventId),{
      car,
      driver,
      gender,
      carClass,
      total: total(),
      judge
    });

    setScores({});
    setCar("");
    setDriver("");
  }

  function combine(){
    const map={};

    data.forEach(e=>{
      const key = e.car+"_"+e.driver;

      if(!map[key]){
        map[key]={...e,total:0};
      }

      map[key].total += e.total;
    });

    return Object.values(map).sort((a,b)=>b.total-a.total);
  }

  function deleteEvent(id){
    if(!isAdmin){
      alert("Admin only");
      return;
    }

    deleteDoc(doc(db,"events",id)).then(()=>{
      alert("Deleted");
      window.location.reload();
    });
  }

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={homeWrap}>

        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("eventSetup")}>New Event</button>
        <button style={menuBtn} onClick={()=>setScreen("judgeLogin")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Return to Score Sheet</button>
        <button style={menuBtn} onClick={()=>setScreen("board")}>Leaderboard</button>
        <button style={menuBtn} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={menuBtn} onClick={()=>setScreen("top30")}>Top 30</button>
        <button style={menuBtn} onClick={()=>setScreen("archive")}>Event Archive</button>
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
            }}>
              Open
            </button>

            <button onClick={()=>deleteEvent(e.id)}>
              Delete
            </button>
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
        <h2>Event Setup</h2>

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
            onClick={()=>{
              setJudge(j || ("Judge "+(i+1)));
              setScreen("score");
            }}>
            {j || ("Judge "+(i+1))}
          </button>
        ))}

        <button onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // ---------------- LEADERBOARD ----------------

  if(screen==="board"){
    const combined = combine();

    return (
      <div style={{padding:20}}>
        <h2>{eventName}</h2>

        {combined.map((e,i)=>(
          <div key={i}>
            #{i+1} | {e.car} / {e.driver} | {e.carClass} | {e.gender} | {e.total}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- TOP 150 ----------------

  if(screen==="top150"){
    return (
      <div style={{padding:20}}>
        <h2>Top 150</h2>
        {combine().slice(0,150).map((e,i)=>(
          <div key={i}>{i+1}. {e.car} {e.total}</div>
        ))}
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- TOP 30 ----------------

  if(screen==="top30"){
    return (
      <div style={{padding:20}}>
        <h2>Top 30</h2>
        {combine().slice(0,30).map((e,i)=>(
          <div key={i}>{i+1}. {e.car} {e.total}</div>
        ))}
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- SCORE ----------------

  return (
    <div style={scoreWrap}>

      <h2>{judge}</h2>

      <input style={input} placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
      <input style={input} placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />

      <div>
        {classes.map(c=>(
          <button key={c} style={bigBtn} onClick={()=>setCarClass(c)}>{c}</button>
        ))}
      </div>

      <div>
        <button style={bigBtn} onClick={()=>setGender("Male")}>Male</button>
        <button style={bigBtn} onClick={()=>setGender("Female")}>Female</button>
      </div>

      {categories.map(cat=>(
        <div key={cat} style={rowBlock}>
          <strong>{cat}</strong>
          <div style={row}>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                onClick={()=>setScore(cat,i)}
                style={scores[cat]===i?activeBtn:btn}>
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      <h2>Total: {total()}</h2>

      <button style={submitBtn} onClick={submit}>SUBMIT</button>
      <button style={submitBtn} onClick={()=>setScreen("home")}>HOME</button>

    </div>
  );
}

// -------- STYLES (FIXED SIZES) --------

const homeWrap = {background:"#fff",height:"100vh",padding:20,textAlign:"center"};
const menuBtn = {width:"90%",padding:18,margin:"8px auto",display:"block",fontSize:18};

const scoreWrap = {background:"#111",color:"#fff",padding:20};
const input = {width:"95%",padding:14,margin:5,fontSize:16};

const rowBlock = {marginBottom:20};
const row = {display:"flex",flexWrap:"wrap"};

const btn = {padding:12,margin:3,minWidth:45,fontSize:14};
const activeBtn = {...btn,background:"red",color:"#fff"};

const bigBtn = {padding:14,margin:6,fontSize:16};
const submitBtn = {padding:18,margin:10,fontSize:18};
