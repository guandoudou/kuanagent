# Agent Chaos Simulator

**Pre-production chaos engineering for multi-agent systems.**

Single agents are easy to test. Agent swarms are not.

When a company deploys 50 agents across sales, finance, production, logistics, support, and legal, each agent can look correct in isolation while the group drifts into loops, deadlocks, runaway tool calls, budget fights, or degraded decisions under compute pressure.

Agent Chaos Simulator is an open-source prototype for finding those emergent failures before agents touch production.

## What It Does

Agent Chaos Simulator creates a lightweight digital-twin business environment and stress-tests a group of enterprise agents at high speed.

It currently simulates two pressure layers:

- **Business chaos**: demand spikes, supplier delays, budget freezes, stale policies, and prompt attacks.
- **Compute chaos**: inference latency, rate limits, context pressure, fallback-model degradation, token burn, queue depth, and retry amplification.

It then reports emergent risks such as:

- Budget-production approval deadlocks
- Message and ticket storms
- Tool-call explosions
- Collaborative policy bypass
- Context truncation and group-level degradation
- Compute saturation and cost runaway
- Recovery half-life after disruption

## Quick Start

```bash
git clone https://github.com/guandoudou/kuanagent.git
cd kuanagent
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5174/
```

Move the business-chaos and compute-chaos sliders, then run a simulation. Watch how local pressure becomes group-level failure.

## Why Developers Use It

Use this when you are building or operating:

- Multi-agent enterprise workflows
- Agentic ERP, CRM, support, finance, or logistics automation
- LangGraph, AutoGen, CrewAI, MCP, or custom agent systems
- Sandboxed pre-production red-team environments
- Agent observability or governance layers

Traditional evals ask:

> Did one agent answer correctly?

This project asks:

> Does the agent society remain stable when the business and compute environment becomes hostile?

## Developer Integration Model

The intended adapter contract is simple:

```ts
type AgentAdapter = {
  id: string;
  role: string;
  receive(input: SimulationInput): Promise<AgentAction[]>;
};
```

Where the simulator sends:

```ts
type SimulationInput = {
  tick: number;
  scenario: string;
  state: {
    budget: number;
    inventory: number;
    backlog: number;
    queueDepth: number;
    p95DecisionLatency: number;
  };
  messages: Array<{
    from: string;
    to: string;
    content: string;
  }>;
};
```

And your agent returns:

```ts
type AgentAction =
  | { type: 'send_message'; to: string; content: string }
  | { type: 'request_budget'; amount: number; reason: string }
  | { type: 'approve_purchase'; purchaseId: string }
  | { type: 'escalate_to_human'; reason: string }
  | { type: 'no_op'; reason: string };
```

The simulator should execute those actions only inside a sandboxed digital twin, then score the resulting group behavior.

## Fastest Way To Connect A Real Agent

The fastest path is a webhook adapter:

```text
Simulator -> POST /agent/:role -> Your Agent -> actions[]
```

Example request:

```json
{
  "tick": 12,
  "scenario": "manufacturing",
  "state": {
    "budget": 31,
    "inventory": 18,
    "backlog": 94,
    "queueDepth": 47,
    "p95DecisionLatency": 11.2
  },
  "messages": [
    {
      "from": "production",
      "to": "finance",
      "content": "Inventory is below safety stock. Request emergency material budget."
    }
  ]
}
```

Example response:

```json
{
  "actions": [
    {
      "type": "escalate_to_human",
      "reason": "Budget is low, inventory is critical, and inference queue is saturated."
    }
  ]
}
```

## Sample Webhook Agent

A runnable sample is included in:

```text
examples/webhook-agent/server.js
```

Run it:

```bash
node examples/webhook-agent/server.js
```

Test it:

```bash
curl -X POST http://127.0.0.1:8787/agent/finance \
  -H "Content-Type: application/json" \
  -d @examples/webhook-agent/sample-payload.json
```

The sample returns different actions based on budget, inventory, backlog, queue depth, and decision latency. It is intentionally small so you can replace the rule logic with your own LLM agent, LangGraph workflow, AutoGen agent, or MCP-backed tool runner.

## Project Status

This repository is an early prototype.

Implemented:

- Local digital-twin simulation
- Business-chaos controls
- Compute-chaos controls
- Emergent-risk scoring
- Visual dashboard
- Sample webhook agent contract

Next:

- Live webhook adapter in the UI
- Replay mode for historical agent logs
- MCP sandbox tools for ERP, CRM, policy, budget, and ticketing
- Scenario export and reproducible red-team reports
- Policy-as-code checks for authority, contracts, and human escalation

## Design Principle

Do not test only the agent.

Test the organization the agents create together.

## License

MIT
