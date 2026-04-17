import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

// 🔥 YOUR FIREBASE CONFIG (keep yours)
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
  const [rego,setRego] = useState("");
  const [carName,setCarName] = useState("");

  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  // 🔥 REAL-TIME FIREBASE (FIXED)
  useEffect(function(){
    const unsub = onSnapshot(collection(db,"scores"), function(snapshot){
      var d = snapshot.docs.map(function(doc){
        return doc.data();
      });
      setData(d);
    });

    return () => unsub();
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

    var total = Object.values(scores).reduce((a,b)=>a+b,0);

    var deductionCount = Object.values(deductions).filter(v=>v).length;
    var finalScore = total - (deductionCount * 10);

    var payload = {
      judge,
      car,
      driver,
      rego,
      carName,
      gender,
      carClass,
      finalScore,
      timestamp: Date.now()
    };

    // SAVE TO FIREBASE
    addDoc(collection(db,"scores"), payload);

    // CLEAR (FIXED)
    setScores({});
    setDeductions({});
    setCar("");
    setDriver("");
    setRego("");
    setCarName("");
    setGender("");
    setCarClass("");
  }

  // 🔥 COMBINE ALL JUDGES
  function combineScores(){
    var combined = {};

    data.forEach(function(entry){

      var key = entry.car + "_" + entry.driver;

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

  // 🔥 TOP 150
  function buildTop150(){
    var sorted = combineScores()
      .sort((a,b)=>b.total-a.total)
      .slice(0,150);

    setScreen("top150");
    setTop(sorted);
  }

  const [top,setTop] = useState([]);

  // GROUP BY CLASS + GENDER
  var grouped = {};
  combineScores().forEach(function(e){
    var key = (e.carClass || "Unknown") + " - " + (e.gender || "Unknown");

    if(!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  Object.keys(grouped).forEach(function(k){
    grouped[k].sort((a,b)=>b.total-a.total);
  });

  // SCREENS

  if(screen === "judgeSelect"){
    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {[1,2,3,4,5,6].map(j => (
          <div key={j}>
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

        {top.map((e,i)=>(
          <div key={i}>
            #{i+1} | {e.car} | {e.driver} | {e.total}
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
                #{i+1} | {e.car} | {e.driver} | {e.total}
              </div>
            ))}
          </div>
        ))}

        <button onClick={()=>setScreen("judge")}>Back</button>
      </div>
    );
  }

  return (
    <div style={{padding:20}}>

      <h2>Judge {judge}</h2>

      <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
      <input placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input placeholder="Rego" value={rego} onChange={e=>setRego(e.target.value)} />
      <input placeholder="Car Name" value={carName} onChange={e=>setCarName(e.target.value)} />

      <div>
        <button onClick={()=>setGender("Male")}>Male</button>
        <button onClick={()=>setGender("Female")}>Female</button>
      </div>

      <div>
        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}
      </div>

      {categories.map(cat=>(
        <div key={cat}>
          <h4>{cat}</h4>
          {Array.from({length:21},(_,i)=>(
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      <div>
        <h4>Deductions</h4>
        {deductionsList.map(d=>(
          <button key={d} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      <button onClick={submit}>Submit</button>
      <button onClick={buildTop150}>Top 150</button>
      <button onClick={()=>setScreen("leaderboard")}>Leaderboard</button>

    </div>
  );
}
