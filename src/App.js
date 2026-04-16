import React, { useState } from "react";

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

  // FULL RESET
  const fullReset = ()=>{
    if(!window.confirm("Start new event? EVERYTHING will be cleared")) return;

    setEntries([]);
    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setGender("");
    setCarClass("");
    setActiveJudge("");
    setEventName("");
    setJudges(["","","","","",""]);
    setScreen("home");
  };

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
    if(!gender) return alert("Select gender");
    if(!carClass) return alert("Select class");

    if(entries.find(e=>e.car===car)){
      return alert("Entrant already exists");
    }

    setSaving(true);

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;

    const finalScore = base + tyreScore - deductionTotal;

    const entry = { car, gender, carClass, finalScore };

    setEntries(prev => [...prev, entry]);

    // RESET ENTRY
    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setGender("");
    setCarClass("");

    setSaving(false);
  };

  // DELETE ENTRY
  const deleteEntry = (carNo)=>{
    if(!window.confirm("Delete entry?")) return;
    setEntries(prev => prev.filter(e=>e.car!==carNo));
  };

  // SORT
  const sorted = [...entries]
    .sort((a,b)=> b.finalScore - a.finalScore || a.car.localeCompare(b.car));

  const top150 = sorted.slice(0,150);
  const top30 = top150.slice(0,30);
  const female = sorted.filter(e=>e.gender==="Female");

  const grouped = {};
  sorted.forEach(e=>{
    if(!grouped[e.carClass]) grouped[e.carClass]=[];
    grouped[e.carClass].push(e);
  });

  const renderList = (list)=>list.map((e,i)=>(
    <div key={i}>
      #{i+1} | Car {e.car} | {e.gender} | {e.carClass} | Score {e.finalScore}
      <button onClick={()=>deleteEntry(e.car)}>DEL</button>
    </div>
  ));

  // HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🏁 AUTOFEST SERIES</h1>

        <button onClick={()=>setScreen("setup")}>New Event</button>
        <button onClick={()=>setScreen("judge")}>Judge Login</button>
        <button onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button onClick={()=>setScreen("class")}>Class Leaderboard</button>
        <button onClick={()=>setScreen("female")}>Female Overall</button>
        <button onClick={()=>setScreen("top150")}>Top 150</button>
        <button onClick={()=>setScreen("top30")}>Top 30 Finals</button>

        <button onClick={fullReset}>FULL RESET EVENT</button>
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

        <button onClick={startEvent}>Start Event</button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen==="judge"){
    return(
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i}
            onClick={()=>{
              if(activeJudge) return alert("Judge already selected");
              setActiveJudge(j);
              setScreen("score");
            }}>
            {j}
          </button>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input value={car} onChange={(e)=>setCar(e.target.value)} placeholder="Entrant No"/>

        <div>
          <button onClick={()=>setGender("Male")}>Male</button>
          <button onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
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

        <button onClick={submit}>
          {saving ? "Saving..." : "Submit & Next"}
        </button>

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="leader") return <div style={{padding:20}}><h2>Leaderboard</h2>{renderList(sorted)}</div>;
  if(screen==="top150") return <div style={{padding:20}}><h2>Top 150</h2>{renderList(top150)}</div>;
  if(screen==="top30") return <div style={{padding:20}}><h2>Top 30 Finals</h2>{renderList(top30)}</div>;
  if(screen==="female") return <div style={{padding:20}}><h2>Female Overall</h2>{renderList(female)}</div>;

  if(screen==="class"){
    return(
      <div style={{padding:20}}>
        <h2>Class Leaderboard</h2>
        {Object.keys(grouped).map(k=>(
          <div key={k}>
            <h3>{k}</h3>
            {renderList(grouped[k])}
          </div>
        ))}
      </div>
    );
  }

  return <div>Loading...</div>;
}
