import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDoc
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
  const [joinId,setJoinId] = useState("");
  const [eventLocked,setEventLocked] = useState(false);

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

  // LOAD EVENT
  useEffect(()=>{
    const savedEvent = localStorage.getItem("eventId");
    const savedJudges = localStorage.getItem("judges");

    if(savedEvent) setEventId(savedEvent);
    if(savedJudges) setJudges(JSON.parse(savedJudges));
  },[]);

  // LIVE SYNC
  useEffect(()=>{
    if(!eventId) return;

    const unsub = onSnapshot(
      collection(db,"scores_"+eventId),
      snap=>{
        setData(snap.docs.map(d=>({id:d.id,...d.data()})));
      }
    );

    return ()=>unsub();
  },[eventId]);

  // SAVE SCORE STATE
  useEffect(()=>{
    if(screen !== "score") return;

    const save = {
      driver,carNumber,carRego,carClass,gender,scores,deductions,tyres
    };
    localStorage.setItem("currentScore", JSON.stringify(save));
  },[driver,carNumber,carRego,carClass,gender,scores,deductions,tyres,screen]);

  // RESTORE SCORE
  useEffect(()=>{
    if(screen !== "score") return;

    const saved = localStorage.getItem("currentScore");
    if(!saved) return;

    const s = JSON.parse(saved);

    setDriver(s.driver || "");
    setCarNumber(s.carNumber || "");
    setCarRego(s.carRego || "");
    setCarClass(s.carClass || "");
    setGender(s.gender || "");
    setScores(s.scores || {});
    setDeductions(s.deductions || {});
    setTyres(s.tyres || {one:false,two:false});
  },[screen]);

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

  async function submit(){
    if(!entryValid) return alert("Complete all fields");

    const eventSnap = await getDoc(doc(db,"events",eventId));
    if(eventSnap.data()?.locked){
      alert("Event locked 🔒");
      return;
    }

    const uniqueId = `${carNumber || carRego}_${driver}_${judge}`;

    await setDoc(doc(db,"scores_"+eventId,uniqueId),{
      driver,carNumber,carRego,carClass,gender,
      total: total(),
      deductions: Object.keys(deductions).filter(d=>deductions[d]),
      judge
    });

    localStorage.removeItem("currentScore");

    setScores({});
    setDeductions({});
    setTyres({one:false,two:false});
    setCarClass("");
    setGender("");
    setDriver("");
    setCarNumber("");
    setCarRego("");
  }

  async function deleteScore(id){
    if(!adminLogged) return alert("Admin only");

    const snap = await getDoc(doc(db,"events",eventId));
    if(snap.data()?.locked){
      return alert("Event locked 🔒");
    }

    deleteDoc(doc(db,"scores_"+eventId,id));
  }

  function combine(){
    const map = {};
    data.forEach(e=>{
      const key = (e.carNumber || e.carRego) + "_" + e.driver;
      if(!map[key]) map[key] = {...e,total:0};
      map[key].total += e.total;
    });
    return Object.values(map).sort((a,b)=>b.total-a.total);
  }

  const combined = combine();

  function format(e){
    return `${e.driver} / ${e.carNumber || e.carRego} - ${e.total}`;
  }

  // HOME
  if(screen==="home"){
    return (
      <div style={homeWrap}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>
        <button style={menuBtn} onClick={()=>setScreen("eventLogin")}>Event Setup / Join</button>
        <button style={menuBtn} onClick={()=>setScreen("judgeSelect")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
      </div>
    );
  }

  // EVENT LOGIN
  if(screen==="eventLogin"){
    return (
      <div style={{padding:20}}>
        <input placeholder="Event Name" value={eventName} onChange={e=>setEventName(e.target.value)} />

        {judges.map((j,i)=>(
          <input key={i} disabled={eventLocked}
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
          const clean = judges.filter(j=>j.trim()!=="");
          const id = Date.now().toString();

          await setDoc(doc(db,"events",id),{
            name:eventName,
            judges:clean,
            locked:false
          });

          setEventId(id);
          setJudges(clean);
          setScreen("judgeSelect");
        }}>
          Lock Event
        </button>

        <button onClick={async ()=>{
          await setDoc(doc(db,"events",eventId),{
            name:eventName,
            judges,
            locked:true
          });
          setEventLocked(true);
          alert("Event Locked 🔒");
        }}>
          FINAL LOCK 🔒
        </button>

        <input placeholder="Event ID" value={joinId} onChange={e=>setJoinId(e.target.value)} />

        <button onClick={async ()=>{
          const snap = await getDoc(doc(db,"events",joinId));
          if(!snap.exists()) return alert("Event not found");

          const data = snap.data();
          setEventId(joinId);
          setJudges(data.judges);
          setEventLocked(data.locked || false);
          setScreen("judgeSelect");
        }}>
          Join Event
        </button>
      </div>
    );
  }

  // JUDGE SELECT
  if(screen==="judgeSelect"){
    return (
      <div style={homeWrap}>
        {judges.map((j,i)=>(
          <button key={i} style={menuBtn}
            onClick={()=>{ setJudge(j); setScreen("score"); }}>
            {j}
          </button>
        ))}
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    return (
      <div style={{padding:20}}>
        <h2>LEADERBOARD</h2>

        {combined.map((e,i)=>(
          <div key={i}>#{i+1} {format(e)}</div>
        ))}

        <button onClick={()=>setScreen("score")}>Return to Scoresheet</button>
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE SCREEN
  return (
    <div style={scoreWrap}>
      <h2>Judge: {judge}</h2>

      <input style={input} placeholder="Driver Name" value={driver} onChange={e=>setDriver(e.target.value)} />

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      <h2>Total: {total()}</h2>

      <button style={submitBtn} onClick={submit}>SUBMIT</button>
      <button style={submitBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
    </div>
  );
}

const homeWrap = {padding:20,textAlign:"center"};
const menuBtn = {padding:18,margin:8};

const scoreWrap = {background:"#111",color:"#fff",padding:20};
const input = {width:"95%",padding:14,margin:5};

const submitBtn = {padding:18,margin:10};
