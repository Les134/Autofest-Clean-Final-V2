import React, { useState } from "react";

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
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

  const [entries,setEntries] = useState([]);

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  const [saving,setSaving] = useState(false);

  // START EVENT
  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add at least 1 judge");

    setJudges(valid);
    setScreen("judge");
  };

  // SUBMIT
  const submit = ()=>{
    if(saving) return;
    if(!car) return alert("Enter entrant number");

    setSaving(true);

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;

    const finalScore = base + tyreScore - deductionTotal;

    const entry = {
      car,
      gender,
      carClass,
      finalScore
    };

    setEntries(prev => [...prev, entry]);

    // RESET CLEAN
    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setGender("");
    setCarClass("");

    setSaving(false);
  };

  // SORTING
  const sorted = [...entries].sort((a,b)=>b.finalScore-a.finalScore);
  const top150 = sorted.slice(0,150);
  const top30 = top150.slice(0,30);
  const female = sorted.filter(e=>e.gender==="Female");

  const grouped = {};
  sorted.forEach(e=>{
    if(!grouped[e.carClass]) grouped[e.carClass]=[];
    grouped[e.carClass].push(e);
  });

  const big={padding:18,margin:10,width:"100%",fontSize:18};
  const row={marginBottom:30};
  const btn={padding:14,margin:6,borderRadius:6,border:"1px solid #ccc"};
  const active={...btn,background:"red",color:"#fff"};
  const classActive={...btn,background:"green",color:"#fff"};

  const renderList = (list)=>list.map((e,i)=>(
    <div key={i}>
      #{i+1} | Car {e.car} | {e.gender} | Score {e.finalScore}
    </div>
  ));

  // HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🏁 AUTOFEST SERIES</h1>

        <button style={big} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={big} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={big} onClick={()=>setScreen("score")}>Resume Judging</button>
        <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={big} onClick={()=>setScreen("class")}>Class Leaderboard</button>
        <button style={big} onClick={()=>setScreen("female")}>Female Overall</button>
        <button style={big} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={big} onClick={()=>setScreen("top30")}>Top 30 Finals</button>
      </div>
    );
  }

  // SETUP
  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
        />

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

  // SCOREBOARD
  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input value={car} onChange={(e)=>setCar(e.target.value)} placeholder="Entrant No"/>

        <div style={row}>
          <button style={gender==="Male"?active:btn} onClick={()=>setGender("Male")}>Male</button>
          <button style={gender==="Female"?active:btn} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div style={row}>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c?classActive:btn}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat} style={row}>
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

        <div style={row}>
          <strong>Blown Tyres (+5)</strong><br/>
          <button style={tyres.left?active:btn} onClick={()=>setTyres({...tyres,left:!tyres.left})}>Left</button>
          <button style={tyres.right?active:btn} onClick={()=>setTyres({...tyres,right:!tyres.right})}>Right</button>
        </div>

        <div style={row}>
          <strong>Deductions (-10)</strong><br/>
          {deductionsList.map(d=>(
            <button key={d}
              style={deductions[d]?active:btn}
              onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
              {d}
            </button>
          ))}
        </div>

        <button style={big} onClick={submit}>
          {saving ? "Saving..." : "Submit & Next"}
        </button>

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARDS
  if(screen==="leader") return <div style={{padding:20}}><h2>Leaderboard</h2>{renderList(sorted)}<button style={big} onClick={()=>setScreen("home")}>Home</button></div>;
  if(screen==="top150") return <div style={{padding:20}}><h2>Top 150</h2>{renderList(top150)}<button style={big} onClick={()=>setScreen("home")}>Home</button></div>;
  if(screen==="top30") return <div style={{padding:20}}><h2>Top 30 Finals</h2>{renderList(top30)}<button style={big} onClick={()=>setScreen("home")}>Home</button></div>;
  if(screen==="female") return <div style={{padding:20}}><h2>Female Overall</h2>{renderList(female)}<button style={big} onClick={()=>setScreen("home")}>Home</button></div>;

  if(screen==="class"){
    return (
      <div style={{padding:20}}>
        <h2>Class Leaderboard</h2>
        {Object.keys(grouped).map(k=>(
          <div key={k}>
            <h3>{k}</h3>
            {renderList(grouped[k])}
          </div>
        ))}
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}

