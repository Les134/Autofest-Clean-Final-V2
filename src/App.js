import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const classes = [
  "V8 Pro",
  "V8 N/A",
  "6 Cyl Pro",
  "6 Cyl N/A",
  "4Cyl Open/Rotary"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");

  const [events,setEvents] = useState([]);
  const [entries,setEntries] = useState([]);

  const [car,setCar] = useState("");
  const [name,setName] = useState("");
  const [rego,setRego] = useState("");

  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  const [saving,setSaving] = useState(false);
  const [isAdmin,setIsAdmin] = useState(false);

  // LOAD DATA
  useEffect(()=>{
    loadEvents();
    loadScores();
  },[]);

  const loadEvents = async ()=>{
    const snap = await getDocs(collection(db,"events"));
    setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
  };

  const loadScores = async ()=>{
    const snap = await getDocs(collection(db,"scores"));
    setEntries(snap.docs.map(d=>d.data()));
  };

  // CREATE EVENT
  const startEvent = async ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add at least 1 judge");

    await addDoc(collection(db,"events"),{
      name:eventName,
      judges:valid,
      createdAt:new Date()
    });

    loadEvents();
    setScreen("judge");
  };

  // SUBMIT SCORE
  const submit = async ()=>{
    if(saving) return;

    if(!car && !name && !rego){
      return alert("Enter Car #, Name or Rego");
    }

    setSaving(true);

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);

    const activeDeductions = Object.keys(deductions).filter(d => deductions[d]);
    const deductionTotal = activeDeductions.length * 10;

    const total = base + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      eventName,
      car,
      name,
      rego,
      gender,
      carClass,
      judge:activeJudge,
      total,
      deductions:activeDeductions,
      createdAt:new Date()
    });

    loadScores();

    // RESET
    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setName("");
    setRego("");
    setGender("");
    setCarClass("");

    setSaving(false);
  };

  // DELETE EVENT
  const deleteEvent = async (id)=>{
    if(!isAdmin) return alert("Admin only");
    await deleteDoc(doc(db,"events",id));
    loadEvents();
  };

  // PROCESS LEADERBOARD
  const current = entries.filter(e=>e.eventName===eventName);

  const combined = {};
  current.forEach(e=>{
    const key = e.car || e.name || e.rego;

    if(!combined[key]){
      combined[key] = {
        car:key,
        carClass:e.carClass,
        gender:e.gender,
        total:0,
        deductions:new Set()
      };
    }

    combined[key].total += e.total;
    e.deductions?.forEach(d=>combined[key].deductions.add(d));
  });

  const list = Object.values(combined)
    .map(e=>({...e, deductions:[...e.deductions]}))
    .sort((a,b)=>b.total-a.total);

  const top150 = list.slice(0,150);
  const top30 = list.slice(0,30);

  const grouped = {};
  list.forEach(e=>{
    if(!grouped[e.carClass]) grouped[e.carClass]=[];
    grouped[e.carClass].push(e);
  });

  const female = list.filter(e=>e.gender==="Female");

  const big={padding:18,margin:10,width:"100%",fontSize:18};
  const btn={padding:10,margin:5,border:"1px solid #ccc"};
  const active={...btn,background:"red",color:"#fff"};
  const classActive={...btn,background:"green",color:"#fff"};

  const renderList = (list)=>list.map((e,i)=>(
    <div key={i}>
      #{i+1} | {e.car} | {e.carClass} | Score - 
      {e.deductions.length>0 && <>({e.deductions.join(", ")}) </>}
      {e.total}
    </div>
  ));

  // SCREENS

  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={big} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={big} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={big} onClick={()=>setScreen("score")}>Resume Scoring</button>

        <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={big} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={big} onClick={()=>setScreen("top30")}>Top 30 Finals</button>
        <button style={big} onClick={()=>setScreen("class")}>Class Leaders</button>
        <button style={big} onClick={()=>setScreen("female")}>Female Class</button>

        <button style={big} onClick={()=>setScreen("archive")}>Event Archive</button>
        <button style={big} onClick={()=>setScreen("admin")}>Admin Login</button>
      </div>
    );
  }

  if(screen==="admin"){
    return(
      <div style={{padding:20}}>
        <input type="password" placeholder="Password"
          onChange={(e)=>{
            if(e.target.value==="autofest123"){
              setIsAdmin(true);
              alert("Admin logged in");
            }
          }}
        />
        <button style={big} onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <input placeholder="Event Name" onChange={(e)=>setEventName(e.target.value)} />

        {judges.map((j,i)=>(
          <input key={i} placeholder={`Judge ${i+1}`}
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

        <input placeholder="Car #" value={car} onChange={(e)=>setCar(e.target.value)} />
        <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input placeholder="Rego" value={rego} onChange={(e)=>setRego(e.target.value)} />

        <div>
          <button style={gender==="Male"?active:btn} onClick={()=>setGender("Male")}>Male</button>
          <button style={gender==="Female"?active:btn} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c?classActive:btn}
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
                style={scores[cat]===i?active:btn}
                onClick={()=>setScores({...scores,[cat]:i})}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit & Next"}
        </button>
      </div>
    );
  }

  if(screen==="leader") return <div style={{padding:20}}><h2>Leaderboard</h2>{renderList(list)}</div>;
  if(screen==="top150") return <div style={{padding:20}}><h2>Top 150</h2>{renderList(top150)}</div>;
  if(screen==="top30") return <div style={{padding:20}}><h2>Top 30 Finals</h2>{renderList(top30)}</div>;

  if(screen==="class"){
    return(
      <div style={{padding:20}}>
        <h2>Class Leaders</h2>
        {Object.keys(grouped).map(k=>(
          <div key={k}>
            <h3>{k}</h3>
            {renderList(grouped[k])}
          </div>
        ))}
      </div>
    );
  }

  if(screen==="female") return <div style={{padding:20}}><h2>Female Class</h2>{renderList(female)}</div>;

  if(screen==="archive"){
    return(
      <div style={{padding:20}}>
        <h2>Event Archive</h2>
        {events.map(ev=>(
          <div key={ev.id}>
            {ev.name}
            {isAdmin && <button onClick={()=>deleteEvent(ev.id)}>Delete</button>}
          </div>
        ))}
      </div>
    );
  }

  return <div>Loading...</div>;
}
