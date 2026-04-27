import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";

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
  "Drivers Skill & Control"
];

const classes = [
  "V8 Pro",
  "V8 N/A",
  "6Cyl Pro",
  "6Cyl N/A",
  "4Cyl / Rotary",
  "Female Class"
];

const deductionsList = ["Barrier","Reversing","Fail Off Pad","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [eventId,setEventId] = useState("");

  const [judges,setJudges] = useState(["","","","","",""]);
  const [judge,setJudge] = useState("");

  const [data,setData] = useState([]);

  const [driver,setDriver] = useState("");
  const [carNumber,setCarNumber] = useState("");
  const [carRego,setCarRego] = useState("");

  const [carClass,setCarClass] = useState("");
  const [gender,setGender] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({one:false,two:false});

  const [adminPass,setAdminPass] = useState(localStorage.getItem("adminPass") || "");
  const [adminLogged,setAdminLogged] = useState(false);

  function adminSetup(){
    const pass = prompt("Set Admin Password");
    if(pass){
      localStorage.setItem("adminPass",pass);
      setAdminPass(pass);
    }
  }

  function adminLogin(){
    const pass = prompt("Enter Admin Password");
    if(pass === adminPass){
      setAdminLogged(true);
    } else {
      alert("Wrong Password");
    }
  }

  useEffect(()=>{
    if(!eventId) return;
    const unsub = onSnapshot(collection(db,"scores_"+eventId), snap=>{
      setData(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=>unsub();
  },[eventId]);

  const entryValid =
    (carNumber.trim() !== "" || carRego.trim() !== "") &&
    carClass !== "" &&
    gender !== "";

  function setScore(cat,val){
    if(!entryValid) return;
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev=>({...prev,[d]:!prev[d]}));
  }

  function total(){
    let t = Object.values(scores).reduce((a,b)=>a+b,0);
    Object.values(deductions).forEach(v=>{ if(v) t -= 10; });
    if(tyres.one) t += 5;
    if(tyres.two) t += 5;
    return t;
  }

  function submit(){
    if(!entryValid) return alert("Complete all fields");

    addDoc(collection(db,"scores_"+eventId),{
      driver,
      carNumber,
      carRego,
      carClass,
      gender,
      total: total(),
      deductions: Object.keys(deductions).filter(d=>deductions[d]),
      judge
    });

    setScores({});
    setDeductions({});
    setTyres({one:false,two:false});
    setCarClass("");
    setGender("");
    setDriver("");
    setCarNumber("");
    setCarRego("");
  }

  function deleteScore(id){
    if(!adminLogged) return alert("Admin only");
    deleteDoc(doc(db,"scores_"+eventId,id));
  }

  function combine(){
    const activeJudges = judges.filter(j => j && j.trim() !== "");
    const map = {};

    data.forEach(e=>{
      const key = (e.carNumber || e.carRego) + "_" + e.driver;

      if(!map[key]){
        map[key] = {
          ...e,
          total: 0,
          deductions: [],
          judgeSet: new Set(),
          carClass: e.carClass || "Unassigned",
          gender: e.gender || "Unassigned"
        };
      }

      map[key].total += e.total;
      if(e.deductions) map[key].deductions.push(...e.deductions);
      if(e.judge) map[key].judgeSet.add(e.judge);
    });

    return Object.values(map)
      .filter(e => e.judgeSet.size === activeJudges.length)
      .sort((a,b)=>b.total-a.total);
  }

  const combined = combine();

  function format(e){
    const ded = e.deductions?.length
      ? ` (${[...new Set(e.deductions)].join(", ")})`
      : "";
    return `${e.driver} / Car Number: ${e.carNumber || e.carRego} - Score: ${e.total}${ded} [${e.carClass} - ${e.gender}]`;
  }

  // HOME
  if(screen==="home"){
    return (
      <div style={homeWrap}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("eventLogin")}>Event and Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("judgeSelect")}>Judge Login</button>

        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
        <button style={menuBtn} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={menuBtn} onClick={()=>setScreen("top30")}>Top 30</button>
        <button style={menuBtn} onClick={()=>setScreen("classes")}>Classes</button>

        <button style={menuBtn} onClick={adminSetup}>Set Admin</button>
        <button style={menuBtn} onClick={adminLogin}>Admin Login</button>
      </div>
    );
  }

  // ✅ FIXED EVENT LOGIN
  if(screen==="eventLogin"){
    return (
      <div style={{padding:20}}>
        <h2>Setup Event</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        {judges.map((j,i)=>(
          <input
            key={i}
            placeholder={`Judge ${i+1}`}
            value={judges[i]}
            onChange={e=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button onClick={async ()=>{
          const cleanJudges = judges.filter(j => j && j.trim() !== "");

          if(cleanJudges.length === 0){
            alert("Enter at least one judge");
            return;
          }

          if(!eventName.trim()){
            alert("Enter event name");
            return;
          }

          const id = Date.now().toString();

          await setDoc(doc(db,"events",id),{
            name:eventName,
            judges: cleanJudges
          });

          setJudges(cleanJudges);
          setEventId(id);
          setScreen("judgeSelect");
        }}>
          Lock Event
        </button>
      </div>
    );
  }

  // JUDGE SELECT
  if(screen==="judgeSelect"){
    return (
      <div style={homeWrap}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i} style={menuBtn}
            onClick={()=>{ setJudge(j || ("Judge "+(i+1))); setScreen("score"); }}>
            {j || ("Judge "+(i+1))}
          </button>
        ))}
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {combined.map((e,i)=>(
          <div key={i}>
            #{i+1} {format(e)}
          </div>
        ))}

        <button onClick={()=>setScreen("score")}>Return to Scoresheet</button>
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE SHEET
  return (
    <div style={scoreWrap}>
      <h2>Judge: {judge}</h2>

      <input style={input} placeholder="Driver Name" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input style={input} placeholder="Car Number" value={carNumber} onChange={e=>setCarNumber(e.target.value)} />
      <input style={input} placeholder="Car Rego / Number" value={carRego} onChange={e=>setCarRego(e.target.value)} />

      <div>
        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)} style={carClass===c?activeBtn:bigBtn}>{c}</button>
        ))}
      </div>

      <div>
        <button onClick={()=>setGender("Male")} style={gender==="Male"?activeBtn:bigBtn}>Male</button>
        <button onClick={()=>setGender("Female")} style={gender==="Female"?activeBtn:bigBtn}>Female</button>
      </div>

      <h2>Total: {total()}</h2>

      <button style={submitBtn} onClick={submit}>SUBMIT</button>
    </div>
  );
}

const homeWrap = {background:"#fff",height:"100vh",padding:20,textAlign:"center"};
const menuBtn = {width:"90%",padding:18,margin:"8px auto",fontSize:18};

const scoreWrap = {background:"#111",color:"#fff",padding:20};
const input = {width:"95%",padding:14,margin:5};

const btn = {padding:12,margin:3};
const bigBtn = {padding:14,margin:6};
const activeBtn = {...btn,background:"red",color:"#fff"};

const submitBtn = {padding:18,margin:10};
