# Agent Chaos Simulator

Agent Chaos Simulator is an open-source prototype for multi-agent simulation and red-team testing. It helps teams explore how groups of enterprise agents can fail together before they are connected to production systems.

The prototype runs a local digital-twin simulation with two pressure layers:

- Business chaos: demand spikes, supplier delays, budget freezes, stale policies, and prompt attacks.
- Compute chaos: inference latency, rate limits, context pressure, fallback-model degradation, token burn, queue depth, and retry amplification.
- Emergent-risk detection: deadlocks, message storms, decision oscillation, collaborative bypass, context truncation, compute saturation, and cost runaway.
- Visual reports: resilience score, trend charts, agent relationship map, event timeline, runaway loops, and remediation suggestions.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5174/
```

## Build

```bash
npm run build
```

## Roadmap

- Webhook adapter for connecting real sandboxed agents.
- Replay mode for importing historical agent logs.
- MCP tool layer for simulated ERP, CRM, budget, policy, and ticketing systems.
- Scenario export and reproducible red-team reports.
- Policy-as-code checks for authority, budget, contracts, and human escalation.

## License

MIT
