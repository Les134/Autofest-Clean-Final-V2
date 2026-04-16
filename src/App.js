import { initializeApp } from "firebase/app";
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setEntrant({ ...entrant, gender: "Male" })}
          style={{
            marginRight: 10,
            padding: 10,
            background: entrant.gender === "Male" ? "#ccc" : "#eee"
          }}
        >
          Male
        </button>
        <button
          onClick={() => setEntrant({ ...entrant, gender: "Female" })}
          style={{
            padding: 10,
            background: entrant.gender === "Female" ? "red" : "#eee",
            color: entrant.gender === "Female" ? "white" : "black"
          }}
        >
          Female
        </button>
      </div>

      {categories.map((cat) => (
        <div key={cat} style={{ marginTop: 20 }}>
          <h4>{cat}</h4>
          {[...Array(21).keys()].map((n) => (
            <button
              key={n}
              onClick={() => setScore(cat, n)}
              style={{
                margin: 4,
                padding: "10px 14px",
                fontSize: 16,
                background:
                  entrant.scores[cat] === n ? "red" : "#ddd",
                color: entrant.scores[cat] === n ? "white" : "black"
              }}
            >
              {n}
            </button>
          ))}
        </div>
      ))}

      <h2>Total: {total}</h2>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          fontSize: 18,
          background: "black",
          color: "white"
        }}
      >
        Submit Scores
      </button>
    </div>
  );
}
