import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const classes = [
  "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4Cyl Open/Rotary"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");
  const [entries,setEntries] = useState([]);

  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [rego,setRego] = useState("");
  const [carName,setCarName] = useState("");

  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  // 🔥 LIVE SYNC
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"),(snapshot)=>{
      const list = snapshot.docs.map(doc=>doc.data());
      setEntries(list);
    });
    return ()=>unsub();
  },[]);

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev=>({...prev,[d]:!prev[d]}));
  }

  function toggleTyre(side){
    setTyres(prev=>({...prev,[side]:!prev[side]}));
  }

  async function submit(){

    if(!car && !driver && !rego && !carName){
      alert("Enter competitor");
      return;
    }

    if(Object.keys(scores).length === 0){
      alert("Add scores");
      return;
    }

    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;
    const total = Object.values(scores).reduce((a,b)=>a+b,0);

    const finalScore = total + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      car, driver, rego, carName,
      gender, carClass,
      finalScore,
      time: Date.now()
    });

    // RESET
    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar(""); setDriver(""); setRego(""); setCarName("");
    setGender(""); setCarClass("");
  }

  const sorted = [...entries].sort((a,b)=>b.finalScore - a.finalScore);

  const top150 = sorted.slice(0,150);
  const top30 = sorted.slice(0,30);

  // 🏆 CLASS WINNERS
  const classWinners = {};
  sorted.forEach(e=>{
    if(!classWinners[e.carClass]){
      classWinners[e.carClass] = e;
    }
  });

  const btn = {padding:12,margin:6};
  const active = {padding:12,margin:6,background:"red",color:"#fff"};
  const big = {padding:16,margin:10,background:"#000",color:"#fff"};
  const row = {marginBottom:20};

  // HOME
  if(screen==="home"){
    return (
      <div style={{textAlign:"center",marginTop:100}}>
        <h1>AutoFest Burnout Champs</h1>

        <button style={big} onClick={()=>setScreen("score")}>Start Judging</button>
        <button style={big} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={big} onClick={()=>setScreen("top30")}>Top 30 Finals</button>
        <button style={big} onClick={()=>setScreen("classes")}>Class Winners</button>
      </div>
    );
  }

  // TOP150
  if(screen==="top150"){
    return (
      <div style={{padding:20}}>
        <h2>Top 150</h2>

        {top150.map((e,i)=>(
          <div key={i} style={row}>
            #{i+1} | Car {e.car} | {e.carClass} | {e.gender} | {e.finalScore}
          </div>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // TOP30
  if(screen==="top30"){
    return (
      <div style={{padding:20}}>
        <h2>Top 30 Finals</h2>

        {top30.map((e,i)=>(
          <div key={i} style={row}>
            #{i+1} | Car {e.car} | {e.finalScore}
          </div>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // CLASS WINNERS
  if(screen==="classes"){
    return (
      <div style={{padding:20}}>
        <h2>Class Winners</h2>

        {Object.keys(classWinners).map(c=>(
          <div key={c} style={row}>
            🏆 {c} → Car {classWinners[c].car} ({classWinners[c].finalScore})
          </div>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORING
  return (
    <div style={{padding:20}}>

      <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
      <input placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input placeholder="Rego" value={rego} onChange={e=>setRego(e.target.value)} />
      <input placeholder="Car Name" value={carName} onChange={e=>setCarName(e.target.value)} />

      <div style={row}>
        <button style={gender==="Male"?active:btn} onClick={()=>setGender("Male")}>Male</button>
        <button style={gender==="Female"?active:btn} onClick={()=>setGender("Female")}>Female</button>
      </div>

      <div style={row}>
        {classes.map(c=>(
          <button key={c} style={carClass===c?active:btn} onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}
      </div>

      {categories.map(cat=>(
        <div key={cat} style={row}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i} style={scores[cat]===i?active:btn} onClick={()=>setScore(cat,i)}>
              {i}
            </button>
          ))}
        </div>
      ))}

      <div style={row}>
        <strong>Blown Tyres</strong><br/>
        <button style={tyres.left?active:btn} onClick={()=>toggleTyre("left")}>Left</button>
        <button style={tyres.right?active:btn} onClick={()=>toggleTyre("right")}>Right</button>
      </div>

      <div style={row}>
        <strong>Deductions</strong><br/>
        {deductionsList.map(d=>(
          <button key={d} style={deductions[d]?active:btn} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      <button style={big} onClick={submit}>Submit</button>
      <button style={big} onClick={()=>setScreen("home")}>Home</button>

    </div>
  );
}
