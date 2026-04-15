import React, { useState, useEffect, useRef } from "react";

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
  const [eventLocked,setEventLocked] = useState(false);

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [editingCar,setEditingCar] = useState(null);

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  const [saving,setSaving] = useState(false);

  const carInputRef = useRef(null);

  // LOAD / SAVE
  useEffect(()=>{
    const data = localStorage.getItem("autofestData");
    if(data){
      const parsed = JSON.parse(data);
      setEntries(parsed.entries || []);
      setEventName(parsed.eventName || "");
      setJudges(parsed.judges || []);
      setEventLocked(parsed.eventLocked || false);
    }
  },[]);

  useEffect(()=>{
    localStorage.setItem("autofestData", JSON.stringify({
      entries,
      eventName,
      judges,
      eventLocked
    }));
  },[entries,eventName,judges,eventLocked]);

  // START EVENT
  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length === 0) return alert("Add at least 1 judge");

    setJudges(valid);
    setScreen("judge");
  };

  // SUBMIT (SAFE)
  const submit = () => {
    if (saving) return;
    if (eventLocked) return alert("Event is locked");
    if (!car) return alert("Enter entrant number");
    if (!gender) return alert("Select gender");
    if (!carClass) return alert("Select class");

    if (Object.keys(scores).length !== categories.length) {
      return alert("Score all categories");
    }

    setSaving(true);

    const base = Object.values(scores).reduce((a, b) => a + b, 0);
    const tyreScore = (tyres.left ? 5 : 0) + (tyres.right ? 5 : 0);
    const deductionTotal =
      Object.values(deductions).filter((v) => v).length * 10;

    const judgeTotal = base + tyreScore - deductionTotal;

    setEntries((prev) => {
      const index = prev.findIndex(e => e.car === car);

      if (index === -1) {
        return [
          ...prev,
          {
            car,
            gender,
            carClass,
            runs: [
              { judgeScores: { [activeJudge]: judgeTotal } }
            ]
          }
        ];
      }

      const updated = [...prev];
      const entry = { ...updated[index] };
      const runs = [...entry.runs];

      const lastRun = { ...runs[runs.length - 1] };

      if (lastRun.judgeScores[activeJudge] !== undefined) {
        runs.push({
          judgeScores: { [activeJudge]: judgeTotal }
        });
      } else {
        lastRun.judgeScores = {
          ...lastRun.judgeScores,
          [activeJudge]: judgeTotal
        };
        runs[runs.length - 1] = lastRun;
      }

      entry.runs = runs;
      updated[index] = entry;

      return updated;
    });

    // RESET
    setScores({});
    setDeductions({});
    setTyres({ left:false,right:false });
    setCar("");
    setGender("");
    setCarClass("");
    setSaving(false);

    setTimeout(()=>carInputRef.current?.focus(),100);
  };

  // EDIT
  const editEntry = (e)=>{
    setEditingCar(e.car);
    setCar(e.car);
    setGender(e.gender);
    setCarClass(e.carClass);
    setScreen("score");
  };

  const saveEdit = ()=>{
    setEntries(prev =>
      prev.map(e =>
        e.car === editingCar ? { ...e, gender, carClass } : e
      )
    );

    setEditingCar(null);
    setCar("");
    setGender("");
    setCarClass("");
    setScreen("leader");
  };

  // TOTALS
  const calculated = entries.map(e=>{
    let total = 0;
    e.runs.forEach(r=>{
      Object.values(r.judgeScores).forEach(s=>total+=s);
    });
    return { ...e, finalScore: total };
  });

  const sorted = [...calculated].sort((a,b)=>b.finalScore-a.finalScore);

  // UI
  const big={padding:16,margin:6};

  const renderList = list => list.map((e,i)=>(
    <div key={i}>
      #{i+1} | Car {e.car} | {e.gender} | Score {e.finalScore}
      <button onClick={()=>editEntry(e)}>Edit</button>
    </div>
  ));

  // HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🏁 AUTOFEST</h1>

        <button style={big} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={big} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={big} onClick={()=>setScreen("score")}>Resume Judging</button>
        <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
      </div>
    );
  }

  // SETUP
  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
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

        <button onClick={startEvent}>Start Event</button>
      </div>
    );
  }

  // JUDGE
  if(screen==="judge"){
    return(
      <div style={{padding:20}}>
        {judges.map((j,i)=>(
          <button key={i}
            onClick={()=>{setActiveJudge(j);setScreen("score")}}>
            {j}
          </button>
        ))}
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input ref={carInputRef} value={car}
          onChange={(e)=>setCar(e.target.value)} placeholder="Car"/>

        <button onClick={()=>setGender("Male")}>Male</button>
        <button onClick={()=>setGender("Female")}>Female</button>

        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
        ))}

        {categories.map(cat=>(
          <div key={cat}>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                onClick={()=>setScores({...scores,[cat]:i})}>{i}</button>
            ))}
          </div>
        ))}

        <button onClick={editingCar ? saveEdit : submit}>
          {editingCar ? "Save Edit" : "Submit"}
        </button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leader"){
    return(
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {renderList(sorted)}
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
