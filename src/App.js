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
  const [archive,setArchive] = useState([]);

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

    const storedArchive = localStorage.getItem("autofestArchive");
    if(storedArchive){
      setArchive(JSON.parse(storedArchive));
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

  // 🚫 DUPLICATE PROTECTION
  const checkDuplicate = () => {
    const exists = entries.find(e => e.car === car);
    if(exists && !editingCar){
      return window.confirm("Car already exists. Add another run?");
    }
    return true;
  };

  // SUBMIT
  const submit = () => {
    if (saving) return;
    if (eventLocked) return alert("Event is locked");
    if (!car) return alert("Enter entrant number");
    if (!gender) return alert("Select gender");
    if (!carClass) return alert("Select class");

    if (!checkDuplicate()) return;

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
      const existing = prev.find((e) => e.car === car);

      if (!existing) {
        return [
          ...prev,
          {
            car,
            gender,
            carClass,
            runs: [
              {
                judgeScores: {
                  [activeJudge]: judgeTotal
                }
              }
            ]
          }
        ];
      }

      // PRESERVE DATA
      existing.gender = existing.gender || gender;
      existing.carClass = existing.carClass || carClass;

      const lastRun = existing.runs[existing.runs.length - 1];

      if (lastRun.judgeScores[activeJudge] !== undefined) {
        existing.runs.push({
          judgeScores: {
            [activeJudge]: judgeTotal
          }
        });
      } else {
        lastRun.judgeScores[activeJudge] = judgeTotal;
      }

      return [...prev];
    });

    // RESET
    setScores({});
    setDeductions({});
    setTyres({ left: false, right: false });
    setCar("");
    setGender("");
    setCarClass("");
    setSaving(false);

    window.scrollTo(0,0);

    setTimeout(()=>{
      if(carInputRef.current){
        carInputRef.current.focus();
      }
    },100);
  };

  // ✏️ EDIT ENTRY
  const editEntry = (entry) => {
    if(eventLocked) return alert("Event locked");

    setEditingCar(entry.car);
    setCar(entry.car);
    setGender(entry.gender);
    setCarClass(entry.carClass);
    setScreen("score");
  };

  // 💾 SAVE EDIT
  const saveEdit = () => {
    setEntries(prev =>
      prev.map(e =>
        e.car === editingCar
          ? { ...e, gender, carClass }
          : e
      )
    );

    setEditingCar(null);
    setCar("");
    setGender("");
    setCarClass("");
    setScreen("leader");
  };

  // TOTALS
  const calculated = entries.map((e) => {
    let total = 0;
    e.runs.forEach((run) => {
      Object.values(run.judgeScores).forEach((score) => {
        total += score;
      });
    });
    return { ...e, finalScore: total };
  });

  const sorted = [...calculated].sort((a,b)=>b.finalScore-a.finalScore);

  const top150 = sorted.slice(0,150);
  const top30 = top150.slice(0,30);
  const female = sorted.filter(e=>e.gender==="Female");

  const grouped = {};
  sorted.forEach(e=>{
    if(!grouped[e.carClass]) grouped[e.carClass]=[];
    grouped[e.carClass].push(e);
  });

  const big={padding:18,margin:10,width:"100%",fontSize:18};
  const btn={padding:10,margin:4};

  const renderList = (list)=>list.map((e,i)=>(
    <div key={i}>
      #{i+1} | Car {e.car} | {e.gender} | Score {e.finalScore}
      <button style={btn} onClick={()=>editEntry(e)}>Edit</button>
    </div>
  ));

  const archiveEvent = () => {
    if(!eventLocked) return alert("Lock event first");

    const newEvent = {
      eventName,
      date: new Date().toLocaleString(),
      results: sorted
    };

    const updated = [...archive, newEvent];
    setArchive(updated);
    localStorage.setItem("autofestArchive", JSON.stringify(updated));
    alert("Event archived");
  };

  // SCREENS

  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>AUTOFEST</h1>
        <button style={big} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={big} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={big} onClick={()=>setScreen("archive")}>Archive</button>
      </div>
    );
  }

  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <input placeholder="Event Name" onChange={(e)=>setEventName(e.target.value)}/>
        {judges.map((j,i)=>(
          <input key={i} placeholder={`Judge ${i+1}`}
            onChange={(e)=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}/>
        ))}
        <button onClick={startEvent}>Start</button>
      </div>
    );
  }

  if(screen==="judge"){
    return(
      <div style={{padding:20}}>
        {judges.map((j,i)=>(
          <button key={i} onClick={()=>{setActiveJudge(j);setScreen("score")}}>
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

        <input ref={carInputRef} value={car} onChange={(e)=>setCar(e.target.value)} placeholder="Car"/>

        <button onClick={()=>setGender("Male")}>Male</button>
        <button onClick={()=>setGender("Female")}>Female</button>

        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
        ))}

        {categories.map(cat=>(
          <div key={cat}>
            {Array.from({length:21},(_,i)=>(
              <button key={i} onClick={()=>setScores({...scores,[cat]:i})}>{i}</button>
            ))}
          </div>
        ))}

        <button onClick={submit}>
          {editingCar ? "Save Edit" : "Submit"}
        </button>

        {editingCar && <button onClick={saveEdit}>Confirm Edit</button>}
      </div>
    );
  }

  if(screen==="leader"){
    return(
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {renderList(sorted)}

        <button onClick={printResults}>Print</button>
        <button onClick={()=>setEventLocked(true)}>Lock</button>
        <button onClick={archiveEvent}>Archive</button>
      </div>
    );
  }

  if(screen==="archive"){
    return(
      <div style={{padding:20}}>
        {archive.map((e,i)=>(
          <div key={i}>
            {e.eventName}
            <button onClick={()=>{
              if(!window.confirm("Delete?")) return;
              if(!window.confirm("FINAL WARNING")) return;

              const updated = archive.filter((_,x)=>x!==i);
              setArchive(updated);
              localStorage.setItem("autofestArchive", JSON.stringify(updated));
            }}>Delete</button>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
