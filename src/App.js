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

export default function App(){

  const [scores,setScores] = useState({});
  const [activeCat,setActiveCat] = useState("");

  const scoreBtn = {
    width:"36px",
    height:"36px",
    margin:"2px",
    borderRadius:"4px",
    border:"1px solid #ccc",
    fontSize:"12px"
  };

  return(
    <div style={{padding:20}}>

      <input placeholder="Entrant No" style={{padding:10,width:"100%"}} />

      {/* CATEGORY + SCORE ROWS */}
      {categories.map(cat=>(
        <div key={cat.name} style={{marginTop:12}}>

          <div style={{display:"flex", alignItems:"center"}}>

            {/* CATEGORY BUTTON (🔥 SAME SIZE AS SCORE BUTTONS) */}
            <button
              style={{
                ...scoreBtn,
                width:"120px",
                background:activeCat===cat.name ? cat.color : "#eee",
                color:activeCat===cat.name ? "#fff" : "#000",
                fontSize:"11px"
              }}
              onClick={()=>setActiveCat(cat.name)}
            >
              {cat.name}
            </button>

            {/* SCORE BUTTONS */}
            <div style={{display:"flex", flexWrap:"wrap"}}>
              {Array.from({length:21},(_,i)=>(
                <button
                  key={i}
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

    </div>
  );
}
