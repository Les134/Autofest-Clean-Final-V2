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

export default function App(){

  const [screen,setScreen] = useState("home");
  const [entries,setEntries] = useState([]);

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [scores,setScores] = useState({});

  const scoreBtn = {
    width:"38px",
    height:"38px",
    margin:"2px",
    borderRadius:"5px",
    border:"1px solid #bbb",
    fontSize:"13px"
  };

  const classBtn = {
    padding:"8px 12px",
    margin:"4px",
    borderRadius:"5px",
    border:"1px solid #bbb"
  };

  const genderBtn = {
    padding:"8px 16px",
    margin:"4px",
    borderRadius:"5px",
    border:"1px solid #bbb"
  };

  const bigBtn = {
    width:"100%",
    padding:"16px",
    margin:"6px 0",
    fontSize:"18px"
  };

  const submit = ()=>{
    if(!car) return alert("Enter entrant");

    const total = Object.values(scores).reduce((a,b)=>a+b,0);

    setEntries(prev => [...prev, {
      car, gender, carClass, finalScore: total
    }]);

    setScores({});
    setCar("");
    setGender("");
    setCarClass("");
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore-a.finalScore);
  const top150 = sorted.slice(0,150);
  const top30 = sorted.slice(0,30);

  const renderList = (list)=>list.map((e,i)=>(
    <div key={i} style={{
      padding:"10px",
      marginBottom:"5px",
      background:i===0?"#ff3c00":"#1a1a1a",
      color:"#fff"
    }}>
      #{i+1} | Car {e.car} | {e.carClass} | Score {e.finalScore}
    </div>
  ));

  // HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={bigBtn} onClick={()=>setScreen("score")}>Return to Score Sheet</button>

        <button style={bigBtn} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={bigBtn} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={bigBtn} onClick={()=>setScreen("top30")}>Top 30</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={{padding:20}}>

        <input
          value={car}
          onChange={(e)=>setCar(e.target.value)}
          placeholder="Entrant No"
          style={{width:"100%",padding:"10px",marginBottom:"10px"}}
        />

        {/* GENDER */}
        <div>
          <button
            style={{
              ...genderBtn,
              background: gender==="Male" ? "#00cc66" : "#eee",
              color: gender==="Male" ? "#fff" : "#000"
            }}
            onClick={()=>setGender("Male")}
          >
            Male
          </button>

          <button
            style={{
              ...genderBtn,
              background: gender==="Female" ? "#007bff" : "#eee",
              color: gender==="Female" ? "#fff" : "#000"
            }}
            onClick={()=>setGender("Female")}
          >
            Female
          </button>
        </div>

        {/* CLASS */}
        <div>
          {classes.map(c=>(
            <button key={c}
              style={{
                ...classBtn,
                background: carClass===c ? "#333" : "#eee",
                color: carClass===c ? "#fff" : "#000"
              }}
              onClick={()=>setCarClass(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* SCORES */}
        {categories.map(cat=>(
          <div key={cat} style={{marginTop:"10px"}}>
            <div style={{display:"flex",alignItems:"center"}}>

              <div style={{width:"150px",fontSize:"13px"}}>
                {cat}
              </div>

              <div style={{display:"flex",flexWrap:"nowrap"}}>
                {Array.from({length:21},(_,i)=>(
                  <button key={i}
                    style={{
                      ...scoreBtn,
                      background: scores[cat]===i ? "#ff0000" : "#eee",
                      color: scores[cat]===i ? "#fff" : "#000"
                    }}
                    onClick={()=>setScores({...scores,[cat]:i})}
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

  // LEADERBOARD
  if(screen==="leader"){
    return(
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {renderList(sorted)}
        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="top150"){
    return(
      <div style={{padding:20}}>
        <h2>Top 150</h2>
        {renderList(top150)}
        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="top30"){
    return(
      <div style={{padding:20}}>
        <h2>Top 30</h2>
        {renderList(top30)}
        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
