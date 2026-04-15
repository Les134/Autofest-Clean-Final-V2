import React, { useState, useEffect } from "react";

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

  const [entries,setEntries] = useState([]);
  const [archive,setArchive] = useState([]);

  const [eventLocked,setEventLocked] = useState(false);

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  const [saving,setSaving] = useState(false);
  const [editingCar,setEditingCar] = useState(null);

  // LOAD
  useEffect(()=>{
    const data = localStorage.getItem("autofestData");
    if(data){
      const parsed = JSON.parse(data);
      setEntries(parsed.entries || []);
      setEventName(parsed.eventName || "");
      setJudges(parsed.judges || []);
      setEventLocked(parsed.eventLocked || false);
    }

    const stored = localStorage.getItem("autofestArchive");
    if(stored){
      setArchive(JSON.parse(stored));
    }
  },[]);

  // SAVE
  useEffect(()=>{
    localStorage.setItem("autofestData", JSON.stringify({
      entries,
      eventName,
      judges,
      eventLocked
    }));
  },[entries,eventName,judges,eventLocked]);

  const printResults = () => window.print();

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
    if(eventLocked) return alert("Event is locked");

    if(!car) return alert("Enter entrant number");
    if(!gender) return alert("Select gender");
    if(!carClass) return alert("Select class");

    const exists = entries.find(e=>e.car===car);
    if(exists && !editingCar){
      if(!window.confirm("Car already exists. Add another run?")) return;
    }

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;

    const finalScore = base + tyreScore - deductionTotal;

    if(editingCar){
      setEntries(prev =>
        prev.map(e =>
          e.car === editingCar ? { ...e, gender, carClass } : e
        )
      );
      setEditingCar(null);
      setScreen("leader");
    } else {
      setEntries(prev => [...prev, {
        car,
        gender,
        carClass,
        finalScore
      }]);
    }

    // RESET
    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setGender("");
    setCarClass("");
  };

  const editEntry = (e)=>{
    if(eventLocked) return alert("Event locked");
    setEditingCar(e.car);
    setCar(e.car);
    setGender(e.gender);
    setCarClass(e.carClass);
    setScreen("score");
  };

  const archiveEvent = ()=>{
    if(!eventLocked) return alert("Lock event first");

    const newEvent = {
      eventName,
      date: new Date().toLocaleString(),
      results: [...entries]
    };

    const updated = [...archive,newEvent];
    setArchive(updated);
    localStorage.setItem("autofestArchive", JSON.stringify(updated));

    alert("Event archived");
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
      <button style={{marginLeft:10}} onClick={()=>editEntry(e)}>Edit</button>
    </div>
  ));

  const board = (title,list)=>(
    <div style={{padding:20}}>
      <h2>{title}</h2>
      {renderList(list)}

      <button style={big} onClick={printResults}>Print</button>
      <button style={{...big,background:"black",color:"#fff"}}
        onClick={()=>setEventLocked(true)}>🔒 Lock Event</button>
      <button style={big} onClick={archiveEvent}>Archive Event</button>
      <button style={big} onClick={()=>setScreen("home")}>Home</button>
    </div>
  );

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
        <button style={big} onClick={()=>setScreen("archive")}>Archived Events</button>
      </div>
    );
  }

  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name" value={eventName}
          onChange={(e)=>setEventName(e.target.value)} />

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

        {/* 🔥 RESTORED SECTIONS */}
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
          {editingCar ? "Save Edit" : "Submit & Next"}
        </button>

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="leader") return board("Leaderboard",sorted);
  if(screen==="top150") return board("Top 150",top150);
  if(screen==="top30") return board("Top 30 Finals",top30);
  if(screen==="female") return board("Female Overall",female);

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

        <button style={big} onClick={printResults}>Print</button>
        <button style={big} onClick={()=>setEventLocked(true)}>Lock</button>
        <button style={big} onClick={archiveEvent}>Archive</button>
        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="archive"){
    return(
      <div style={{padding:20}}>
        <h2>Archived Events</h2>

        {archive.map((e,i)=>(
          <div key={i} style={{marginBottom:20}}>
            <strong>{e.eventName}</strong><br/>
            {e.date}

            <button onClick={()=>alert(JSON.stringify(e.results,null,2))}>
              View
            </button>

            <button onClick={()=>{
              if(!window.confirm("Delete?")) return;
              if(!window.confirm("FINAL WARNING")) return;

              const updated = archive.filter((_,x)=>x!==i);
              setArchive(updated);
              localStorage.setItem("autofestArchive", JSON.stringify(updated));
            }}>
              Delete
            </button>
          </div>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
