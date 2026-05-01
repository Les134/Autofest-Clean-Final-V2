import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Leaderboard({ eventName }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "scores"), (snap) => {
      setData(snap.docs.map(d => d.data()).filter(e => e.eventName === eventName));
    });

    return () => unsub();
  }, [eventName]);

  const grouped = {};

  data.forEach(e => {
    const key = e.carName + e.carClass;
    if (!grouped[key]) grouped[key] = {...e, total: 0};
    grouped[key].total += e.total;
  });

  const sorted = Object.values(grouped).sort((a,b)=>b.total-a.total);

  const classes = {
    Pro: sorted.filter(e => e.carClass === "Pro"),
    Street: sorted.filter(e => e.carClass === "Street")
  };

  return (
    <div>
      <h1>Leaderboard</h1>

      {Object.keys(classes).map(cls => (
        <div key={cls}>
          <h2>{cls}</h2>

          {classes[cls].map((e,i)=>(
            <div key={i}>
              #{i+1} {e.carName} — {e.total}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
