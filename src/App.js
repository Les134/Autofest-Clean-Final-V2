import React, { useState } from "react";

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

  const [events,setEvents] = useState({}); // 🔥 all events stored here

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

  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add at least 1 judge");

    setJudges(valid);

    setEvents(prev => ({
      ...prev,
      [eventName]: {
        entries: [],
        locked: false
      }
    }));

    setScreen("judge");
  };

  const submit = ()=>{
    if(saving) return;

    if(!car && !name && !rego){
      return alert("Enter Car #, Name or Rego");
    }

    setSaving(true);

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;

    const finalScore = base + tyreScore - deductionTotal;

    const entry = {
      car,
      name,
      rego,
      gender,
      carClass,
      finalScore
    };

    setEvents(prev => ({
      ...prev,
      [eventName]: {
        ...prev[eventName],
        entries: [...(prev[eventName]?.entries || []), entry]
      }
    }));

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

  const currentEntries = events[eventName]?.entries || [];

  const sorted = [...currentEntries].sort((a,b)=>b.finalScore-a.finalScore);
  const top150 = sorted.slice(0,150);
  const top30 = sorted.slice(0,30);

  const grouped = {};
  sorted.forEach(e=>{
    if(!grouped[e.carClass]) grouped[e.carClass]=[];
    grouped[e.carClass].push(e);
  });

  const big={padding:18,margin:10,width:"100%",fontSize:18};
  const btn={padding:12,margin:5,border:"1px solid #ccc"};
  const active={...btn,background:"red",color:"#fff"};
  const classActive={...btn,background:"green",color:"#fff"};

  const renderList = (list)=>list.map((e,i)=>(
    <div key={i}>
      #{i+1} | {e.car || e.name || e.rego} | {e.finalScore}
    </div>
  ));

  // HOME
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

        <button style={big} onClick={()=>setScreen("archive")}>Event Archive</button>
        <button style={big} onClick={()=>setScreen("admin")}>Admin Login</button>
      </div>
    );
  }

  // ADMIN
  if(screen==="admin"){
    return(
      <div style={{padding:20}}>
        <h2>Admin Login</h2>

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

  // SETUP
  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name" onChange={(e)=>setEventName(e.target.value)} />

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

  // JUDGE
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

        <div>
          <button style={tyres.left?active:btn} onClick={()=>setTyres({...tyres,left:!tyres.left})}>Left Tyre</button>
          <button style={tyres.right?active:btn} onClick={()=>setTyres({...tyres,right:!tyres.right})}>Right Tyre</button>
        </div>

        <div>
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

  // LEADER
  if(screen==="leader") return <div style={{padding:20}}><h2>Leaderboard</h2>{renderList(sorted)}</div>;
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

  if(screen==="archive"){
    return(
      <div style={{padding:20}}>
        <h2>Event Archive</h2>

        {Object.keys(events).map(ev=>(
          <div key={ev}>
            {ev}
            {isAdmin && (
              <button onClick={()=>{
                const copy={...events};
                delete copy[ev];
                setEvents(copy);
              }}>
                Delete
              </button>
            )}
          </div>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
