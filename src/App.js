import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, where, getDocs, deleteDoc } from "firebase/firestore";

// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CONFIG
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

  const [screen,setScreen] = useState("cover");
  const [entries,setEntries] = useState([]);

  const [eventName,setEventName] = useState("");
  const [judge,setJudge] = useState("");

  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [rego,setRego] = useState("");
  const [carName,setCarName] = useState("");

  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  // 🔥 LIVE FILTERED BY EVENT
  useEffect(()=>{
    if(!eventName) return;

    const q = query(collection(db,"scores"), where("eventName","==",eventName));

    const unsub = onSnapshot(q,(snapshot)=>{
      const list = snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      setEntries(list);
    });

    return ()=>unsub();
  },[eventName]);

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

    if(!eventName || !judge){
      alert("Event + Judge required");
      return;
    }

    if(!car && !driver && !rego && !carName){
      alert("Enter competitor");
      return;
    }

    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;
    const total = Object.values(scores).reduce((a,b)=>a+b,0);

    const finalScore = total + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      eventName,
      judge,
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

  // EXPORT CSV
  function exportCSV(){
    let rows = entries.map(e =>
      `${e.car},${e.driver},${e.rego},${e.carClass},${e.gender},${e.finalScore}`
    );

    const csv = "Car,Driver,Rego,Class,Gender,Score\n" + rows.join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = eventName + "_results.csv";
    a.click();
  }

  // ADMIN RESET
  async function resetEvent(){
    const q = query(collection(db,"scores"), where("eventName","==",eventName));
    const snap = await getDocs(q);

    snap.forEach(doc=>{
      deleteDoc(doc.ref);
    });

    alert("Event reset");
  }

  const sorted = [...entries].sort((a,b)=>b.finalScore - a.finalScore);
  const top150 = sorted.slice(0,150);
  const top30 = sorted.slice(0,30);

  // COVER
  if(screen==="cover"){
    return (
      <div style={{background:"#000",height:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
        <img src="/logo.png" style={{width:"80%"}} />
        <button onClick={()=>setScreen("login")}>ENTER</button>
      </div>
    );
  }

  // LOGIN
  if(screen==="login"){
    return (
      <div style={{padding:20}}>
        <input placeholder="Event Name" value={eventName} onChange={e=>setEventName(e.target.value)} />

        {[1,2,3,4,5,6].map(j=>(
          <button key={j} onClick={()=>{setJudge("Judge "+j);setScreen("score")}}>
            Judge {j}
          </button>
        ))}
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leader"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {sorted.map((e,i)=>(
          <div key={i}>
            #{i+1} - {e.car} ({e.finalScore})
          </div>
        ))}

        <button onClick={()=>setScreen("score")}>Back</button>
      </div>
    );
  }

  // ADMIN
  if(screen==="admin"){
    return (
      <div style={{padding:20}}>
        <h2>Admin Panel</h2>

        <button onClick={exportCSV}>Export Results</button>
        <button onClick={resetEvent}>Reset Event</button>
        <button onClick={()=>setScreen("leader")}>View Leaderboard</button>
      </div>
    );
  }

  // SCORING
  return (
    <div style={{padding:20}}>

      <h3>{eventName} | {judge}</h3>

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
          <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
        ))}
      </div>

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      <button onClick={submit}>Submit</button>
      <button onClick={()=>setScreen("leader")}>Leaderboard</button>
      <button onClick={()=>setScreen("admin")}>Admin</button>

    </div>
  );
}
