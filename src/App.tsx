import React, { useState, useEffect } from 'react';

export type Team = 'A' | 'B' | 'C';

interface HoleInput {
  A: [number, number];
  B: [number, number];
  C: [number, number];
}

interface BirdieInput {
  A: [boolean, boolean];
  B: [boolean, boolean];
  C: [boolean, boolean];
}

interface CTHToggle {
  A: boolean;
  B: boolean;
  C: boolean;
}

interface HoleResult {
  A: number;
  B: number;
  C: number;
}

const TEAM_NAMES: Team[] = ['A', 'B', 'C'];

function calculateHoleScore(input: HoleInput, birdies: BirdieInput): Record<string, number> {
  const players: { team: Team; player: number; score: number; birdie: boolean }[] = [];

  TEAM_NAMES.forEach(team => {
    [0, 1].forEach(player => {
      players.push({
        team,
        player,
        score: input[team][player],
        birdie: birdies[team][player],
      });
    });
  });

  // Group into best and second-best by team
  const bestPlayers: typeof players = [];
  const secondPlayers: typeof players = [];

  TEAM_NAMES.forEach(team => {
    const p0 = players.find(p => p.team === team && p.player === 0)!;
    const p1 = players.find(p => p.team === team && p.player === 1)!;

    if (p0.score <= p1.score) {
      bestPlayers.push(p0);
      secondPlayers.push(p1);
    } else {
      bestPlayers.push(p1);
      secondPlayers.push(p0);
    }
  });

  // Init result
  const result: Record<string, number> = {};
  players.forEach(p => {
    result[`${p.team}${p.player}`] = 0;
  });

  function compareGroup(group: typeof players) {
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i === j) continue;

        const p1 = group[i];
        const p2 = group[j];
        const key1 = `${p1.team}${p1.player}`;
        const key2 = `${p2.team}${p2.player}`;

        if (p1.score < p2.score) {
          result[key1] += p1.birdie ? 2 : 1;
          result[key2] -= p1.birdie ? 2 : 1;
        } else if (p1.score > p2.score) {
          result[key2] += p2.birdie ? 2 : 1;
          result[key1] -= p2.birdie ? 2 : 1;
        }
        // If equal, do nothing (draw = 0)
      }
    }
  }

  compareGroup(bestPlayers);
  compareGroup(secondPlayers);

  return result;
}



function calculateHoleScoreTurbo(
  input: HoleInput,
  birdies: BirdieInput,
  holeNumber: number,
  cth: CTHToggle
): HoleResult {
  const individualScores = calculateHoleScore(input, birdies);
  const isTurbo = holeNumber === 9 || holeNumber === 18;
  const teamScores: HoleResult = { A: 0, B: 0, C: 0 };

  TEAM_NAMES.forEach(team => {
    let score = (individualScores[`${team}0`] + individualScores[`${team}1`]) / 2;
    if (isTurbo) score *= 2;
    if (cth[team]) score += 1;
    teamScores[team] = score;
  });

  return teamScores;
}

export default function App() {
  const [holeNumber, setHoleNumber] = useState(1);
  const [allScores, setAllScores] = useState<Record<number, HoleInput>>({});
  const [allBirdies, setAllBirdies] = useState<Record<number, BirdieInput>>({});
  const [allCTH, setAllCTH] = useState<Record<number, CTHToggle>>({});
  const [totals, setTotals] = useState<HoleResult>({ A: 0, B: 0, C: 0 });

  const [scores, setScores] = useState<HoleInput>({ A: [0, 0], B: [0, 0], C: [0, 0] });
  const [birdies, setBirdies] = useState<BirdieInput>({ A: [false, false], B: [false, false], C: [false, false] });
  const [cth, setCTH] = useState<CTHToggle>({ A: false, B: false, C: false });

  useEffect(() => {
    setScores(allScores[holeNumber] || { A: [0, 0], B: [0, 0], C: [0, 0] });
    setBirdies(allBirdies[holeNumber] || { A: [false, false], B: [false, false], C: [false, false] });
    setCTH(allCTH[holeNumber] || { A: false, B: false, C: false });
  }, [holeNumber]);

  const isTurboHole = holeNumber === 9 || holeNumber === 18;

  const handleSubmit = () => {
    const previousScores = allScores[holeNumber] || { A: [0, 0], B: [0, 0], C: [0, 0] };
    const previousBirdies = allBirdies[holeNumber] || { A: [false, false], B: [false, false], C: [false, false] };
    const previousCTH = allCTH[holeNumber] || { A: false, B: false, C: false };

    const latestCTH = { ...cth };

    const previousResult = calculateHoleScoreTurbo(previousScores, previousBirdies, holeNumber, previousCTH);
    const newResult = calculateHoleScoreTurbo(scores, birdies, holeNumber, latestCTH);

    setAllScores(prev => ({ ...prev, [holeNumber]: scores }));
    setAllBirdies(prev => ({ ...prev, [holeNumber]: birdies }));
    setAllCTH(prev => ({ ...prev, [holeNumber]: latestCTH }));

    setTotals(prev => ({
      A: prev.A - previousResult.A + newResult.A,
      B: prev.B - previousResult.B + newResult.B,
      C: prev.C - previousResult.C + newResult.C,
    }));
  };

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif', maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Match Play Scorecard</h2>
      <h3>Hole {holeNumber} {isTurboHole && <span>(Turbo Hole)</span>}</h3>

      <table style={{ width: '100%', marginBottom: 12 }}>
        <thead>
          <tr>
            <th>Team</th>
            <th>P1</th>
            <th>P2</th>
            <th>🕊️</th>
            <th>CTH</th>
          </tr>
        </thead>
        <tbody>
          {TEAM_NAMES.map(team => (
            <tr key={team}>
              <td>{team}</td>
              {[0, 1].map(i => (
                <td key={i}>
                  <input
                    type="number"
                    value={scores[team][i]}
                    onChange={e => {
                      const updated = [...scores[team]] as [number, number];
                      updated[i] = Number(e.target.value);
                      setScores(prev => ({ ...prev, [team]: updated }));
                    }}
                    style={{ width: '50px' }}
                  />
                </td>
              ))}
              <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {[0, 1].map(i => (
                      <input
                        key={i}
                        type="checkbox"
                        checked={birdies[team][i]}
                        onChange={e => {
                          const updated = [...birdies[team]] as [boolean, boolean];
                          updated[i] = e.target.checked;
                          setBirdies(prev => ({ ...prev, [team]: updated }));
                        }}
                        style={{ width: 18, height: 18 }}
                      />
                    ))}
                  </div>
                </td>
              <td>
                <input
                  type="checkbox"
                  checked={cth[team]}
                  onChange={e => {
                    setCTH(prev => ({ ...prev, [team]: e.target.checked }));
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSubmit} style={{ width: '100%', padding: 10 }}>Submit Scores</button>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <h4>Total Scores</h4>
        <p>A: {totals.A}</p>
        <p>B: {totals.B}</p>
        <p>C: {totals.C}</p>
      </div>

      <div style={{ marginTop: 30, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
        {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => setHoleNumber(num)}
            style={{
              width: 32,
              height: 32,
              textAlign: 'center',
              borderRadius: 4,
              backgroundColor: holeNumber === num ? '#007bff' : '#eee',
              color: holeNumber === num ? '#fff' : '#000',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
