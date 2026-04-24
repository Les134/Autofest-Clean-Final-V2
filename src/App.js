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

// ✅ FINAL LOCKED ROWS
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Drivers Skill & Control"
];

// ✅ DEDUCTIONS
const deductionsList = [
  "Hi Barrier",
  "Reversing / Stall",
  "Fail To Drive Off Pad",
  "Large Fire"
];

const classes = [
  "V8 Pro",
  "V8 N/A",
  "6Cyl Pro",
  "6Cyl N/A",
  "4Cyl / Rotary"
];

export default function App(){

  const [screen,setScreen] = useState("home");

  // ADMIN
  const [adminPass,setAdminPass] = useState(localStorage.getItem("admin") || "");
  const [isAdmin,setIsAdmin] = useState(false);

  // DATA
  const [data,setData] = useState([]);

  // ENTRY
  const [judge,setJudge] = useState("");
  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState(0);

  // LIVE DATA
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"), snap=>{
      setData(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  // ---------------- ADMIN ----------------

  function setAdmin(){
    const pass = prompt("Set Admin Password");
    if(pass){
      localStorage.setItem("admin",pass);
      setAdminPass(pass);
      alert("Admin Password Set");
    }
  }

  function loginAdmin(){
    const pass = prompt("Enter Admin Password");
    if(pass === adminPass){
      setIsAdmin(true);
      alert("Admin Logged In");
    } else {
      alert("Incorrect Password");
    }
  }

  // ---------------- SCORING ----------------

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev=>({...prev,[d]:!prev[d]}));
  }

  function total(){
    let t = Object.values(scores).reduce((a,b)=>a+b,0);

    // deductions
    Object.values(deductions).forEach(v=>{
      if(v) t -= 10;
    });

    // tyres
    t += tyres * 5;

    return t;
  }

  function submit(){

    addDoc(collection(db,"scores"),{
      car,
      driver,
      gender,
      carClass,
      total: total(),
      judge
    });

    // CLEAR
    setScores({});
    setDeductions({});
    setTyres(0);
    setCar("");
    setDriver("");
    setGender("");
    setCarClass("");
  }

  function leaderboard(){
    return [...data].sort((a,b)=>b.total-a.total);
  }

  // ---------------- HOME ----------------

  if(screen==="home"){
    return (
      <div style={homeWrap}>

        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Score Sheet</button>
        <button style={menuBtn} onClick={()=>setScreen("board")}>Leaderboard</button>

        <button style={menuBtn} onClick={setAdmin}>Set Admin</button>
        <button style={menuBtn} onClick={loginAdmin}>Admin Login</button>

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

  if(screen==="board"){
    const sorted = leaderboard();

    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {sorted.map((e,i)=>(
          <div key={i}>
            #{i+1} {e.car} / {e.driver} - {e.total}
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

      <input style={input} placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
      <input style={input} placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />

      {/* CLASS */}
      <div>
        {classes.map(c=>(
          <button key={c}
            onClick={()=>setCarClass(c)}
            style={carClass===c?activeBtn:bigBtn}>
            {c}
          </button>
        ))}
      </div>

      {/* GENDER */}
      <div>
        <button onClick={()=>setGender("Male")} style={gender==="Male"?activeBtn:bigBtn}>Male</button>
        <button onClick={()=>setGender("Female")} style={gender==="Female"?activeBtn:bigBtn}>Female</button>
      </div>

      {/* SCORES */}
      {categories.map(cat=>(
        <div key={cat} style={rowBlock}>
          <strong>{cat}</strong>
          <div style={row}>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                onClick={()=>setScore(cat,i)}
                style={scores[cat]===i?activeBtn:btn}>
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* BLOWN TYRES */}
      <div>
        <strong>Blown Tyres (+5 each)</strong><br/>
        <button style={tyres>=1?activeBtn:btn} onClick={()=>setTyres(1)}>1</button>
        <button style={tyres===2?activeBtn:btn} onClick={()=>setTyres(2)}>2</button>
      </div>

      {/* DEDUCTIONS */}
      <div>
        <strong>Deductions (-10 each)</strong><br/>
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

// ---------------- STYLES ----------------

const homeWrap = {background:"#fff",height:"100vh",padding:20,textAlign:"center"};
const menuBtn = {width:"90%",padding:18,margin:"8px auto",display:"block",fontSize:18};

const scoreWrap = {background:"#111",color:"#fff",padding:20};
const input = {width:"95%",padding:14,margin:5,fontSize:16};

const rowBlock = {marginBottom:20};
const row = {display:"flex",flexWrap:"wrap"};

const btn = {padding:12,margin:3,minWidth:45,fontSize:14};
const activeBtn = {...btn,background:"red",color:"#fff"};

const bigBtn = {padding:14,margin:6,fontSize:16};
const submitBtn = {padding:18,margin:10,fontSize:18};
