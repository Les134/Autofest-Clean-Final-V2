import React, { useState } from "react";

const categories = [
  { name:"Instant Smoke", color:"#ff3c00" },
  { name:"Volume of Smoke", color:"#0099ff" },
  { name:"Constant Smoke", color:"#ffaa00" },
  { name:"Driver Skill & Control", color:"#00cc66" }
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

  const bigBtn = {
    width:"100%", padding:"16px", margin:"6px 0",
    fontSize:"18px", borderRadius:"6px"
  };

  const scoreBtn = {
    width:"36px", height:"36px", margin:"2px",
    borderRadius:"4px", border:"1px solid #ccc",
    fontSize:"12px"
  };

  const submit = ()=>{
    if(!car || !gender || !carClass){
      return alert("Complete all fields");
    }

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;

    const finalScore = base + tyreScore - deductionTotal;

    const entry = { car, gender, carClass, finalScore };

    setEntries(prev => [...prev, entry]);

    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar("");
    setGender("");
    setCarClass("");
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore-a.finalScore);

  const grouped = {};
  sorted.forEach(e=>{
    if(!grouped[e.carClass]) grouped[e.carClass]=[];
    grouped[e.carClass].push(e);
  });

  const renderList = (list)=>list.map((e,i)=>(
    <div key={i} style={{
      padding:"10px",
      marginBottom:"6px",
      background:i===0?"#ff3c00":"#1a1a1a",
      color:"#fff"
    }}>
      #{i+1} | Car {e.car} | {e.gender} | {e.carClass} | Score {e.finalScore}
    </div>
  ));

  // HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={bigBtn} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={bigBtn} onClick={()=>setScreen("judge")}>Judge Login</button>

        <h3>Scoreboards</h3>
        <button style={bigBtn} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={bigBtn} onClick={()=>setScreen("class")}>Class Leaderboard</button>
        <button style={bigBtn} onClick={()=>setScreen("female")}>Female Overall</button>

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

        <button style={bigBtn} onClick={()=>setScreen("judge")}>Start Event</button>
      </div>
    );
  }

  // JUDGE
  if(screen==="judge"){
    return(
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i} style={bigBtn}
            onClick={()=>{setActiveJudge(j);setScreen("score")}}>
            {j}
          </button>
        ))}
      </div>
    );
  }

  // SCORE (🔥 FIXED LIKE YOUR PHOTO)
  if(screen==="score"){
    return(
      <div style={{padding:20}}>

        <input value={car}
          onChange={(e)=>setCar(e.target.value)}
          placeholder="Entrant No"
          style={{width:"100%",padding:10}}
        />

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
          <div key={cat.name} style={{marginTop:10}}>
            <div style={{display:"flex", alignItems:"center"}}>

              <button style={{
                ...scoreBtn,
                width:"120px",
                background:"#eee"
              }}>
                {cat.name}
              </button>

              <div style={{display:"flex",flexWrap:"wrap"}}>
                {Array.from({length:21},(_,i)=>(
                  <button key={i}
                    style={{
                      ...scoreBtn,
                      background:scores[cat.name]===i ? cat.color : "#eee",
                      color:scores[cat.name]===i ? "#fff" : "#000"
                    }}
                    onClick={()=>setScores({...scores,[cat.name]:i})}
                  >
                    {i}
                  </button>
                ))}
              </div>

            </div>
          </div>
        ))}

        <button style={bigBtn} onClick={submit}>Submit Score</button>

        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="leader"){
    return <div style={{padding:20}}><h2>Leaderboard</h2>{renderList(sorted)}</div>;
  }

  if(screen==="female"){
    const female = sorted.filter(e=>e.gender==="Female");
    return <div style={{padding:20}}><h2>Female</h2>{renderList(female)}</div>;
  }

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
