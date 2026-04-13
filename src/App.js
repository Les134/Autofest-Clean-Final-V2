import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc } from "firebase/firestore";

// ✅ YOUR FIREBASE CONFIG (FIXED)
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

const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4Cyl Open/Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");
  const [eventName,setEventName] = useState("");

  const [data,setData] = useState([]);
  const [locked,setLocked] = useState(false);
  const [saving,setSaving] = useState(false);

  const [judges,setJudges] = useState([
    {id:1,name:""},
    {id:2,name:""},
    {id:3,name:""},
    {id:4,name:""},
    {id:5,name:""},
    {id:6,name:""}
  ]);

  const [judge,setJudge] = useState(null);

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
    if(!eventName) return;

    const unsub = onSnapshot(collection(db,"events",eventName,"scores"),(snap)=>{
      setData(snap.docs.map(d=>d.data()));
    });

    const lockRef = doc(db,"events",eventName,"admin","lock");

    onSnapshot(lockRef,(docSnap)=>{
      setLocked(docSnap.data()?.locked || false);
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

    if(saving) return;

    if(locked){
      alert("Scoring locked");
      return;
    }

    if(!car && !driver && !rego && !carName){
      alert("Enter at least one field");
      return;
    }

    if(Object.keys(scores).length===0){
      alert("Add scores");
      return;
    }

    setSaving(true);

    try{
      const total = Object.values(scores).reduce((a,b)=>a+b,0);
      const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
      const deductionTotal = Object.values(deductions).filter(v=>v).length*10;

      const finalScore = total + tyreScore - deductionTotal;
      const displayName = car || driver || rego || carName;

      await addDoc(collection(db,"events",eventName,"scores"),{
        displayName,
        car,
        driver,
        rego,
        carName,
        gender,
        carClass,
        judge: judge?.name || `Judge ${judge?.id}`,
        finalScore,
        time: Date.now()
      });

      // RESET
      setScores({});
      setDeductions({});
      setTyres({left:false,right:false});
      setCar(""); setDriver(""); setRego(""); setCarName("");
      setGender(""); setCarClass("");

    } catch(err){
      alert("Save failed");
    }

    setSaving(false);
  }

  async function toggleLock(){
    await setDoc(doc(db,"events",eventName,"admin","lock"),{
      locked: !locked
    });
  }

  function sorted(){
    return [...data].sort((a,b)=>b.finalScore-a.finalScore);
  }

  function top150(){ return sorted().slice(0,150); }
  function top30(){ return sorted().slice(0,30); }

  function classWinners(){
    const grouped={};
    sorted().forEach(e=>{
      if(!grouped[e.carClass]) grouped[e.carClass]=[];
      grouped[e.carClass].push(e);
    });
    Object.keys(grouped).forEach(c=>{
      grouped[c]=grouped[c].slice(0,3);
    });
    return grouped;
  }

  // HOME
  if(screen==="home"){
    return (
      <div style={home}>
        <h1 style={{color:"#fff"}}>AutoFest Burnout Champs</h1>

        <input
          placeholder="Enter Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
          style={input}
        />

        <button style={btnBig} onClick={()=>setScreen("setup")}>Setup Judges</button>
        <button style={btnBig} onClick={()=>setScreen("judgeSelect")}>Start Judging</button>
        <button style={btnBig} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>

        <button style={btnBig} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={btnBig} onClick={()=>setScreen("top30")}>Top 30 Finals</button>
        <button style={btnBig} onClick={()=>setScreen("winners")}>Class Winners</button>

        <button style={btnBig} onClick={toggleLock}>
          {locked ? "UNLOCK SCORING" : "LOCK SCORING"}
        </button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    return (
      <Board title="Leaderboard" data={sorted()} back={()=>setScreen("home")} />
    );
  }

  if(screen==="top150"){
    return <Board title="Top 150" data={top150()} back={()=>setScreen("home")} />;
  }

  if(screen==="top30"){
    return <Board title="Top 30 Finals" data={top30()} back={()=>setScreen("home")} />;
  }

  if(screen==="winners"){
    const winners = classWinners();
    return (
      <div style={{padding:20}}>
        <h2>Class Winners</h2>

        {Object.keys(winners).map(c=>(
          <div key={c}>
            <h3>{c}</h3>
            {winners[c].map((e,i)=>(
              <div key={i}>
                {["🥇","🥈","🥉"][i]} {e.displayName} - {e.finalScore}
              </div>
            ))}
          </div>
        ))}

        <button style={btnBig} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SETUP + JUDGING (UNCHANGED FROM YOUR VERSION)
  if(screen==="setup"){
    return (
      <div style={{padding:20}}>
        <h2>Judge Names</h2>
        {judges.map(j=>(
          <input key={j.id} value={j.name} placeholder={`Judge ${j.id}`}
            onChange={(e)=>{
              const updated=[...judges];
              updated[j.id-1].name=e.target.value;
              setJudges(updated);
            }}
          />
        ))}
        <button style={btnBig} onClick={()=>setScreen("home")}>Save</button>
      </div>
    );
  }

  if(screen==="judgeSelect"){
    return (
      <div style={{padding:20}}>
        {judges.map(j=>(
          <button key={j.id} style={btnBig} onClick={()=>{setJudge(j);setScreen("judge")}}>
            {j.name || `Judge ${j.id}`}
          </button>
        ))}
      </div>
    );
  }

  // JUDGING SCREEN (UNCHANGED CORE)
  return (
    <div style={{padding:20}}>
      <h3>{judge?.name || `Judge ${judge?.id}`}</h3>

      <input style={input} placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)}/>
      <input style={input} placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)}/>
      <input style={input} placeholder="Rego" value={rego} onChange={e=>setRego(e.target.value)}/>
      <input style={input} placeholder="Car Name" value={carName} onChange={e=>setCarName(e.target.value)}/>

      <div style={section}>
        <button style={gender==="Male"?btnGreen:btn} onClick={()=>setGender("Male")}>Male</button>
        <button style={gender==="Female"?btnGreen:btn} onClick={()=>setGender("Female")}>Female</button>
      </div>

      <div style={section}>
        {classes.map(c=>(
          <button key={c} style={carClass===c?btnBlue:btn} onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}
      </div>

      {categories.map(cat=>(
        <div key={cat} style={section}>
          <strong>{cat}</strong>
          <div style={rowWrap}>
            {Array.from({length:21},(_,i)=>(
              <button key={i} style={scores[cat]===i?btnRed:btnLarge} onClick={()=>setScore(cat,i)}>
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={section}>
        <strong>Blown Tyres</strong><br/>
        <button style={tyres.left?btnRed:btnLarge} onClick={()=>toggleTyre("left")}>Left</button>
        <button style={tyres.right?btnRed:btnLarge} onClick={()=>toggleTyre("right")}>Right</button>
      </div>

      <div style={section}>
        <strong>Deductions</strong><br/>
        {deductionsList.map(d=>(
          <button key={d} style={deductions[d]?btnRed:btnLarge} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      <button style={btnBig} onClick={submit}>
        {saving ? "Saving..." : "Submit (LOCK)"}
      </button>

      <button style={btnBig} onClick={()=>setScreen("home")}>Home</button>
    </div>
  );
}

// 🔥 BOARD COMPONENT
function Board({title,data,back}){
  return (
    <div style={{padding:20}}>
      <h2>{title}</h2>

      {data.map((e,i)=>(
        <div key={i} style={row}>
          #{i+1} | {e.displayName} | {e.carClass} | {e.gender} | {e.finalScore}
        </div>
      ))}

      <button style={btnBig} onClick={()=>window.print()}>Print</button>
      <button style={btnBig} onClick={back}>Home</button>
    </div>
  );
}

// STYLES
const home={height:"100vh",background:"#000",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"};
const input={display:"block",width:"100%",padding:"14px",marginBottom:"10px"};
const section={marginTop:"20px"};
const row={padding:"10px",background:"#eee",marginBottom:"6px"};
const rowWrap={display:"flex",flexWrap:"wrap",gap:"8px"};

const btn={padding:"10px",margin:"4px"};
const btnLarge={padding:"14px",margin:"4px"};
const btnRed={...btnLarge,background:"red",color:"#fff"};
const btnBlue={...btnLarge,background:"blue",color:"#fff"};
const btnGreen={...btnLarge,background:"green",color:"#fff"};
const btnBig={padding:"16px",margin:"10px",background:"#000",color:"#fff"};
