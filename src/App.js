import React, { useState } from "react";

export default function App() {

  const [screen, setScreen] = useState("home");
  const [boardType, setBoardType] = useState("overall");

  const [events, setEvents] = useState({});
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedJudge, setSelectedJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [results, setResults] = useState([]);

  const [lockedEvents, setLockedEvents] = useState({});

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");
  const [scores, setScores] = useState({});
  const [tyres, setTyres] = useState({ left:false, right:false });
  const [deductions, setDeductions] = useState([]);

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl Open/Rotary"];
  const categories = ["Instant Smoke","Volume of Smoke","Constant Smoke","Driver Skill & Control"];
  const deductionList = ["Reversing","Stopping","Barrier","Fire"];

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"},
    button:{padding:"16px",margin:"6px 0",background:"#2a2a2a",color:"#fff",border:"2px solid #555",width:"100%"},
    smallBtn:{padding:"10px 16px",background:"#2a2a2a",color:"#fff",border:"2px solid #555"},
    active:{background:"#ff2a2a"},
    warn:{background:"#ffcc00",color:"#000"},
    row:{display:"flex",gap:"8px",overflowX:"auto",marginBottom:"10px"},
    scoreRow:{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"10px"},
    scoreBtn:{minWidth:"44px",height:"44px",background:"#2a2a2a",border:"2px solid #666",color:"#fff"},
    input:{padding:"12px",margin:"6px 0",width:"100%",background:"#111",color:"#fff",border:"2px solid #555"},
    label:{marginTop:"10px",marginBottom:"4px"}
  };

  function isValid(){
    return car && gender && carClass && Object.keys(scores).length > 0;
  }

  function createEvent(){
    if(!eventName) return;
    setEvents(prev => ({ ...prev, [eventName]: [] }));
    setSelectedEvent(eventName);
    setEventName("");
  }

  function addJudge(){
    if(!selectedEvent || !newJudge) return;
    if(lockedEvents[selectedEvent]) return alert("Event locked");

    setEvents(prev => ({
      ...prev,
      [selectedEvent]: [...(prev[selectedEvent] || []), newJudge]
    }));
    setNewJudge("");
  }

  function lockEvent(){
    if(!selectedEvent) return;
    setLockedEvents(prev => ({ ...prev, [selectedEvent]: true }));
  }

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev =>
      prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
    );
  }

  function toggleTyre(side){
    setTyres(prev => ({ ...prev, [side]: !prev[side] }));
  }

  function totalScore(){
    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreBonus = (tyres.left?5:0)+(tyres.right?5:0);
    return base + tyreBonus - deductions.length*10;
  }

  function submitScore(){
    if(!isValid()){
      alert("Please complete all required fields");
      return;
    }

    setResults(prev=>[
      ...prev,
      {
        event:selectedEvent,
        car,
        gender,
        carClass,
        total: totalScore(),
        deductions
      }
    ]);

    setCar(""); setGender(""); setCarClass("");
    setScores({}); setTyres({left:false,right:false}); setDeductions([]);
  }

  function combineScores(list){
    const grouped={};
    list.forEach(r=>{
      if(!grouped[r.car]) grouped[r.car]={...r, totals:[]};
      grouped[r.car].totals.push(r.total);
    });

    return Object.values(grouped).map(g=>{
      const avg=g.totals.reduce((a,b)=>a+b,0)/g.totals.length;
      return {...g,total:Math.round(avg)};
    });
  }

  function sort(list){
    return [...list].sort((a,b)=>b.total-a.total);
  }

  function getEventResults(){
    return results.filter(r=>r.event===selectedEvent);
  }

  function printPage(){ window.print(); }

  // HOME
  if(screen==="home"){
    return(
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={{padding:"32px",marginBottom:"12px",background:"#ff2a2a",color:"#fff",fontSize:"22px",fontWeight:"bold",border:"2px solid #ff0000",width:"100%"}}
        onClick={()=>setScreen("score")}>
          SCORE SHEET<br/>
          {selectedEvent || "NO EVENT"}<br/>
          {selectedJudge || "NO JUDGE"}
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>Event / Judge Login</button>
        <button style={styles.button} onClick={()=>setScreen("score")}>Resume Judging</button>

        <button style={styles.button} onClick={()=>{setBoardType("overall");setScreen("leaderboard");}}>Leaderboard</button>
        <button style={styles.button} onClick={()=>{setBoardType("class");setScreen("leaderboard");}}>Class Leaderboard</button>
        <button style={styles.button} onClick={()=>{setBoardType("female");setScreen("leaderboard");}}>Female Overall</button>

        <button style={styles.button} onClick={()=>{setBoardType("top150");setScreen("leaderboard");}}>Top 150</button>
        <button style={styles.button} onClick={()=>{setBoardType("top30");setScreen("leaderboard");}}>Top 30 Finals</button>
      </div>
    );
  }

  // JUDGE
  if(screen==="judge"){
    return(
      <div style={styles.container}>
        <input style={styles.input} value={eventName} onChange={(e)=>setEventName(e.target.value)} placeholder="Event Name"/>
        <button style={styles.button} onClick={createEvent}>Save Event</button>

        {Object.keys(events).map(e=>(
          <button key={e} style={styles.button} onClick={()=>setSelectedEvent(e)}>
            {e} {lockedEvents[e] ? "🔒" : ""}
          </button>
        ))}

        <input style={styles.input} value={newJudge} onChange={(e)=>setNewJudge(e.target.value)} placeholder="Judge Name"/>
        <button style={styles.button} onClick={addJudge}>Add Judge</button>

        {events[selectedEvent]?.map(j=>(
          <button key={j} style={styles.button} onClick={()=>{ setSelectedJudge(j); setScreen("score"); }}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={lockEvent}>Lock Event</button>
        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD (unchanged working)
  if(screen==="leaderboard"){
    let data = combineScores(getEventResults());

    return(
      <div style={styles.container}>
        <h2>{boardType} Leaderboard</h2>

        <button style={styles.button} onClick={printPage}>Print</button>

        {sort(data).map((r,i)=>{
          const d = r.deductions.length ? ` - ${r.deductions.join(", ")}` : "";
          return(
            <div key={i}>
              #{i+1} | {r.car} {r.gender} | {r.carClass}{d} ={r.total}
            </div>
          );
        })}

        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={styles.container}>
        <h2>{selectedEvent}</h2>
        <h3>{selectedJudge}</h3>

        <input
          style={{...styles.input, ...(car ? {} : styles.warn)}}
          value={car}
          onChange={(e)=>setCar(e.target.value)}
          placeholder="Car No / Rego"
        />

        <div style={styles.row}>
          <button style={{...styles.smallBtn,...(gender==="M"?styles.active:(!gender?styles.warn:{}))}} onClick={()=>setGender("M")}>Male</button>
          <button style={{...styles.smallBtn,...(gender==="F"?styles.active:(!gender?styles.warn:{}))}} onClick={()=>setGender("F")}>Female</button>
        </div>

        <div style={styles.row}>
          {classes.map(c=>(
            <button key={c}
              style={{...styles.smallBtn,...(carClass===c?styles.active:(!carClass?styles.warn:{}))}}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <div style={styles.label}>{cat}</div>
            <div style={styles.scoreRow}>
              {[...Array(20)].map((_,i)=>(
                <button key={i}
                  style={{
                    ...styles.scoreBtn,
                    ...(scores[cat]===i+1?styles.active:(!scores[cat]?styles.warn:{}))
                  }}
                  onClick={()=>setScore(cat,i+1)}>
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        ))}

        <h2>Total: {totalScore()}</h2>

        <button style={styles.button} onClick={submitScore}>Submit</button>
        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
