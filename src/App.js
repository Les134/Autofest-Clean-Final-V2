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

export default function App(){

  const [screen,setScreen] = useState("setup");
  const [entries,setEntries] = useState([]);
  const [saving,setSaving] = useState(false);
  const [savedFlash,setSavedFlash] = useState(false);

  const [eventName,setEventName] = useState("");
  const [judgeName,setJudgeName] = useState("");

  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [rego,setRego] = useState("");
  const [carName,setCarName] = useState("");

  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});
  const [deductions,setDeductions] = useState({});

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"),(snap)=>{
      setEntries(snap.docs.map(doc=>doc.data()));
    });
    return ()=>unsub();
  },[]);

  const setScore = (cat,val)=> setScores({...scores,[cat]:val});

  const submit = async ()=>{

    if(saving) return;
    setSaving(true);

    if(!eventName || !judgeName){
      alert("Enter event + judge name");
      setSaving(false);
      return;
    }

    if(!car && !driver && !rego && !carName){
      alert("Enter competitor");
      setSaving(false);
      return;
    }

    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const deductionTotal = Object.values(deductions).filter(v=>v).length*10;
    const baseScore = Object.values(scores).reduce((a,b)=>a+b,0);

    const finalScore = baseScore + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      eventName,
      judgeName,
      car, driver, rego, carName,
      gender, carClass,
      finalScore,
      time: Date.now()
    });

    // RESET
    setScores({});
    setTyres({left:false,right:false});
    setDeductions({});
    setCar(""); setDriver(""); setRego(""); setCarName("");
    setGender(""); setCarClass("");

    setSavedFlash(true);
    setTimeout(()=>setSavedFlash(false),800);

    setSaving(false);
  };

  const sorted = [...entries].sort((a,b)=>b.finalScore - a.finalScore);
  const top30 = sorted.slice(0,30);

  // GROUPED LEADERBOARD
  const grouped = {};
  sorted.forEach(e=>{
    const key = `${e.carClass} - ${e.gender}`;
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(e);
  });

  // SETUP SCREEN
  if(screen==="setup"){
    return (
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name" value={eventName} onChange={e=>setEventName(e.target.value)} />
        <input placeholder="Judge Name" value={judgeName} onChange={e=>setJudgeName(e.target.value)} />

        <button onClick={()=>setScreen("score")}>Start Judging</button>
      </div>
    );
  }

  // TOP 30 FINALS
  if(screen==="finals"){
    return (
      <div style={{padding:20}}>
        <h2>Top 30 Finals</h2>

        {top30.map((e,i)=>(
          <div key={i}>#{i+1} | Car {e.car} | {e.finalScore}</div>
        ))}

        <button onClick={()=>setScreen("score")}>Back</button>
      </div>
    );
  }

  // MAIN
  return (
    <div style={{padding:20}}>

      <h3>{eventName} | {judgeName}</h3>

      {savedFlash && <div style={{color:"green"}}>✔ Saved</div>}

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

      <button onClick={submit}>{saving ? "Saving..." : "Submit"}</button>
      <button onClick={()=>setScreen("finals")}>Top 30 Finals</button>

      <h2>Leaderboard</h2>

      {Object.keys(grouped).map(group=>(
        <div key={group}>
          <h3>{group}</h3>
          {grouped[group].slice(0,5).map((e,i)=>(
            <div key={i}>
              #{i+1} | Car {e.car} | {e.finalScore}
            </div>
          ))}
        </div>
      ))}

    </div>
  );
}
