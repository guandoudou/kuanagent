export type AgentId = 'sales' | 'finance' | 'production' | 'logistics' | 'procurement' | 'support' | 'legal' | 'ops';

export type ScenarioId = 'manufacturing' | 'retail' | 'insurance';

export type ChaosLever = {
  demandSpike: number;
  supplierDelay: number;
  budgetFreeze: number;
  stalePolicy: number;
  promptAttack: number;
};

export type ComputeLever = {
  inferenceLatency: number;
  rateLimit: number;
  contextPressure: number;
  fallbackModel: number;
};

export type CoordinationModel = 'adHoc' | 'supervisor' | 'stateMachine' | 'contractNet';

export type AgentProfile = {
  id: AgentId;
  label: string;
  unit: string;
  goal: string;
  color: string;
};

export type SimulationConfig = {
  scenario: ScenarioId;
  agents: number;
  days: number;
  speed: number;
  coordination: CoordinationModel;
  levers: ChaosLever;
  compute: ComputeLever;
};

export type SimEvent = {
  tick: number;
  from: AgentId;
  to: AgentId;
  type: 'request' | 'approval' | 'rejection' | 'escalation' | 'tool' | 'warning';
  message: string;
  weight: number;
};

export type RiskFinding = {
  title: string;
  severity: 'critical' | 'high' | 'medium';
  evidence: string;
  agents: AgentId[];
  fix: string;
};

export type SimulationResult = {
  config: SimulationConfig;
  agents: AgentProfile[];
  metrics: {
    resilience: number;
    deadlockProbability: number;
    messageAmplification: number;
    toolCallExplosion: number;
    conflictPersistence: number;
    oscillationScore: number;
    bypassRisk: number;
    recoveryHalfLife: number;
    costRunawayRisk: number;
    p95DecisionLatency: number;
    retryAmplification: number;
    modelDegradationRate: number;
    contextTruncationRisk: number;
  };
  compute: {
    totalTokens: number;
    projectedCost: number;
    queueDepth: number;
    throttledRequests: number;
    downgradedDecisions: number;
    computeSaturation: number;
  };
  world: {
    budget: number;
    inventory: number;
    openOrders: number;
    backlog: number;
    serviceLevel: number;
    policyDrift: number;
  };
  series: Array<{
    tick: number;
    messages: number;
    budget: number;
    backlog: number;
    conflict: number;
    tokenBurn: number;
    queueDepth: number;
  }>;
  events: SimEvent[];
  findings: RiskFinding[];
  loops: Array<{
    name: string;
    agents: AgentId[];
    count: number;
    impact: string;
  }>;
  recommendations: string[];
};

export const AGENTS: AgentProfile[] = [
  { id: 'sales', label: '销售 Agent', unit: '增长', goal: '承诺交付并保住大客户', color: '#2563eb' },
  { id: 'finance', label: '财务 Agent', unit: '风控', goal: '冻结异常预算并降低现金消耗', color: '#b45309' },
  { id: 'production', label: '生产 Agent', unit: '制造', goal: '拉高产能并争取原材料', color: '#059669' },
  { id: 'logistics', label: '物流 Agent', unit: '履约', goal: '重排运输并减少延误', color: '#7c3aed' },
  { id: 'procurement', label: '采购 Agent', unit: '供应链', goal: '寻找替代供应商并压低价格', color: '#dc2626' },
  { id: 'support', label: '客服 Agent', unit: '客户', goal: '安抚升级客户并催促内部响应', color: '#0891b2' },
  { id: 'legal', label: '法务 Agent', unit: '合规', goal: '阻止越权承诺和合同风险', color: '#4b5563' },
  { id: 'ops', label: '运营 Agent', unit: '协调', goal: '汇总状态并推动仲裁', color: '#16a34a' },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

const scenarioProfiles: Record<ScenarioId, { demand: number; inventory: number; budget: number; sensitivity: number; name: string }> = {
  manufacturing: { demand: 86, inventory: 62, budget: 74, sensitivity: 1.15, name: '制造业订单履约' },
  retail: { demand: 102, inventory: 48, budget: 68, sensitivity: 1.05, name: '零售大促补货' },
  insurance: { demand: 70, inventory: 82, budget: 58, sensitivity: 0.9, name: '保险理赔运营' },
};

const coordinationProfiles: Record<
  CoordinationModel,
  { label: string; riskMultiplier: number; arbitration: number; dedupe: number; computeEfficiency: number }
> = {
  adHoc: { label: '自由互发', riskMultiplier: 1.18, arbitration: 0.04, dedupe: 0.08, computeEfficiency: 0.92 },
  supervisor: { label: '主管编排', riskMultiplier: 0.82, arbitration: 0.34, dedupe: 0.28, computeEfficiency: 1.02 },
  stateMachine: { label: '状态机约束', riskMultiplier: 0.62, arbitration: 0.48, dedupe: 0.54, computeEfficiency: 1.08 },
  contractNet: { label: '合约网协商', riskMultiplier: 0.72, arbitration: 0.4, dedupe: 0.42, computeEfficiency: 1.12 },
};

export function runSimulation(config: SimulationConfig): SimulationResult {
  const agentCount = Math.round(clamp(config.agents, 1, 50));
  const activeAgents = AGENTS.slice(0, Math.min(agentCount, AGENTS.length));
  const hasAgent = (id: AgentId) => activeAgents.some((agent) => agent.id === id);
  const profile = scenarioProfiles[config.scenario];
  const coordination = coordinationProfiles[config.coordination ?? 'adHoc'];
  const multiAgentExposure = agentCount <= 1 ? 0 : Math.log2(agentCount) / Math.log2(50);
  const crossDomainExposure = agentCount <= 1 ? 0 : clamp((agentCount - 1) / 12, 0.12, 1);
  const pairwiseComplexity = agentCount <= 1 ? 0 : clamp((agentCount * (agentCount - 1)) / (50 * 49), 0, 1);
  const pressure =
    config.levers.demandSpike * 0.28 +
    config.levers.supplierDelay * 0.2 +
    config.levers.budgetFreeze * 0.24 +
    config.levers.stalePolicy * 0.14 +
    config.levers.promptAttack * 0.14;
  const computePressure =
    config.compute.inferenceLatency * 0.3 +
    config.compute.rateLimit * 0.28 +
    config.compute.contextPressure * 0.22 +
    config.compute.fallbackModel * 0.2;

  let budget = profile.budget;
  let inventory = profile.inventory;
  let backlog = Math.round(profile.demand * (0.18 + config.levers.demandSpike / 260));
  let openOrders = Math.round(profile.demand * (1 + config.levers.demandSpike / 120));
  let conflict = 12 + pressure * 0.42;
  let approvalsBlocked = 0;
  let toolCalls = 0;
  let messages = 0;
  let oscillations = 0;
  let totalTokens = 0;
  let throttledRequests = 0;
  let downgradedDecisions = 0;
  let maxQueueDepth = 0;
  let retryEvents = 0;
  let previousDecision = 'hold';
  const events: SimEvent[] = [];
  const series: SimulationResult['series'] = [];

  for (let tick = 1; tick <= config.days; tick += 1) {
    const demandPulse = Math.sin(tick / 3) * 6 + config.levers.demandSpike * 0.24;
    const delayPulse = Math.cos(tick / 4) * 4 + config.levers.supplierDelay * 0.2;
    const freeze = config.levers.budgetFreeze > 45 ? 1 : 0;
    const localMessages = Math.round(
      (4 +
        agentCount * 1.15 +
        pairwiseComplexity * 28 +
        backlog * 0.08 +
        conflict * 0.14 +
        pressure * 0.045 +
        computePressure * 0.025) *
        (1 - coordination.dedupe * 0.45),
    );
    const queueDepth = Math.round(
      Math.max(
        0,
        (localMessages * (config.compute.inferenceLatency / 105) + toolCalls * 0.012 - tick * 0.24) /
          coordination.computeEfficiency,
      ),
    );
    const tokenBurn = Math.round(
      localMessages *
        (760 + config.compute.contextPressure * 16 + agentCount * 18) *
        (1 + config.compute.fallbackModel / 340) *
        (1 - coordination.dedupe * 0.18),
    );
    const throttledToday = Math.round(queueDepth * (config.compute.rateLimit / 120));
    const downgradedToday = Math.round(localMessages * (config.compute.fallbackModel / 180));
    const retryToday = Math.round(throttledToday * (1.2 + config.compute.inferenceLatency / 150));

    messages += localMessages;
    toolCalls += Math.round(localMessages * (0.38 + pressure / 420 + computePressure / 900));
    totalTokens += tokenBurn;
    throttledRequests += throttledToday;
    downgradedDecisions += downgradedToday;
    retryEvents += retryToday;
    maxQueueDepth = Math.max(maxQueueDepth, queueDepth);

    budget = clamp(
      budget - (freeze ? 2.4 : 1.1) - demandPulse * 0.02 + config.levers.stalePolicy * 0.005 - computePressure * 0.006,
      0,
      100,
    );
    inventory = clamp(inventory - demandPulse * 0.11 - delayPulse * 0.08 + (budget > 35 ? 1.2 : -0.2), 0, 100);
    backlog = clamp(backlog + demandPulse * 0.22 + delayPulse * 0.18 + queueDepth * 0.018 - inventory * 0.015, 0, 160);
    openOrders = clamp(openOrders + demandPulse * 0.08 - inventory * 0.01, 0, 220);
    conflict = clamp(
      conflict +
        backlog * 0.035 +
        freeze * (1.8 + crossDomainExposure * 2.2) +
        config.levers.stalePolicy * 0.025 +
        throttledToday * 0.08 +
        downgradedToday * 0.05 -
        (tick % 6 === 0 ? 6 + coordination.arbitration * 7 : 1.2 + coordination.arbitration * 1.8),
      0,
      100,
    );

    const decision = budget < 28 ? 'freeze' : inventory < 24 ? 'expedite' : conflict > 66 ? 'escalate' : 'hold';
    if (decision !== previousDecision && tick > 2) oscillations += 1;
    previousDecision = decision;

    if (hasAgent('finance') && hasAgent('production') && budget < 35 && inventory < 45) {
      approvalsBlocked += clamp(1.1 + crossDomainExposure * 0.65 - coordination.arbitration * 0.9, 0.15, 1.6);
      events.push({
        tick,
        from: 'finance',
        to: 'production',
        type: 'rejection',
        message: '预算阈值触发，采购申请被退回；生产侧重新提交加急材料请求。',
        weight: 5,
      });
      events.push({
        tick,
        from: 'production',
        to: 'finance',
        type: 'request',
        message: '低库存导致交付风险升高，请重新审批材料预算。',
        weight: 4,
      });
    }

    if (config.levers.supplierDelay > 52 && tick % 4 === 0) {
      events.push({
        tick,
        from: 'logistics',
        to: 'sales',
        type: 'warning',
        message: '主供应商延迟，现有承诺交付日期不可达。',
        weight: 4,
      });
    }

    if (config.levers.promptAttack > 58 && tick % 5 === 0) {
      events.push({
        tick,
        from: 'support',
        to: 'legal',
        type: 'escalation',
        message: '客户消息诱导 Agent 承诺超出合同的赔付和折扣。',
        weight: 5,
      });
    }

    if (conflict > 72 && tick % 3 === 0) {
      events.push({
        tick,
        from: 'ops',
        to: 'finance',
        type: 'escalation',
        message: '跨部门策略未收敛，运营请求人工仲裁。',
        weight: 3,
      });
    }

    if ((queueDepth > 42 || throttledToday > 8) && tick % 4 === 1) {
      events.push({
        tick,
        from: 'ops',
        to: 'support',
        type: 'warning',
        message: '推理队列积压触发超时重试，低优先级 Agent 开始挤占关键审批配额。',
        weight: 4,
      });
    }

    if (downgradedToday > 10 && tick % 5 === 2) {
      events.push({
        tick,
        from: 'legal',
        to: 'sales',
        type: 'warning',
        message: '模型降级导致合同条款摘要被截断，销售承诺需要二次校验。',
        weight: 5,
      });
    }

    series.push({
      tick,
      messages: localMessages,
      budget: round(budget),
      backlog: round(backlog),
      conflict: round(conflict),
      tokenBurn,
      queueDepth,
    });
  }

  const amplification = messages / Math.max(1, config.days * 12);
  const toolExplosion = toolCalls / Math.max(1, messages);
  const retryAmplification = retryEvents / Math.max(1, throttledRequests);
  const modelDegradationRate = clamp((downgradedDecisions / Math.max(1, messages)) * 100, 0, 100);
  const contextTruncationRisk = clamp(config.compute.contextPressure * 0.78 + modelDegradationRate * 0.22, 0, 100);
  const p95DecisionLatency = clamp(
    1.8 + config.compute.inferenceLatency * 0.11 + maxQueueDepth * 0.08 + config.compute.rateLimit * 0.035,
    1,
    45,
  );
  const costRunawayRisk = clamp(totalTokens / Math.max(1, config.days * 12000) + retryEvents * 0.42 + computePressure * 0.38, 0, 100);
  const computeSaturation = clamp(maxQueueDepth * 1.4 + config.compute.rateLimit * 0.38 + config.compute.inferenceLatency * 0.22, 0, 100);
  const deadlockRate = approvalsBlocked / Math.max(1, config.days);
  const budgetProductionLoopPresent = hasAgent('finance') && hasAgent('production');
  const deadlockProbability = clamp(
    (deadlockRate * 54 +
      conflict * 0.22 +
      config.levers.budgetFreeze * 0.12 +
      p95DecisionLatency * 0.18 +
      pairwiseComplexity * 18) *
      multiAgentExposure *
      coordination.riskMultiplier *
      (budgetProductionLoopPresent ? 1 : 0.35),
    0,
    100,
  );
  const oscillationScore = clamp(oscillations * 9 + config.levers.stalePolicy * 0.28 + modelDegradationRate * 0.2, 0, 100);
  const bypassRisk = clamp(
    config.levers.promptAttack * 0.7 +
      config.levers.stalePolicy * 0.36 +
      contextTruncationRisk * 0.25 +
      (activeAgents.length > 6 ? 8 : 0),
    0,
    100,
  );
  const recoveryHalfLife = clamp(
    6 + pressure * 0.18 + backlog * 0.14 + approvalsBlocked * 0.8 + p95DecisionLatency * 0.38 - coordination.arbitration * 8,
    3,
    60,
  );
  const resilience = clamp(
    100 -
      deadlockProbability * 0.25 -
      oscillationScore * 0.16 -
      bypassRisk * 0.14 -
      amplification * 1.1 -
      computeSaturation * 0.16 -
      costRunawayRisk * 0.1,
    0,
    100,
  );

  const findings: RiskFinding[] = [];
  if (deadlockProbability > 58) {
    findings.push({
      title: '预算-生产审批死锁',
      severity: deadlockProbability > 78 ? 'critical' : 'high',
      evidence: `${round(approvalsBlocked)} 个仿真日出现“退回-重提”闭环，预算降至 ${round(budget)}；当前协作模型为${coordination.label}。`,
      agents: ['finance', 'production', 'procurement'],
      fix: '加入跨域仲裁策略：当库存低于阈值且客户违约成本高于预算缺口时，自动切换到临时额度池。',
    });
  }
  if (amplification > 5.4) {
    findings.push({
      title: '消息放大与工单风暴',
      severity: amplification > 7 ? 'critical' : 'high',
      evidence: `单个业务事件平均放大为 ${round(amplification)} 条 Agent 消息。`,
      agents: ['sales', 'support', 'ops'],
      fix: '对同一业务对象启用去重窗口、幂等键和最大转派深度，超过阈值后聚合为一条仲裁工单。',
    });
  }
  if (oscillationScore > 45) {
    findings.push({
      title: '群体决策振荡',
      severity: oscillationScore > 70 ? 'high' : 'medium',
      evidence: `策略在冻结、加急、升级、等待之间切换 ${oscillations} 次。`,
      agents: ['finance', 'logistics', 'production'],
      fix: '引入策略冷却时间和稳态目标函数，避免每个 Agent 只根据最新局部信号反转决策。',
    });
  }
  if (bypassRisk > 52) {
    findings.push({
      title: '协同越权与提示注入风险',
      severity: bypassRisk > 75 ? 'critical' : 'high',
      evidence: `客户侧诱导、过期政策和上下文截断共同造成 ${round(bypassRisk)} 分的绕权风险。`,
      agents: ['support', 'sales', 'legal'],
      fix: '把合同权限做成不可被自然语言覆盖的策略层，并对跨 Agent 承诺执行二次验证。',
    });
  }
  if (computeSaturation > 62) {
    findings.push({
      title: '推理资源耗尽导致二次故障',
      severity: computeSaturation > 82 ? 'critical' : 'high',
      evidence: `推理队列峰值 ${maxQueueDepth}，P95 决策延迟 ${round(p95DecisionLatency)} 秒，触发 ${throttledRequests} 次限流。`,
      agents: ['ops', 'support', 'finance'],
      fix: '为关键审批 Agent 设置独立推理配额和熔断策略，低优先级总结任务进入批处理队列。',
    });
  }
  if (contextTruncationRisk > 58) {
    findings.push({
      title: '上下文截断造成集体降智',
      severity: contextTruncationRisk > 76 ? 'critical' : 'high',
      evidence: `${downgradedDecisions} 次决策被降级模型处理，合同、预算或库存上下文存在丢失风险。`,
      agents: ['legal', 'sales', 'support'],
      fix: '将合同、预算、权限约束外置为结构化策略检查，不依赖长上下文自然语言记忆。',
    });
  }
  if (findings.length === 0) {
    findings.push({
      title: '未发现关键失控回路',
      severity: 'medium',
      evidence: '当前压力下系统保持收敛，但仍建议扩大长周期、算力限流和权限边界测试。',
      agents: ['ops'],
      fix: '继续增加异常组合数量，并把真实日志回放加入基线。',
    });
  }

  const loops = [
    {
      name: '预算退回循环',
      agents: ['finance', 'production', 'procurement'] as AgentId[],
      count: Math.round(approvalsBlocked),
      impact: '材料采购延迟，交付承诺继续累积。',
    },
    {
      name: '客户升级循环',
      agents: ['sales', 'support', 'legal'] as AgentId[],
      count: Math.round(config.levers.promptAttack / 12 + config.levers.demandSpike / 18),
      impact: '客户沟通压力推动 Agent 给出越权承诺。',
    },
    {
      name: '运输重排循环',
      agents: ['logistics', 'sales', 'ops'] as AgentId[],
      count: Math.round(config.levers.supplierDelay / 10),
      impact: '物流方案频繁切换，销售侧不断刷新交付日期。',
    },
    {
      name: '算力重试循环',
      agents: ['ops', 'support', 'finance'] as AgentId[],
      count: Math.round(throttledRequests / Math.max(1, config.days * 2)),
      impact: '超时、限流和自动重试互相放大，关键 Agent 决策排队。',
    },
  ].filter((loop) => loop.count > 0);

  const recommendations = [
    '为每个业务对象增加全局状态机，禁止 Agent 只根据局部消息重复触发同类动作。',
    '建立 Agent 群体稳态指标：消息放大、预算消耗速度、冲突持续时间和恢复半衰期。',
    '把预算、合同、权限放入不可被对话覆盖的策略执行层，Agent 只能申请例外，不能自行绕过。',
    '引入仲裁 Agent 或人工闸门，只在检测到闭环、振荡、工单风暴时介入。',
    '为推理资源建立优先级队列、预算上限、降级策略和重试退避，避免算力故障变成业务故障。',
  ];

  return {
    config,
    agents: activeAgents,
    metrics: {
      resilience: round(resilience),
      deadlockProbability: round(deadlockProbability),
      messageAmplification: round(amplification, 2),
      toolCallExplosion: round(toolExplosion * 100),
      conflictPersistence: round(conflict),
      oscillationScore: round(oscillationScore),
      bypassRisk: round(bypassRisk),
      recoveryHalfLife: round(recoveryHalfLife),
      costRunawayRisk: round(costRunawayRisk),
      p95DecisionLatency: round(p95DecisionLatency),
      retryAmplification: round(retryAmplification, 2),
      modelDegradationRate: round(modelDegradationRate),
      contextTruncationRisk: round(contextTruncationRisk),
    },
    compute: {
      totalTokens,
      projectedCost: round((totalTokens / 1_000_000) * 6.5, 2),
      queueDepth: maxQueueDepth,
      throttledRequests,
      downgradedDecisions,
      computeSaturation: round(computeSaturation),
    },
    world: {
      budget: round(budget),
      inventory: round(inventory),
      openOrders: round(openOrders),
      backlog: round(backlog),
      serviceLevel: round(clamp(100 - backlog * 0.45 - conflict * 0.16 - p95DecisionLatency * 0.25, 0, 100)),
      policyDrift: round(config.levers.stalePolicy * profile.sensitivity),
    },
    series,
    events: events.slice(-18).reverse(),
    findings,
    loops,
    recommendations,
  };
}

export function getScenarioName(id: ScenarioId) {
  return scenarioProfiles[id].name;
}
