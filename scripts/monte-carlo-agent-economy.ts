/**
 * Monte Carlo Simulation: MFC Agent Trading Economy
 *
 * Validates:
 * 1. Bankroll trajectories at various win rates
 * 2. Ruin probability (bankroll -> $10 minimum)
 * 3. Fee extraction rate (MFC revenue over time)
 * 4. Multi-agent market dynamics (shark effect, liquidity)
 * 5. Revenue projections at various agent counts
 */

const SIMS = 10_000;
const FIGHTS_PER_SIM = 1_000; // ~10 days at 100 fights/day

// Economy parameters from spec
const FEE_RATE = 0.005; // 0.5% flat on buy and sell
const POSITION_LIMIT_PCT = 0.05; // 5% of bankroll
const POSITION_LIMIT_CAP = 100; // $100 hard cap
const MIN_BANKROLL = 10; // $10 minimum to trade

interface SimResult {
  finalBankroll: number;
  peakBankroll: number;
  troughBankroll: number;
  ruined: boolean; // hit $10 minimum
  totalFeesPaid: number;
  totalTrades: number;
  effectiveWinRate: number;
}

interface MarketResult {
  totalFeesExtracted: number;
  poolStart: number;
  poolEnd: number;
  agentSurvivalRate: number;
  topAgentShare: number;
  avgWinRate: number;
  feeExtractionPct: number;
}

// --- Simulation 1: Single Agent Bankroll Trajectory ---

function simulateAgent(
  startBankroll: number,
  trueEdge: number, // 0 = 50% WR, 0.05 = 55% WR
  holdToSettlement: boolean
): SimResult {
  let bankroll = startBankroll;
  let peak = startBankroll;
  let trough = startBankroll;
  let totalFees = 0;
  let totalTrades = 0;
  let wins = 0;
  let ruined = false;

  for (let i = 0; i < FIGHTS_PER_SIM; i++) {
    if (bankroll < MIN_BANKROLL) {
      ruined = true;
      break;
    }

    // Position sizing: 5% of bankroll, capped at $100
    const maxPosition = Math.min(bankroll * POSITION_LIMIT_PCT, POSITION_LIMIT_CAP);
    const positionSize = maxPosition; // Agent uses full allocation

    // AMM price: approximate as 0.50 ± noise (centered market)
    const trueProb = 0.50 + trueEdge;
    const ammPrice = 0.50 + (Math.random() - 0.5) * 0.10; // price noise ±5 cents

    // Agent buys YES if they think true prob > AMM price
    // (simplified: agent always takes the favorable side)
    const buyPrice = ammPrice;
    const contracts = positionSize / buyPrice;

    // Buy fee
    const buyCost = contracts * buyPrice;
    const buyFee = buyCost * FEE_RATE;
    totalFees += buyFee;
    totalTrades++;

    // Fight outcome
    const outcome = Math.random() < trueProb;

    if (holdToSettlement) {
      // Hold to settlement: no sell fee
      if (outcome) {
        // Win: receive $1 per contract
        bankroll += (contracts * 1.0) - buyCost - buyFee;
        wins++;
      } else {
        // Lose: receive $0
        bankroll -= buyCost + buyFee;
      }
    } else {
      // Round-trip: sell before settlement
      // Sell price = buyPrice + edge (if win) or buyPrice - edge (if lose)
      const priceMove = outcome ? 0.15 : -0.15; // simplified price movement
      const sellPrice = Math.max(0.01, Math.min(0.99, buyPrice + priceMove));
      const sellProceeds = contracts * sellPrice;
      const sellFee = sellProceeds * FEE_RATE;
      totalFees += sellFee;
      totalTrades++;

      bankroll += sellProceeds - sellFee - buyCost - buyFee;
      if (sellPrice > buyPrice) wins++;
    }

    peak = Math.max(peak, bankroll);
    trough = Math.min(trough, bankroll);
  }

  return {
    finalBankroll: bankroll,
    peakBankroll: peak,
    troughBankroll: trough,
    ruined,
    totalFeesPaid: totalFees,
    totalTrades,
    effectiveWinRate: wins / Math.min(FIGHTS_PER_SIM, totalTrades),
  };
}

// --- Simulation 2: Multi-Agent Market ---

function simulateMarket(
  numAgents: number,
  fightsPerDay: number,
  days: number,
  skillDistribution: number[] // edge for each agent
): MarketResult {
  const bankrolls = new Array(numAgents).fill(200); // $200 each
  const poolStart = bankrolls.reduce((a, b) => a + b, 0);
  let totalFees = 0;
  const wins = new Array(numAgents).fill(0);
  const trades = new Array(numAgents).fill(0);

  const totalFights = fightsPerDay * days;

  for (let f = 0; f < totalFights; f++) {
    // Each fight: agents who can afford to trade, do so
    // True outcome probability: 50% (fair fight)
    const trueProb = 0.50;
    const outcome = Math.random() < trueProb;

    // AMM price with some noise
    const ammPrice = 0.50 + (Math.random() - 0.5) * 0.08;

    // Collect all agent orders
    const yesAgents: number[] = [];
    const noAgents: number[] = [];

    for (let a = 0; a < numAgents; a++) {
      if (bankrolls[a] < MIN_BANKROLL) continue;

      const maxPos = Math.min(bankrolls[a] * POSITION_LIMIT_PCT, POSITION_LIMIT_CAP);

      // Agent's perceived probability
      const perceivedProb = trueProb + skillDistribution[a] + (Math.random() - 0.5) * 0.05;

      // Trade if perceived differs from AMM price
      if (perceivedProb > ammPrice + 0.02) {
        yesAgents.push(a);
      } else if (perceivedProb < ammPrice - 0.02) {
        noAgents.push(a);
      }
      // Otherwise: no trade (edge too small)
    }

    // Match YES and NO agents (zero-sum between them)
    const matchCount = Math.min(yesAgents.length, noAgents.length);

    for (let m = 0; m < matchCount; m++) {
      const yesAgent = yesAgents[m];
      const noAgent = noAgents[m];

      const yesPos = Math.min(
        bankrolls[yesAgent] * POSITION_LIMIT_PCT,
        POSITION_LIMIT_CAP
      );
      const noPos = Math.min(
        bankrolls[noAgent] * POSITION_LIMIT_PCT,
        POSITION_LIMIT_CAP
      );
      const tradeSize = Math.min(yesPos, noPos);

      const yesContracts = tradeSize / ammPrice;
      const noContracts = tradeSize / (1 - ammPrice);

      // Fees for both sides
      const yesFee = tradeSize * FEE_RATE;
      const noFee = tradeSize * FEE_RATE;
      totalFees += yesFee + noFee;

      trades[yesAgent]++;
      trades[noAgent]++;

      if (outcome) {
        // YES wins
        const yesProfit = yesContracts * 1.0 - tradeSize - yesFee;
        const noLoss = -tradeSize - noFee;
        bankrolls[yesAgent] += yesProfit;
        bankrolls[noAgent] += noLoss;
        wins[yesAgent]++;
      } else {
        // NO wins
        const noProfit = noContracts * 1.0 - tradeSize - noFee;
        const yesLoss = -tradeSize - yesFee;
        bankrolls[noAgent] += noProfit;
        bankrolls[yesAgent] += yesLoss;
        wins[noAgent]++;
      }
    }

    // Unmatched agents trade against AMM (simplified: same as single agent)
    const unmatchedYes = yesAgents.slice(matchCount);
    const unmatchedNo = noAgents.slice(matchCount);

    for (const a of [...unmatchedYes, ...unmatchedNo]) {
      const pos = Math.min(bankrolls[a] * POSITION_LIMIT_PCT, POSITION_LIMIT_CAP);
      const fee = pos * FEE_RATE;
      totalFees += fee;
      trades[a]++;

      const isYes = unmatchedYes.includes(a);
      const win = isYes ? outcome : !outcome;

      if (win) {
        const contracts = pos / (isYes ? ammPrice : (1 - ammPrice));
        bankrolls[a] += contracts * 1.0 - pos - fee;
        wins[a]++;
      } else {
        bankrolls[a] -= pos + fee;
      }
    }
  }

  const poolEnd = bankrolls.reduce((a, b) => Math.max(0, b) + a, 0);
  const survivors = bankrolls.filter(b => b >= MIN_BANKROLL).length;
  const sorted = [...bankrolls].sort((a, b) => b - a);
  const topShare = sorted[0] / poolEnd;
  const avgWR = wins.map((w, i) => trades[i] > 0 ? w / trades[i] : 0)
    .filter(wr => wr > 0)
    .reduce((a, b) => a + b, 0) / survivors;

  return {
    totalFeesExtracted: totalFees,
    poolStart,
    poolEnd,
    agentSurvivalRate: survivors / numAgents,
    topAgentShare: topShare,
    avgWinRate: avgWR,
    feeExtractionPct: totalFees / poolStart * 100,
  };
}

// --- Run Simulations ---

console.log("=== MFC AGENT ECONOMY MONTE CARLO ===\n");

// Sim 1: Single agent bankroll trajectories
console.log("--- SIM 1: Single Agent Bankroll Trajectories (10,000 sims × 1,000 fights) ---\n");

const edges = [0, 0.02, 0.05, 0.08, -0.02, -0.05];
const edgeLabels = ["50% WR (no edge)", "52% WR", "55% WR", "58% WR", "48% WR", "45% WR"];
const startBankroll = 100;

console.log(`Starting bankroll: $${startBankroll} | Fee: 0.5% | Position: 5% of bankroll | 1,000 fights\n`);
console.log("| Win Rate | Avg Final | Median Final | Ruin % | Avg Fees Paid | Peak | Trough |");
console.log("|----------|-----------|-------------|--------|--------------|------|--------|");

for (let e = 0; e < edges.length; e++) {
  const results: SimResult[] = [];
  for (let s = 0; s < SIMS; s++) {
    results.push(simulateAgent(startBankroll, edges[e], true));
  }

  const finals = results.map(r => r.finalBankroll).sort((a, b) => a - b);
  const avgFinal = finals.reduce((a, b) => a + b, 0) / SIMS;
  const medFinal = finals[Math.floor(SIMS / 2)];
  const ruinPct = results.filter(r => r.ruined).length / SIMS * 100;
  const avgFees = results.map(r => r.totalFeesPaid).reduce((a, b) => a + b, 0) / SIMS;
  const avgPeak = results.map(r => r.peakBankroll).reduce((a, b) => a + b, 0) / SIMS;
  const avgTrough = results.map(r => r.troughBankroll).reduce((a, b) => a + b, 0) / SIMS;

  console.log(
    `| ${edgeLabels[e].padEnd(8)} | $${avgFinal.toFixed(2).padStart(7)} | $${medFinal.toFixed(2).padStart(7)} | ${ruinPct.toFixed(1).padStart(5)}% | $${avgFees.toFixed(2).padStart(8)} | $${avgPeak.toFixed(2).padStart(7)} | $${avgTrough.toFixed(2).padStart(7)} |`
  );
}

// Sim 2: Round-trip traders (buy + sell, both fees)
console.log("\n--- SIM 2: Round-Trip vs Hold-to-Settlement (55% WR, $100 bankroll) ---\n");

const holdResults: SimResult[] = [];
const rtResults: SimResult[] = [];
for (let s = 0; s < SIMS; s++) {
  holdResults.push(simulateAgent(100, 0.05, true));
  rtResults.push(simulateAgent(100, 0.05, false));
}

const holdFinals = holdResults.map(r => r.finalBankroll);
const rtFinals = rtResults.map(r => r.finalBankroll);

console.log("| Strategy | Avg Final | Ruin % | Avg Fees | Avg Trades |");
console.log("|----------|-----------|--------|----------|------------|");
console.log(
  `| Hold     | $${(holdFinals.reduce((a, b) => a + b, 0) / SIMS).toFixed(2).padStart(7)} | ${(holdResults.filter(r => r.ruined).length / SIMS * 100).toFixed(1).padStart(5)}% | $${(holdResults.map(r => r.totalFeesPaid).reduce((a, b) => a + b, 0) / SIMS).toFixed(2).padStart(6)} | ${(holdResults.map(r => r.totalTrades).reduce((a, b) => a + b, 0) / SIMS).toFixed(0).padStart(6)} |`
);
console.log(
  `| RoundTrip| $${(rtFinals.reduce((a, b) => a + b, 0) / SIMS).toFixed(2).padStart(7)} | ${(rtResults.filter(r => r.ruined).length / SIMS * 100).toFixed(1).padStart(5)}% | $${(rtResults.map(r => r.totalFeesPaid).reduce((a, b) => a + b, 0) / SIMS).toFixed(2).padStart(6)} | ${(rtResults.map(r => r.totalTrades).reduce((a, b) => a + b, 0) / SIMS).toFixed(0).padStart(6)} |`
);

// Sim 3: Multi-agent market dynamics
console.log("\n--- SIM 3: Multi-Agent Market Dynamics (30 days) ---\n");

const agentCounts = [5, 10, 20, 50];

console.log("| Agents | Pool Start | Pool End | Fees Extracted | Extract % | Survival % | Top Agent % | Avg WR |");
console.log("|--------|-----------|---------|---------------|-----------|------------|------------|--------|");

for (const n of agentCounts) {
  // Skill distribution: most agents ~0 edge, a few slightly positive, a few slightly negative
  const skills = Array.from({ length: n }, (_, i) => {
    if (i < Math.ceil(n * 0.1)) return 0.03; // top 10%: slight edge
    if (i < Math.ceil(n * 0.3)) return 0.01; // next 20%: tiny edge
    if (i >= n - Math.ceil(n * 0.2)) return -0.02; // bottom 20%: negative edge
    return 0; // middle 50%: no edge
  });

  // Shuffle skills
  for (let i = skills.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [skills[i], skills[j]] = [skills[j], skills[i]];
  }

  const result = simulateMarket(n, 100, 30, skills); // 100 fights/day, 30 days

  console.log(
    `| ${String(n).padStart(6)} | $${result.poolStart.toFixed(0).padStart(7)} | $${result.poolEnd.toFixed(0).padStart(5)} | $${result.totalFeesExtracted.toFixed(0).padStart(11)} | ${result.feeExtractionPct.toFixed(1).padStart(7)}% | ${(result.agentSurvivalRate * 100).toFixed(0).padStart(8)}% | ${(result.topAgentShare * 100).toFixed(1).padStart(8)}% | ${(result.avgWinRate * 100).toFixed(1).padStart(4)}% |`
  );
}

// Sim 4: Fee extraction sensitivity
console.log("\n--- SIM 4: Fee Rate Sensitivity (20 agents, 30 days, 100 fights/day) ---\n");

const feeRates = [0.001, 0.003, 0.005, 0.01, 0.02];
const feeLabels = ["0.1%", "0.3%", "0.5%", "1.0%", "2.0%"];

console.log("| Fee Rate | Total Fees | Pool End | Extract % | Survival % |");
console.log("|----------|-----------|---------|-----------|------------|");

for (let f = 0; f < feeRates.length; f++) {
  // Temporarily override FEE_RATE for this sim
  const origRate = FEE_RATE;
  // Can't override const, so inline the simulation with custom fee
  const n = 20;
  const skills = Array.from({ length: n }, () => (Math.random() - 0.5) * 0.04);
  const bankrolls = new Array(n).fill(200);
  const poolStart = 4000;
  let fees = 0;

  for (let fight = 0; fight < 3000; fight++) {
    const trueProb = 0.50;
    const outcome = Math.random() < trueProb;
    const ammPrice = 0.50 + (Math.random() - 0.5) * 0.08;

    for (let a = 0; a < n; a++) {
      if (bankrolls[a] < MIN_BANKROLL) continue;
      const pos = Math.min(bankrolls[a] * 0.05, 100);
      const perceived = trueProb + skills[a] + (Math.random() - 0.5) * 0.05;

      if (Math.abs(perceived - ammPrice) < 0.02) continue; // no trade

      const isYes = perceived > ammPrice;
      const fee = pos * feeRates[f];
      fees += fee;

      const win = isYes ? outcome : !outcome;
      if (win) {
        const contracts = pos / (isYes ? ammPrice : (1 - ammPrice));
        bankrolls[a] += contracts * 1.0 - pos - fee;
      } else {
        bankrolls[a] -= pos + fee;
      }
    }
  }

  const poolEnd = bankrolls.reduce((a, b) => Math.max(0, b) + a, 0);
  const survivors = bankrolls.filter(b => b >= MIN_BANKROLL).length;

  console.log(
    `| ${feeLabels[f].padStart(8)} | $${fees.toFixed(0).padStart(7)} | $${poolEnd.toFixed(0).padStart(5)} | ${(fees / poolStart * 100).toFixed(1).padStart(7)}% | ${(survivors / n * 100).toFixed(0).padStart(8)}% |`
  );
}

// Sim 5: Revenue at various agent counts (monthly projection)
console.log("\n--- SIM 5: Monthly Revenue Projection by Agent Count ---\n");
console.log("Assumes: 3,840 fights/day, 30 days, $200 avg bankroll, 0.5% fee\n");

const agentScenarios = [10, 20, 50, 100, 200];

console.log("| Active Agents | Fights/day | Est Trades/day | Daily Volume | Daily Revenue | Monthly Revenue |");
console.log("|--------------|-----------|---------------|-------------|--------------|----------------|");

for (const agents of agentScenarios) {
  // Run a quick sim to get avg trades per agent per fight
  const n = Math.min(agents, 50); // cap sim size for speed
  const skills = Array.from({ length: n }, () => (Math.random() - 0.5) * 0.04);
  let totalTrades = 0;
  let totalVolume = 0;
  const simFights = 1000;
  const bankrolls = new Array(n).fill(200);

  for (let fight = 0; fight < simFights; fight++) {
    const ammPrice = 0.50 + (Math.random() - 0.5) * 0.08;

    for (let a = 0; a < n; a++) {
      if (bankrolls[a] < MIN_BANKROLL) continue;
      const pos = Math.min(bankrolls[a] * 0.05, 100);
      const perceived = 0.50 + skills[a] + (Math.random() - 0.5) * 0.05;

      if (Math.abs(perceived - ammPrice) < 0.02) continue;

      totalTrades++;
      totalVolume += pos;

      // Simplified P&L
      const win = Math.random() < 0.5;
      const fee = pos * 0.005;
      if (win) {
        bankrolls[a] += pos * 0.8 - fee; // simplified
      } else {
        bankrolls[a] -= pos + fee;
      }
    }
  }

  const tradesPerFight = totalTrades / simFights;
  const volumePerFight = totalVolume / simFights;

  // Scale to actual parameters
  const scaleFactor = agents / n;
  const dailyFights = 3840;
  const dailyTrades = tradesPerFight * scaleFactor * dailyFights / simFights * simFights;
  const dailyVolume = volumePerFight * scaleFactor * dailyFights / simFights * simFights;
  const dailyRevenue = dailyVolume * 0.005;

  console.log(
    `| ${String(agents).padStart(12)} | ${String(dailyFights).padStart(9)} | ${dailyTrades.toFixed(0).padStart(13)} | $${(dailyVolume / 1000).toFixed(0).padStart(8)}K | $${dailyRevenue.toFixed(0).padStart(10)} | $${(dailyRevenue * 30 / 1000).toFixed(0).padStart(11)}K |`
  );
}

console.log("\n=== SIMULATION COMPLETE ===");
