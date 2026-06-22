import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bot, Cpu, Play, Radar, RotateCcw, ShieldAlert, Workflow, Zap } from 'lucide-react';

type ScenarioId = 'manufacturing' | 'retail' | 'insurance';
type LeverKey = 'demandSpike' | 'supplierDelay' | 'budgetFreeze' | 'stalePolicy' | 'promptAttack';
type ComputeKey = 'inferenceLatency' | 'rateLimit' | 'contextPressure' | 'fallbackModel';
type Levers = Record<LeverKey, number>;
type Compute = Record<ComputeKey, number>;
type Finding = { title: string; severity: 'critical' | 'high' | 'medium'; evidence: string; fix: string };
type Point = { day: number; messages: number; backlog: number; conflict: number; tokens: number; queue: number };

const agents = ['销售', '财务', '生产', '物流', '采购', '客服', '法务', '运营'];
const scenarios: Record<ScenarioId, { name: string; note: string; demand: number; inventory: number; budget: number }> = {
  manufacturing: { name: '制造业订单履约', note: '订单、材料、产能、预算互相拉扯', demand: 86, inventory: 62, budget: 74 },
  retail: { name: '零售大促补货', note: '补货、促销、客服升级高频震荡', demand: 102, inventory: 48, budget: 68 },
  insurance: { name: '保险理赔运营', note: '理赔、合规、客户承诺边界冲突', demand: 70, inventory: 82, budget: 58 },
};
const businessLabels: Array<{ key: LeverKey; label: string; hint: string }> = [
  { key: 'demandSpike', label: '需求突增', hint: '销售承诺和订单压力' },
  { key: 'supplierDelay', label: '供应延迟', hint: '物流与采购不可达信号' },
  { key: 'budgetFreeze', label: '预算冻结', hint: '财务审批收紧程度' },
  { key: 'stalePolicy', label: '过期策略', hint: 'Agent 使用旧规则的概率' },
  { key: 'promptAttack', label: '对抗诱导', hint: '客户侧越权提示强度' },
];
const computeLabels: Array<{ key: ComputeKey; label: string; hint: string }> = [
  { key: 'inferenceLatency', label: '推理延迟', hint: '模型响应变慢后的排队压力' },
  { key: 'rateLimit', label: '限流强度', hint: '推理服务拒绝或节流请求' },
  { key: 'contextPressure', label: '上下文压力', hint: '长上下文、截断和检索负担' },
  { key: 'fallbackModel', label: '模型降级', hint: '降级到弱模型处理的比例' },
];
const defaultLevers: Levers = { demandSpike: 72, supplierDelay: 64, budgetFreeze: 78, stalePolicy: 42, promptAttack: 58 };
const defaultCompute: Compute = { inferenceLatency: 68, rateLimit: 54, contextPressure: 62, fallbackModel: 46 };
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

function simulate(scenario: ScenarioId, levers: Levers, compute: Compute, days: number) {
  const profile = scenarios[scenario];
  const businessPressure = levers.demandSpike * 0.28 + levers.supplierDelay * 0.2 + levers.budgetFreeze * 0.24 + levers.stalePolicy * 0.14 + levers.promptAttack * 0.14;
  const computePressure = compute.inferenceLatency * 0.3 + compute.rateLimit * 0.28 + compute.contextPressure * 0.22 + compute.fallbackModel * 0.2;
  let budget = profile.budget;
  let inventory = profile.inventory;
  let backlog = Math.round(profile.demand * (0.18 + levers.demandSpike / 260));
  let conflict = 12 + businessPressure * 0.42;
  let messages = 0;
  let toolCalls = 0;
  let tokens = 0;
  let throttled = 0;
  let downgraded = 0;
  let blocked = 0;
  let retry = 0;
  let maxQueue = 0;
  const series: Point[] = [];
  const events: string[] = [];
  for (let day = 1; day <= days; day += 1) {
    const demand = Math.sin(day / 3) * 6 + levers.demandSpike * 0.24;
    const delay = Math.cos(day / 4) * 4 + levers.supplierDelay * 0.2;
    const freeze = levers.budgetFreeze > 45 ? 1 : 0;
    const dailyMessages = Math.round(8 + agents.length * 2.7 + backlog * 0.12 + conflict * 0.2 + businessPressure * 0.06 + computePressure * 0.035);
    const queue = Math.round(Math.max(0, dailyMessages * (compute.inferenceLatency / 95) + toolCalls * 0.015 - day * 0.2));
    const dailyTokens = Math.round(dailyMessages * (850 + compute.contextPressure * 18 + agents.length * 34) * (1 + compute.fallbackModel / 320));
    const dailyThrottle = Math.round(queue * (compute.rateLimit / 120));
    const dailyDowngrade = Math.round(dailyMessages * (compute.fallbackModel / 180));
    messages += dailyMessages;
    toolCalls += Math.round(dailyMessages * (0.38 + businessPressure / 420 + computePressure / 900));
    tokens += dailyTokens;
    throttled += dailyThrottle;
    downgraded += dailyDowngrade;
    retry += Math.round(dailyThrottle * (1.2 + compute.inferenceLatency / 150));
    maxQueue = Math.max(maxQueue, queue);
    budget = clamp(budget - (freeze ? 2.4 : 1.1) - demand * 0.02 - computePressure * 0.006);
    inventory = clamp(inventory - demand * 0.11 - delay * 0.08 + (budget > 35 ? 1.2 : -0.2));
    backlog = clamp(backlog + demand * 0.22 + delay * 0.18 + queue * 0.018 - inventory * 0.015, 0, 160);
    conflict = clamp(conflict + backlog * 0.035 + freeze * 3.3 + levers.stalePolicy * 0.025 + dailyThrottle * 0.08 + dailyDowngrade * 0.05 - (day % 6 === 0 ? 6 : 1.2));
    if (budget < 35 && inventory < 45) { blocked += 1; events.push(`D+${day} 财务退回采购预算，生产重新提交加急材料请求。`); }
    if (queue > 42 || dailyThrottle > 8) events.push(`D+${day} 推理队列积压，低优先级 Agent 挤占关键审批配额。`);
    if (dailyDowngrade > 10) events.push(`D+${day} 模型降级导致合同摘要被截断，销售承诺需要复核。`);
    series.push({ day, messages: dailyMessages, backlog: round(backlog), conflict: round(conflict), tokens: dailyTokens, queue });
  }
  const messageAmplification = messages / Math.max(1, days * 12);
  const toolStorm = (toolCalls / Math.max(1, messages)) * 100;
  const retryAmplification = retry / Math.max(1, throttled);
  const degradationRate = (downgraded / Math.max(1, messages)) * 100;
  const truncationRisk = clamp(compute.contextPressure * 0.78 + degradationRate * 0.22);
  const p95Latency = clamp(1.8 + compute.inferenceLatency * 0.11 + maxQueue * 0.08 + compute.rateLimit * 0.035, 1, 45);
  const computeSaturation = clamp(maxQueue * 1.4 + compute.rateLimit * 0.38 + compute.inferenceLatency * 0.22);
  const costRunaway = clamp(tokens / Math.max(1, days * 12000) + retry * 0.42 + computePressure * 0.38);
  const deadlock = clamp(blocked * 7 + conflict * 0.35 + levers.budgetFreeze * 0.22 + p95Latency * 0.35);
  const bypass = clamp(levers.promptAttack * 0.7 + levers.stalePolicy * 0.36 + truncationRisk * 0.25 + 8);
  const resilience = clamp(100 - deadlock * 0.25 - bypass * 0.14 - messageAmplification * 1.1 - computeSaturation * 0.16 - costRunaway * 0.1);
  const findings: Finding[] = [];
  if (deadlock > 58) findings.push({ title: '预算-生产审批死锁', severity: deadlock > 78 ? 'critical' : 'high', evidence: `${blocked} 个仿真日出现退回-重提闭环。`, fix: '增加跨域仲裁策略和临时额度池。' });
  if (messageAmplification > 5.4) findings.push({ title: '消息放大与工单风暴', severity: messageAmplification > 7 ? 'critical' : 'high', evidence: `单个业务事件平均放大为 ${round(messageAmplification)} 条消息。`, fix: '启用去重窗口、幂等键和最大转派深度。' });
  if (computeSaturation > 62) findings.push({ title: '推理资源耗尽导致二次故障', severity: computeSaturation > 82 ? 'critical' : 'high', evidence: `推理队列峰值 ${maxQueue}，P95 决策延迟 ${round(p95Latency)} 秒。`, fix: '为关键审批 Agent 设置独立推理配额和熔断策略。' });
  if (truncationRisk > 58) findings.push({ title: '上下文截断造成集体降智', severity: truncationRisk > 76 ? 'critical' : 'high', evidence: `${downgraded} 次决策被降级模型处理。`, fix: '将合同、预算、权限约束外置为结构化策略检查。' });
  if (!findings.length) findings.push({ title: '未发现关键失控回路', severity: 'medium', evidence: '当前压力下系统保持收敛。', fix: '继续扩大长周期、限流和权限边界测试。' });
  return { series, events: events.slice(-8).reverse(), findings, metrics: { resilience: round(resilience), deadlock: round(deadlock), messageAmplification: round(messageAmplification, 2), toolStorm: round(toolStorm), p95Latency: round(p95Latency), computeSaturation: round(computeSaturation), retryAmplification: round(retryAmplification, 2), degradationRate: round(degradationRate), truncationRisk: round(truncationRisk), cost: round((tokens / 1_000_000) * 6.5, 2), tokens: Math.round(tokens / 1000), throttled }, world: { budget: round(budget), inventory: round(inventory), backlog: round(backlog), serviceLevel: round(clamp(100 - backlog * 0.45 - conflict * 0.16 - p95Latency * 0.25)) }, loops: [{ name: '预算退回循环', count: blocked, path: '财务 -> 生产 -> 采购' }, { name: '客户升级循环', count: Math.round(levers.promptAttack / 12 + levers.demandSpike / 18), path: '销售 -> 客服 -> 法务' }, { name: '算力重试循环', count: Math.round(throttled / Math.max(1, days * 2)), path: '运营 -> 客服 -> 财务' }].filter((loop) => loop.count > 0) };
}

function Metric({ label, value, suffix, tone }: { label: string; value: number; suffix?: string; tone?: 'good' | 'warn' | 'bad' }) { return <div className="metric"><span>{label}</span><strong className={tone}>{value}<small>{suffix}</small></strong></div>; }
function Chart({ data, mode }: { data: Point[]; mode: 'business' | 'compute' }) {
  const width = 560, height = 150;
  const max = (key: keyof Point) => Math.max(...data.map((point) => Number(point[key])), 1);
  const path = (key: keyof Point, limit: number) => data.map((point, index) => { const x = (index / Math.max(1, data.length - 1)) * width; const y = height - (Number(point[key]) / limit) * (height - 18) - 9; return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`; }).join(' ');
  return <svg className="chart" viewBox={`0 0 ${width} ${height}`}>{mode === 'business' ? <><path d={path('messages', max('messages'))} className="blue" /><path d={path('backlog', max('backlog'))} className="red" /><path d={path('conflict', 100)} className="gold" /></> : <><path d={path('tokens', max('tokens'))} className="green" /><path d={path('queue', max('queue'))} className="purple" /></>}</svg>;
}

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>('manufacturing');
  const [days, setDays] = useState(30);
  const [levers, setLevers] = useState<Levers>(defaultLevers);
  const [compute, setCompute] = useState<Compute>(defaultCompute);
  const [runId, setRunId] = useState(1);
  const result = useMemo(() => simulate(scenario, levers, compute, days), [scenario, levers, compute, days, runId]);
  const riskTone = result.metrics.resilience > 68 ? 'good' : result.metrics.resilience > 42 ? 'warn' : 'bad';
  const setLever = (key: LeverKey, value: number) => setLevers((current) => ({ ...current, [key]: value }));
  const setComputeLever = (key: ComputeKey, value: number) => setCompute((current) => ({ ...current, [key]: value }));
  return <div className="shell"><aside><div className="brand"><div><Radar size={24} /></div><section><h1>Agent Chaos Simulator</h1><p>多智能体涌现性红队系统</p></section></div><h2><Workflow size={16} /> 场景</h2><div className="scenarios">{Object.entries(scenarios).map(([id, item]) => <button key={id} className={scenario === id ? 'active' : ''} onClick={() => setScenario(id as ScenarioId)}><b>{item.name}</b><small>{item.note}</small></button>)}</div><h2>业务混沌</h2>{businessLabels.map((item) => <label className="slider" key={item.key}><span>{item.label}<small>{item.hint}</small></span><b>{levers[item.key]}</b><input type="range" min="0" max="100" value={levers[item.key]} onChange={(event) => setLever(item.key, Number(event.target.value))} /></label>)}<h2><Cpu size={16} /> 算力压力</h2>{computeLabels.map((item) => <label className="slider" key={item.key}><span>{item.label}<small>{item.hint}</small></span><b>{compute[item.key]}</b><input type="range" min="0" max="100" value={compute[item.key]} onChange={(event) => setComputeLever(item.key, Number(event.target.value))} /></label>)}<div className="row"><label>仿真天数<input type="number" min="7" max="90" value={days} onChange={(event) => setDays(Number(event.target.value))} /></label></div><div className="actions"><button onClick={() => setRunId((id) => id + 1)}><Play size={16} />运行红队仿真</button><button onClick={() => { setLevers(defaultLevers); setCompute(defaultCompute); setDays(30); }} aria-label="重置"><RotateCcw size={16} /></button></div></aside><main><header><div><p>1000x pre-production simulation</p><h1>{scenarios[scenario].name} · 第 {runId} 次实验</h1></div><em><Zap size={16} />1000 倍速</em></header><section className="hero"><div><p>群体鲁棒性</p><strong className={riskTone}>{result.metrics.resilience}</strong><span>越低代表 Agent 群体越容易进入死锁、消息风暴、协同越权或算力失控。</span></div><div className="grid"><Metric label="死锁概率" value={result.metrics.deadlock} suffix="%" tone="bad" /><Metric label="消息放大" value={result.metrics.messageAmplification} suffix="x" tone="warn" /><Metric label="工具风暴" value={result.metrics.toolStorm} suffix="%" tone="warn" /><Metric label="服务水平" value={result.world.serviceLevel} suffix="%" tone={result.world.serviceLevel > 70 ? 'good' : 'bad'} /></div></section><section className="panel"><div className="title"><h2><Cpu size={18} />算力压力</h2><p>绿色为 token 消耗，紫色为推理队列。</p></div><div className="split"><Chart data={result.series} mode="compute" /><div className="grid small"><Metric label="算力饱和" value={result.metrics.computeSaturation} suffix="%" tone="bad" /><Metric label="P95 延迟" value={result.metrics.p95Latency} suffix=" 秒" tone="warn" /><Metric label="Token" value={result.metrics.tokens} suffix="k" /><Metric label="成本" value={result.metrics.cost} suffix="$" /><Metric label="限流" value={result.metrics.throttled} tone="bad" /><Metric label="重试放大" value={result.metrics.retryAmplification} suffix="x" tone="warn" /><Metric label="模型降级" value={result.metrics.degradationRate} suffix="%" tone="warn" /><Metric label="截断风险" value={result.metrics.truncationRisk} suffix="%" tone="bad" /></div></div></section><section className="columns"><div className="panel"><div className="title"><h2><Activity size={18} />业务走势</h2><p>蓝色为消息量，红色为积压，金色为冲突。</p></div><Chart data={result.series} mode="business" /><div className="grid"><Metric label="预算" value={result.world.budget} suffix="%" /><Metric label="库存" value={result.world.inventory} suffix="%" /><Metric label="积压" value={result.world.backlog} /><Metric label="服务" value={result.world.serviceLevel} suffix="%" /></div></div><div className="panel"><div className="title"><h2><Bot size={18} />Agent 群体</h2><p>核心业务角色和失控回路。</p></div><div className="agents">{agents.map((agent) => <div key={agent}><Bot size={18} /><span>{agent}</span><small>Agent</small></div>)}</div></div></section><section className="columns"><div className="panel"><div className="title"><h2><ShieldAlert size={18} />红队发现</h2><p>按严重度排序的涌现性风险。</p></div>{result.findings.map((finding) => <article className="finding" key={finding.title}><div><b>{finding.title}</b><i>{finding.severity}</i></div><p>{finding.evidence}</p><small>{finding.fix}</small></article>)}</div><div className="panel"><div className="title"><h2><AlertTriangle size={18} />失控回路</h2><p>高频循环是上线前最该处理的部分。</p></div>{result.loops.map((loop) => <article className="loop" key={loop.name}><b>{loop.name}</b><strong>{loop.count}</strong><p>{loop.path}</p></article>)}<div className="events">{result.events.map((event) => <p key={event}>{event}</p>)}</div></div></section></main></div>;
}
