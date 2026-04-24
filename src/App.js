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

// SCORE ROWS (LOCKED)
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Drivers Skill & Control"
];

// CLASSES
const classes = [
  "V8 Pro",
  "V8 N/A",
  "6Cyl Pro",
  "6Cyl N/A",
  "4Cyl / Rotary"
];

// DEDUCTIONS
const deductionsList = [
  "Hi Barrier",
  "Reversing / Stall",
  "Fail To Drive Off Pad",
  "Large Fire"
];

export default function App(){

  const [screen,setScreen] = useState("home");
  const [judge,setJudge] = useState("");
  const [data,setData] = useState([]);

  // ENTRY
  const [carNumber,setCarNumber] = useState("");
  const [carRego,setCarRego] = useState("");
  const [driver,setDriver] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  // ✅ NEW TOGGLE TYRES
  const [tyres,setTyres] = useState({
    one:false,
    two:false
  });

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"), snap=>{
      setData(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  const entryValid =
    carNumber.trim() !== "" ||
    carRego.trim() !== "";

  function setScore(cat,val){
    if(!entryValid) return;
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    if(!entryValid) return;
    setDeductions(prev=>({...prev,[d]:!prev[d]}));
  }

  function total(){
    let t = Object.values(scores).reduce((a,b)=>a+b,0);

    Object.values(deductions).forEach(v=>{
      if(v) t -= 10;
    });

    // ✅ TYRES FIX
    if(tyres.one) t += 5;
    if(tyres.two) t += 5;

    return t;
  }

  function submit(){

    if(!entryValid){
      alert("Enter Car Number or Rego");
      return;
    }

    addDoc(collection(db,"scores"),{
      carNumber,
      carRego,
      driver,
      gender,
      carClass,
      total: total(),
      judge
    });

    // RESET
    setScores({});
    setDeductions({});
    setTyres({one:false,two:false});
    setCarNumber("");
    setCarRego("");
    setDriver("");
    setGender("");
    setCarClass("");
  }

  function combine(){
    const map = {};

    data.forEach(e=>{
      const key = (e.carNumber || e.carRego) + "_" + e.driver;

      if(!map[key]){
        map[key] = {...e,total:0};
      }

      map[key].total += e.total;
    });

    return Object.values(map).sort((a,b)=>b.total-a.total);
  }

  const combined = combine();

  function classBoards(){
    const grouped = {};
    classes.forEach(c=>grouped[c]=[]);

    combined.forEach(e=>{
      if(grouped[e.carClass]){
        grouped[e.carClass].push(e);
      }
    });

    Object.keys(grouped).forEach(k=>{
      grouped[k].sort((a,b)=>b.total-a.total);
    });

    return grouped;
  }

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={homeWrap}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Score Sheet</button>

        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
        <button style={menuBtn} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={menuBtn} onClick={()=>setScreen("top30")}>Top 30</button>
        <button style={menuBtn} onClick={()=>setScreen("classes")}>Class Results</button>
      </div>
    );
  }

  // ---------------- JUDGE ----------------

  if(screen==="judge"){
    return (
      <div style={homeWrap}>
        <h2>Select Judge</h2>

        {[1,2,3,4,5,6].map(j=>(
          <button key={j} style={menuBtn}
            onClick={()=>{setJudge("Judge "+j); setScreen("score");}}>
            Judge {j}
          </button>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- LEADERBOARD ----------------

  if(screen==="leaderboard"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {combined.map((e,i)=>(
          <div key={i}>
            #{i+1} {e.carNumber || e.carRego} - {e.total}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- TOP 150 ----------------

  if(screen==="top150"){
    return (
      <div style={{padding:20}}>
        <h2>Top 150</h2>

        {combined.slice(0,150).map((e,i)=>(
          <div key={i}>
            #{i+1} {e.carNumber || e.carRego} - {e.total}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- TOP 30 ----------------

  if(screen==="top30"){
    return (
      <div style={{padding:20}}>
        <h2>Top 30</h2>

        {combined.slice(0,30).map((e,i)=>(
          <div key={i}>
            #{i+1} {e.carNumber || e.carRego} - {e.total}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- CLASS BOARDS ----------------

  if(screen==="classes"){
    const grouped = classBoards();

    return (
      <div style={{padding:20}}>
        <h2>Class Results</h2>

        {Object.keys(grouped).map(cls=>(
          <div key={cls}>
            <h3>{cls}</h3>

            {grouped[cls].map((e,i)=>(
              <div key={i}>
                #{i+1} {e.carNumber || e.carRego} - {e.total}
              </div>
            ))}
          </div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ---------------- SCORE ----------------

  return (
    <div style={scoreWrap}>

      <h2>{judge}</h2>

      <input style={input} placeholder="Driver Name" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input style={input} placeholder="Car Number" value={carNumber} onChange={e=>setCarNumber(e.target.value)} />
      <input style={input} placeholder="Car Rego / Number" value={carRego} onChange={e=>setCarRego(e.target.value)} />

      {!entryValid && <div style={{color:"orange"}}>Enter Car Number or Rego</div>}

      {/* CLASS */}
      <div>
        {classes.map(c=>(
          <button key={c}
            disabled={!entryValid}
            onClick={()=>setCarClass(c)}
            style={carClass===c?activeBtn:bigBtn}>
            {c}
          </button>
        ))}
      </div>

      {/* GENDER */}
      <div>
        <button disabled={!entryValid}
          onClick={()=>setGender("Male")}
          style={gender==="Male"?activeBtn:bigBtn}>Male</button>

        <button disabled={!entryValid}
          onClick={()=>setGender("Female")}
          style={gender==="Female"?activeBtn:bigBtn}>Female</button>
      </div>

      {/* SCORES */}
      {categories.map(cat=>(
        <div key={cat} style={rowBlock}>
          <strong>{cat}</strong>
          <div style={row}>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                disabled={!entryValid}
                onClick={()=>setScore(cat,i)}
                style={scores[cat]===i?activeBtn:btn}>
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* TYRES FIXED */}
      <div>
        <strong>Blown Tyres (+5 each)</strong><br/>

        <button
          style={tyres.one ? activeBtn : btn}
          onClick={()=>setTyres(prev => ({...prev, one: !prev.one}))}
        >
          1
        </button>

        <button
          style={tyres.two ? activeBtn : btn}
          onClick={()=>setTyres(prev => ({...prev, two: !prev.two}))}
        >
          2
        </button>
      </div>

      {/* DEDUCTIONS */}
      <div>
        <strong>Deductions</strong><br/>
        {deductionsList.map(d=>(
          <button key={d}
            onClick={()=>toggleDeduction(d)}
            style={deductions[d]?activeBtn:btn}>
            {d}
          </button>
        ))}
      </div>

      <h2>Total: {total()}</h2>

      <button style={submitBtn} onClick={submit}>SUBMIT</button>
      <button style={submitBtn} onClick={()=>setScreen("home")}>HOME</button>

    </div>
  );
}

// STYLES
const homeWrap = {background:"#fff",height:"100vh",padding:20,textAlign:"center"};
const menuBtn = {width:"90%",padding:18,margin:"8px auto",display:"block",fontSize:18};

const scoreWrap = {background:"#111",color:"#fff",padding:20};
const input = {width:"95%",padding:14,margin:5};

const rowBlock = {marginBottom:20};
const row = {display:"flex",flexWrap:"wrap"};

const btn = {padding:12,margin:3,minWidth:45};
const activeBtn = {...btn,background:"red",color:"#fff"};

const bigBtn = {padding:14,margin:6};
const submitBtn = {padding:18,margin:10};
