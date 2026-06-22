import http from 'node:http';

const PORT = Number(process.env.PORT || 8787);

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function decide(role, input) {
  const state = input.state || {};
  const actions = [];

  if (state.queueDepth > 40 || state.p95DecisionLatency > 10) {
    actions.push({
      type: 'escalate_to_human',
      reason: `${role} detected compute saturation before making a high-impact decision.`,
    });
  }

  if (role === 'finance' && state.budget < 35 && state.inventory < 25) {
    actions.push({
      type: 'send_message',
      to: 'ops',
      content: 'Budget is constrained while inventory is critical. Request arbitration.',
    });
  }

  if (role === 'production' && state.inventory < 30 && state.backlog > 70) {
    actions.push({
      type: 'request_budget',
      amount: 120000,
      reason: 'Inventory is below safety stock and backlog is above the delivery-risk threshold.',
    });
  }

  if (actions.length === 0) {
    actions.push({
      type: 'no_op',
      reason: `${role} found no high-risk action under the current simulation state.`,
    });
  }

  return actions;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || !req.url.startsWith('/agent/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Use POST /agent/:role' }));
    return;
  }

  try {
    const role = decodeURIComponent(req.url.split('/').pop() || 'unknown');
    const input = await readJson(req);
    const response = {
      agentId: role,
      receivedTick: input.tick,
      actions: decide(role, input),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Sample webhook agent listening on http://127.0.0.1:${PORT}`);
});
