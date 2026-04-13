import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_PASSWORD = "admin123"; // 🔐 change this

export default function App(){

  const [screen,setScreen] = useState("cover");
  const [entries,setEntries] = useState([]);

  const [eventName,setEventName] = useState("");
  const [judge,setJudge] = useState("");
  const [adminPass,setAdminPass] = useState("");

  const [car,setCar] = useState("");
  const [scores,setScores] = useState({});

  // 🔥 LIVE SYNC
  useEffect(()=>{
    if(!eventName) return;

    const q = query(collection(db,"scores"), where("eventName","==",eventName));

    const unsub = onSnapshot(q,(snapshot)=>{
      setEntries(snapshot.docs.map(doc=>doc.data()));
    });

    return ()=>unsub();
  },[eventName]);

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  async function submit(){

    if(!judge) return alert("Select judge");
    if(!car) return alert("Enter car number");

    const total = Object.values(scores).reduce((a,b)=>a+b,0);

    await addDoc(collection(db,"scores"),{
      eventName,
      judge,
      car,
      score: total,
      time: Date.now()
    });

    setScores({});
    setCar("");
  }

  const sorted = [...entries].sort((a,b)=>b.score - a.score);

  // COVER
  if(screen==="cover"){
    return (
      <div style={{background:"#000",height:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
        <img src="/logo.png" style={{width:"80%"}} />
        <button onClick={()=>setScreen("login")}>ENTER EVENT</button>
      </div>
    );
  }

  // LOGIN
  if(screen==="login"){
    return (
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name" value={eventName} onChange={e=>setEventName(e.target.value)} />

        <h3>Judge</h3>
        {[1,2,3,4,5,6].map(j=>(
          <button key={j} onClick={()=>{setJudge("Judge "+j);setScreen("score")}}>
            Judge {j}
          </button>
        ))}

        <h3>Admin Access</h3>
        <input type="password" placeholder="Password" onChange={e=>setAdminPass(e.target.value)} />
        <button onClick={()=>{
          if(adminPass===ADMIN_PASSWORD){
            setScreen("admin");
          }else{
            alert("Wrong password");
          }
        }}>Login Admin</button>
      </div>
    );
  }

  // SCORING
  if(screen==="score"){
    return (
      <div style={{padding:20}}>
        <h3>{eventName} | {judge}</h3>

        <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />

        {["Smoke","Commitment","Style","Control","Entertainment"].map(cat=>(
          <div key={cat}>
            <strong>{cat}</strong><br/>
            {Array.from({length:21},(_,i)=>(
              <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
            ))}
          </div>
        ))}

        <button onClick={submit}>Submit & Next</button>
        <button onClick={()=>setScreen("leader")}>Leaderboard</button>
      </div>
    );
  }

  // 🎥 LIVE SCREEN
  if(screen==="leader"){
    return (
      <div style={{background:"#000",color:"#fff",height:"100vh",padding:20}}>
        <h1>LIVE LEADERBOARD</h1>

        {sorted.map((e,i)=>(
          <div key={i} style={{fontSize:24,margin:10}}>
            #{i+1} - Car {e.car} - {e.score}
          </div>
        ))}

        <button onClick={()=>setScreen("score")}>Back</button>
      </div>
    );
  }

  // 🔐 ADMIN
  if(screen==="admin"){
    return (
      <div style={{padding:20}}>
        <h2>ADMIN PANEL</h2>

        <button onClick={()=>setScreen("leader")}>View Live Screen</button>
        <button onClick={()=>setScreen("score")}>Back to Scoring</button>
      </div>
    );
  }

  return null;
}
