import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

// FIREBASE CONFIG (KEEP YOURS)
const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CONFIG
const categories = ["Smoke","Commitment","Style","Control","Entertainment"];
const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("judgeSelect");
  const [judge,setJudge] = useState("");

  const [judgeNames,setJudgeNames] = useState({
    1:"Judge 1",2:"Judge 2",3:"Judge 3",
    4:"Judge 4",5:"Judge 5",6:"Judge 6"
  });

  const [data,setData] = useState([]);

  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  // 🔥 REAL-TIME FIREBASE
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"), (snapshot)=>{
      const d = snapshot.docs.map(doc => doc.data());
      setData(d);
    });
    return ()=>unsub();
  },[]);

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  function submit(){

    if(Object.keys(scores).length === 0){
      alert("Add scores first");
      return;
    }

    const total = Object.values(scores).reduce((a,b)=>a+b,0);
    const deductionCount = Object.values(deductions).filter(v=>v).length;
    const finalScore = total - (deductionCount * 10);

    const payload = {
      judge,
      car,
      driver,
      gender,
      carClass,
      finalScore,
      timestamp: Date.now()
    };

    addDoc(collection(db,"scores"), payload);

    // CLEAR ENTRANT
    setScores({});
    setDeductions({});
    setCar("");
    setDriver("");
    setGender("");
    setCarClass("");
  }

  // COMBINE SCORES
  function combineScores(){
    const combined = {};

    data.forEach(entry=>{
      const key = entry.car + "_" + entry.driver;

      if(!combined[key]){
        combined[key] = {
          car: entry.car,
          driver: entry.driver,
          carClass: entry.carClass,
          gender: entry.gender,
          total: 0
        };
      }

      combined[key].total += entry.finalScore;
    });

    return Object.values(combined);
  }

  const combinedData = combineScores();

  const top150 = combinedData
    .sort((a,b)=>b.total-a.total)
    .slice(0,150);

  const grouped = {};
  combinedData.forEach(e=>{
    const key = (e.carClass || "Unknown") + " - " + (e.gender || "Unknown");

    if(!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  Object.keys(grouped).forEach(k=>{
    grouped[k].sort((a,b)=>b.total-a.total);
  });

  // ---------------- SCREENS ----------------

  if(screen === "judgeSelect"){
    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {[1,2,3,4,5,6].map(j=>(
          <div key={j} style={{marginBottom:10}}>
            <input
              value={judgeNames[j]}
              onChange={e=>{
                const updated={...judgeNames};
                updated[j]=e.target.value;
                setJudgeNames(updated);
              }}
            />

            <button onClick={()=>{
              setJudge(j);
              setScreen("judge");
            }}>
              {judgeNames[j]}
            </button>
          </div>
        ))}
      </div>
    );
  }

  if(screen === "top150"){
    return (
      <div style={{padding:20}}>
        <h2>TOP 150</h2>

        {top150.map((e,i)=>(
          <div key={i}>
            #{i+1} | {e.car} / {e.driver} - {e.total}
          </div>
        ))}

        <button onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
        <button onClick={()=>setScreen("judge")}>Back</button>
      </div>
    );
  }

  if(screen === "leaderboard"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {Object.keys(grouped).map(group=>(
          <div key={group}>
            <h3>{group}</h3>

            {grouped[group].map((e,i)=>(
              <div key={i}>
                #{i+1} | {e.car} / {e.driver} - {e.total}
              </div>
            ))}
          </div>
        ))}

        <button onClick={()=>setScreen("judge")}>Back</button>
      </div>
    );
  }

  // ---------------- SCORE SCREEN ----------------

  return (
    <div style={{padding:20, background:"#111", color:"#fff"}}>

      <h2 style={{fontSize:26}}>
        JUDGE {judge} - {judgeNames[judge]}
      </h2>

      {/* ENTRANT */}
      <div style={{background:"#222", padding:15, marginBottom:15}}>
        <input style={input} placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
        <input style={input} placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />
      </div>

      {/* CLASS */}
      <div style={{marginBottom:10}}>
        {classes.map(c=>(
          <button key={c}
            onClick={()=>setCarClass(c)}
            style={carClass===c?btnBlue:btn}>
            {c}
          </button>
        ))}
      </div>

      {/* GENDER */}
      <div style={{marginBottom:20}}>
        <button onClick={()=>setGender("Male")} style={gender==="Male"?btnGreen:btn}>Male</button>
        <button onClick={()=>setGender("Female")} style={gender==="Female"?btnGreen:btn}>Female</button>
      </div>

      {/* SCORES */}
      {categories.map(cat=>(
        <div key={cat} style={{marginBottom:15}}>
          <strong>{cat}</strong>
          <div style={{display:"flex", flexWrap:"wrap"}}>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                onClick={()=>setScore(cat,i)}
                style={scores[cat]===i?btnRed:btn}>
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* DEDUCTIONS */}
      <div style={{marginTop:20}}>
        <strong>Deductions</strong><br/>
        {deductionsList.map(d=>(
          <button key={d}
            onClick={()=>toggleDeduction(d)}
            style={deductions[d]?btnRed:btn}>
            {d}
          </button>
        ))}
      </div>

      {/* ACTIONS */}
      <div style={{marginTop:20}}>
        <button style={btnBig} onClick={submit}>Submit</button>
        <button style={btnBig} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={btnBig} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
      </div>

    </div>
  );
}

// STYLES
const input = {padding:"14px", margin:"6px", width:"95%"};
const btn = {padding:"10px", margin:"4px"};
const btnRed = {...btn, background:"red", color:"#fff"};
const btnBlue = {...btn, background:"blue", color:"#fff"};
const btnGreen = {...btn, background:"green", color:"#fff"};
const btnBig = {padding:"16px", margin:"8px", background:"#000", color:"#fff"}
