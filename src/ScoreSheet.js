      <div>
        Showmanship:
        <input type="number" onChange={(e) => setScores({ ...scores, showmanship: e.target.value })} />
      </div>

      <div>
        Crowd:
        <input type="number" onChange={(e) => setScores({ ...scores, crowd: e.target.value })} />
      </div>

      <h4>Total: {total}</h4>

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
