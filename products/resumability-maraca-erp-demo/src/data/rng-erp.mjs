import { createHash } from 'node:crypto';

const COMPANIES = ['ACME Werke 1000', 'Contoso Fertigung 2000', 'Northwind Handel 3000'];
const PROCESSES = ['Order-to-Cash', 'Procure-to-Pay', 'Material Ledger', 'Period Close', 'Credit Control'];
const COST_CENTERS = ['CC-4100', 'CC-4230', 'CC-5100', 'CC-8120', 'CC-9900'];
const VENDORS = ['Kreditor 10420', 'Kreditor 11808', 'Kreditor 16031', 'Kreditor 19004'];
const CUSTOMERS = ['Debitor 300120', 'Debitor 300450', 'Debitor 301772', 'Debitor 302090'];
const MATERIALS = ['MAT-A12', 'MAT-B80', 'MAT-C44', 'MAT-D08', 'MAT-F77'];
const LOAD_LAB_LANES = ['fabric.render', 'interactive', 'resume.replay', 'xtension.mount'];
const LOAD_LAB_ZONES = ['WE-01', 'ST-20', 'PK-12', 'GI-04', 'QC-77', 'FI-88'];
const PROCUREMENT_STATUSES = ['Freigabe offen', 'SLA kritisch', 'Ware unterwegs', 'Rechnung wartet', 'Dreieck match'];
const ANGULAR_RISK_STATUSES = ['Kreditlimit knapp', 'Sperrbeleg offen', 'Bonitaet stabil', 'Manuelle Freigabe', 'Exposure steigt'];
const XTENSION_CONTROL_TOTAL = 8;

function hashSeed(seed) {
  return createHash('sha256').update(String(seed || 'local-demo')).digest();
}

function createPrng(seed) {
  const bytes = hashSeed(seed);
  let state = bytes.readUInt32LE(0) || 0x12345678;
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function amount(random, min, max) {
  return Math.round((min + random() * (max - min)) * 100) / 100;
}

function percent(random, min, max) {
  return Math.round((min + random() * (max - min)) * 10) / 10;
}

function makeLedgerItems(random) {
  return Array.from({ length: 6 }, (_, index) => {
    const debit = amount(random, 1200, 42000);
    const credit = amount(random, 800, 36000);
    return {
      id: `FI-${index + 1}-${Math.floor(random() * 8999 + 1000)}`,
      account: `${400000 + Math.floor(random() * 70000)}`,
      costCenter: pick(random, COST_CENTERS),
      material: pick(random, MATERIALS),
      debit,
      credit,
      variance: Math.round((debit - credit) * 100) / 100
    };
  });
}

function makeProcesses(random) {
  return PROCESSES.map((name, index) => ({
    id: `process-${index + 1}`,
    name,
    queue: Math.floor(random() * 42) + 3,
    sla: percent(random, 82, 99.5),
    owner: index % 2 === 0 ? pick(random, VENDORS) : pick(random, CUSTOMERS),
    locked: random() > 0.76
  }));
}

function makeAuditTrail(random) {
  const verbs = ['posted', 'matched', 'released', 'blocked', 'reconciled'];
  return Array.from({ length: 5 }, (_, index) => ({
    id: `audit-${index + 1}`,
    code: `ERP-${Math.floor(random() * 899 + 100)}`,
    actor: `USR${Math.floor(random() * 89 + 10)}`,
    action: pick(random, verbs),
    object: index % 2 === 0 ? pick(random, MATERIALS) : pick(random, COST_CENTERS),
    minutesAgo: Math.floor(random() * 240) + 4
  }));
}

function makeLoadLab(random, processes, ledgerItems) {
  const kpiMatrix = processes.flatMap((process, processIndex) => (
    ['queue', 'sla', 'latency'].map((metric, metricIndex) => {
      const value = metric === 'queue'
        ? process.queue
        : metric === 'sla'
          ? process.sla
          : Math.floor(random() * 260) + 35;
      return {
        id: `kpi-${processIndex + 1}-${metricIndex + 1}`,
        processId: process.id,
        processName: process.name,
        metric,
        value,
        tone: value > (metric === 'sla' ? 92 : 180) ? 'warn' : 'ok'
      };
    })
  ));

  const exceptionQueue = Array.from({ length: 7 }, (_, index) => ({
    id: `ex-${index + 1}-${Math.floor(random() * 899 + 100)}`,
    processId: pick(random, processes).id,
    code: `LD-${Math.floor(random() * 899 + 100)}`,
    severity: pick(random, ['info', 'warn', 'blocker']),
    ageMinutes: Math.floor(random() * 180) + 5,
    owner: index % 2 === 0 ? pick(random, VENDORS) : pick(random, CUSTOMERS)
  }));

  const materialFlow = LOAD_LAB_ZONES.map((zone, index) => {
    const ledger = ledgerItems[index % ledgerItems.length];
    return {
      id: `node-${index + 1}`,
      zone,
      material: ledger.material,
      queue: Math.floor(random() * 64) + 8,
      x: Math.round((Math.cos(index / LOAD_LAB_ZONES.length * Math.PI * 2) * 1.4) * 100) / 100,
      y: Math.round((Math.sin(index / LOAD_LAB_ZONES.length * Math.PI * 2) * 0.82) * 100) / 100,
      z: Math.round((random() * 0.8 - 0.4) * 100) / 100
    };
  });

  const schedulerLanes = LOAD_LAB_LANES.map((lane, index) => ({
    id: `lane-${index + 1}`,
    lane,
    activeFibers: Math.floor(random() * 6) + 2,
    budgetMs: index === 0 ? 16.67 : index === 1 ? 24 : 33.33,
    lastFrameMs: percent(random, 4.2, index === 0 ? 18.8 : 29.4),
    droppedFrames: Math.floor(random() * (index === 0 ? 3 : 2))
  }));

  const openUi5Procurement = Array.from({ length: 6 }, (_, index) => {
    const amountValue = amount(random, 1800, 86000);
    const approvalCount = Math.floor(random() * 5);
    const status = pick(random, PROCUREMENT_STATUSES);
    return {
      id: `PO-${2026}${index + 1}-${Math.floor(random() * 899 + 100)}`,
      supplier: pick(random, VENDORS),
      material: pick(random, MATERIALS),
      plant: pick(random, LOAD_LAB_ZONES),
      amount: amountValue,
      currency: 'EUR',
      status,
      tone: status.includes('kritisch') || approvalCount > 2 ? 'Error' : status.includes('offen') ? 'Warning' : 'Success',
      approvalsOpen: approvalCount,
      dueDays: Math.floor(random() * 18) + 1
    };
  });

  const angularRiskWorkbench = Array.from({ length: 6 }, (_, index) => {
    const exposure = amount(random, 12000, 240000);
    const score = Math.floor(random() * 52) + 38;
    const blockedDocs = Math.floor(random() * 9);
    const status = pick(random, ANGULAR_RISK_STATUSES);
    return {
      id: `RISK-${index + 1}-${Math.floor(random() * 899 + 100)}`,
      supplier: pick(random, VENDORS),
      customer: pick(random, CUSTOMERS),
      exposure,
      currency: 'EUR',
      score,
      blockedDocs,
      dueHours: Math.floor(random() * 72) + 2,
      status,
      reviewer: `USR${Math.floor(random() * 89 + 10)}`,
      tone: score < 55 || blockedDocs > 5 ? 'critical' : score < 72 || blockedDocs > 2 ? 'warn' : 'ok'
    };
  });

  const throughput = {
    documentsPerMinute: Math.floor(random() * 620) + 280,
    resumedSurfaces: processes.length + 6,
    mountedXtensions: XTENSION_CONTROL_TOTAL,
    nativeSurfaces: 13,
    frameBudgetMs: 16.67
  };

  return {
    kpiMatrix,
    exceptionQueue,
    materialFlow,
    schedulerLanes,
    openUi5Procurement,
    angularRiskWorkbench,
    throughput,
    frameBudget: {
      targetMs: 16.67,
      lowPowerMs: 33.33,
      backpressureStrategy: 'drop-and-diagnose'
    }
  };
}

function makeMenuBar(processes, ledgerItems, loadLab) {
  const exceptionCount = loadLab.exceptionQueue.length;
  const blockerCount = loadLab.exceptionQueue.filter((entry) => entry.severity === 'blocker').length;
  const warnKpis = loadLab.kpiMatrix.filter((entry) => entry.tone === 'warn').length;
  const activeFibers = loadLab.schedulerLanes.reduce((total, entry) => total + entry.activeFibers, 0);
  const openItems = ledgerItems.length;
  const groups = [
    {
      id: 'system',
      label: 'System',
      commands: [
        { id: 'system.resume', label: 'Resume Snapshot anzeigen', shortcut: 'STRG+R', badge: 'SSR' },
        { id: 'system.kernel', label: 'Kernel Diagnose', shortcut: 'F12', badge: `${activeFibers}` },
        { id: 'system.session', label: 'Sitzung vormerken', shortcut: 'STRG+S', badge: 'RMT' }
      ]
    },
    {
      id: 'edit',
      label: 'Bearbeiten',
      commands: [
        { id: 'edit.ledger', label: 'Belegposition markieren', shortcut: 'F2', badge: `${openItems}` },
        { id: 'edit.copy', label: 'Position in Zwischenablage', shortcut: 'STRG+C', badge: 'FI' },
        { id: 'edit.lock', label: 'Workflow-Sperre setzen', shortcut: 'F6', badge: `${blockerCount}` }
      ]
    },
    {
      id: 'goto',
      label: 'Springen',
      commands: [
        { id: 'goto.process', label: 'Prozessbaum', shortcut: 'F5', badge: `${processes.length}` },
        { id: 'goto.loadlab', label: 'Load Lab', shortcut: 'ALT+L', badge: `${warnKpis}` },
        { id: 'goto.three', label: 'Materialfluss 3D', shortcut: 'ALT+3', badge: 'GL' }
      ]
    },
    {
      id: 'environment',
      label: 'Umfeld',
      commands: [
        { id: 'environment.exceptions', label: 'Exception Queue', shortcut: 'ALT+E', badge: `${exceptionCount}` },
        { id: 'environment.scheduler', label: 'Scheduler Trace', shortcut: 'ALT+S', badge: `${loadLab.schedulerLanes.length}` },
        { id: 'environment.xtensions', label: 'XTension Status', shortcut: 'ALT+X', badge: `${loadLab.throughput.mountedXtensions}` },
        { id: 'environment.xtensionControl', label: 'XTension Teststeuerung', shortcut: 'ALT+T', badge: 'CFG' }
      ]
    },
    {
      id: 'help',
      label: 'Hilfe',
      commands: [
        { id: 'help.rmtSurfaceInfo', label: 'RMT Surface Info', shortcut: 'F1', badge: 'RMT' },
        { id: 'help.resume', label: 'Resumability Policy', shortcut: 'ALT+F1', badge: 'SRR' },
        { id: 'help.about', label: 'Über diese Demo', shortcut: '', badge: 'LOC' }
      ]
    }
  ];

  return {
    id: 'erp-menu-bar-state',
    openMenuId: '',
    selectedCommandId: 'system.resume',
    selectedCommandLabel: 'Resume Snapshot anzeigen',
    lastCommand: 'Menüband bereit',
    groups
  };
}

function makeSurfaceInfoDialog() {
  return {
    id: 'erp-surface-info-dialog-state',
    title: 'RMT Surface Info',
    open: false,
    loaded: false,
    telemetryStatus: 'lazy',
    lastOpenedAt: '',
    commandSource: '',
    hidden: true
  };
}

function makeXtensionControlDialog() {
  return {
    id: 'erp-xtension-control-dialog-state',
    title: 'XTension Teststeuerung',
    open: false,
    loaded: false,
    configStatus: 'local-storage',
    storageKey: 'xtend.erp.demo.xtension.boot.v1',
    enabledCount: XTENSION_CONTROL_TOTAL,
    disabledCount: 0,
    totalCount: XTENSION_CONTROL_TOTAL,
    lastAppliedAt: '',
    commandSource: '',
    hidden: true
  };
}

export function createErpSnapshot(seed = 'demo-seed') {
  const random = createPrng(seed);
  const company = pick(random, COMPANIES);
  const fiscalPeriod = `2026/${String(Math.floor(random() * 12) + 1).padStart(2, '0')}`;
  const processes = makeProcesses(random);
  const items = makeLedgerItems(random);
  const auditTrail = makeAuditTrail(random);
  const loadLab = makeLoadLab(random, processes, items);
  const menuBar = makeMenuBar(processes, items, loadLab);
  const surfaceInfoDialog = makeSurfaceInfoDialog();
  const xtensionControlDialog = makeXtensionControlDialog();
  const exposure = items.reduce((total, item) => total + item.debit, 0);
  const credits = items.reduce((total, item) => total + item.credit, 0);
  const variance = Math.round((exposure - credits) * 100) / 100;
  const activeProcess = processes[Math.floor(random() * processes.length)];
  const generatedAt = new Date(1782648000000 + Math.floor(random() * 86400000)).toISOString();

  return {
    schema: 'xtend.local.resumability-maraca-erp-demo.snapshot.v1',
    seed: String(seed),
    generatedAt,
    company,
    fiscalPeriod,
    activeProcessId: activeProcess.id,
    systemLoad: percent(random, 22, 87),
    processLatencyMs: Math.floor(random() * 440) + 80,
    currency: 'EUR',
    processes,
    menuBar,
    surfaceInfoDialog,
    xtensionControlDialog,
    ledger: {
      items,
      exposure: Math.round(exposure * 100) / 100,
      credits: Math.round(credits * 100) / 100,
      variance,
      openItems: items.length
    },
    auditTrail,
    loadLab
  };
}

export function createRmtStateFromSnapshot(snapshot) {
  const activeProcess = snapshot.processes.find((entry) => entry.id === snapshot.activeProcessId) || snapshot.processes[0];
  const menuBar = snapshot.menuBar || { groups: [], openMenuId: '', selectedCommandId: '', selectedCommandLabel: '', lastCommand: '' };
  const surfaceInfoDialog = snapshot.surfaceInfoDialog || makeSurfaceInfoDialog();
  const xtensionControlDialog = snapshot.xtensionControlDialog || makeXtensionControlDialog();
  const commandCount = menuBar.groups.reduce((total, group) => total + group.commands.length, 0);
  return {
    'erp.shell.status': {
      id: 'erp-kernel-status',
      text: `Kernel bereit: ${snapshot.company} / Periode ${snapshot.fiscalPeriod}`,
      tone: 'neutral',
      seed: snapshot.seed,
      generatedAt: snapshot.generatedAt,
      hidden: false
    },
    'erp.shell.menuBar': {
      id: 'erp-menu-bar-state',
      title: 'Menüband',
      menuCount: menuBar.groups.length,
      commandCount,
      openMenuId: menuBar.openMenuId || '',
      selectedCommandId: menuBar.selectedCommandId || '',
      selectedCommandLabel: menuBar.selectedCommandLabel || '',
      lastCommand: menuBar.lastCommand || 'Menüband bereit',
      hidden: false
    },
    'erp.shell.surfaceInfoDialog': {
      id: surfaceInfoDialog.id || 'erp-surface-info-dialog-state',
      title: surfaceInfoDialog.title || 'RMT Surface Info',
      open: Boolean(surfaceInfoDialog.open),
      loaded: Boolean(surfaceInfoDialog.loaded),
      telemetryStatus: surfaceInfoDialog.telemetryStatus || 'lazy',
      lastOpenedAt: surfaceInfoDialog.lastOpenedAt || '',
      commandSource: surfaceInfoDialog.commandSource || '',
      hidden: surfaceInfoDialog.hidden !== false
    },
    'erp.shell.xtensionControlDialog': {
      id: xtensionControlDialog.id || 'erp-xtension-control-dialog-state',
      title: xtensionControlDialog.title || 'XTension Teststeuerung',
      open: Boolean(xtensionControlDialog.open),
      loaded: Boolean(xtensionControlDialog.loaded),
      configStatus: xtensionControlDialog.configStatus || 'local-storage',
      storageKey: xtensionControlDialog.storageKey || 'xtend.erp.demo.xtension.boot.v1',
      enabledCount: Number.isFinite(Number(xtensionControlDialog.enabledCount)) ? Number(xtensionControlDialog.enabledCount) : XTENSION_CONTROL_TOTAL,
      disabledCount: Number.isFinite(Number(xtensionControlDialog.disabledCount)) ? Number(xtensionControlDialog.disabledCount) : 0,
      totalCount: Number.isFinite(Number(xtensionControlDialog.totalCount)) ? Number(xtensionControlDialog.totalCount) : XTENSION_CONTROL_TOTAL,
      lastAppliedAt: xtensionControlDialog.lastAppliedAt || '',
      commandSource: xtensionControlDialog.commandSource || '',
      hidden: xtensionControlDialog.hidden !== false
    },
    'erp.shell.sidebar': {
      id: 'erp-process-sidebar-state',
      title: 'Prozessvorrat',
      activeProcess: activeProcess.name,
      processCount: snapshot.processes.length,
      queueTotal: snapshot.processes.reduce((total, entry) => total + entry.queue, 0),
      hidden: false
    },
    'erp.shell.ledger': {
      id: 'erp-ledger-panel-state',
      title: 'Hauptbuch Stichprobe',
      openItems: snapshot.ledger.openItems,
      exposure: snapshot.ledger.exposure,
      credits: snapshot.ledger.credits,
      variance: snapshot.ledger.variance,
      currency: snapshot.currency,
      hidden: false
    },
    'erp.shell.audit': {
      id: 'erp-audit-panel-state',
      text: `${snapshot.auditTrail.length} Journalereignisse, letzte Aktion ${snapshot.auditTrail[0].code}`,
      tone: snapshot.ledger.variance >= 0 ? 'warning' : 'success',
      hidden: false
    },
    'erp.shell.reseed': {
      id: 'erp-reseed-command',
      text: 'Neue Stichprobe',
      tone: 'primary',
      disabled: false,
      hidden: false
    },
    'erp.shell.seedField': {
      id: 'erp-seed-input',
      field: 'seed',
      label: 'Seed',
      placeholder: 'demo-seed',
      value: snapshot.seed,
      inputType: 'text',
      required: true,
      hidden: false
    },
    'erp.shell.loadMatrix': {
      id: 'erp-load-matrix-state',
      title: 'Load Matrix',
      cells: snapshot.loadLab.kpiMatrix.length,
      warningCells: snapshot.loadLab.kpiMatrix.filter((entry) => entry.tone === 'warn').length,
      hidden: false
    },
    'erp.shell.schedulerTrace': {
      id: 'erp-scheduler-trace-state',
      title: 'Scheduler Trace',
      lanes: snapshot.loadLab.schedulerLanes.length,
      activeFibers: snapshot.loadLab.schedulerLanes.reduce((total, entry) => total + entry.activeFibers, 0),
      hidden: false
    },
    'erp.shell.exceptionSummary': {
      id: 'erp-exception-summary-state',
      title: 'Exception Summary',
      count: snapshot.loadLab.exceptionQueue.length,
      blockers: snapshot.loadLab.exceptionQueue.filter((entry) => entry.severity === 'blocker').length,
      hidden: false
    },
    'erp.shell.throughputBand': {
      id: 'erp-throughput-band-state',
      title: 'Throughput Band',
      documentsPerMinute: snapshot.loadLab.throughput.documentsPerMinute,
      resumedSurfaces: snapshot.loadLab.throughput.resumedSurfaces,
      mountedXtensions: snapshot.loadLab.throughput.mountedXtensions,
      hidden: false
    },
    'erp.shell.openUi5Procurement': {
      id: 'erp-openui5-procurement-state',
      title: 'OpenUI5 Procurement',
      orders: snapshot.loadLab.openUi5Procurement.length,
      approvalsOpen: snapshot.loadLab.openUi5Procurement.reduce((total, entry) => total + entry.approvalsOpen, 0),
      critical: snapshot.loadLab.openUi5Procurement.filter((entry) => entry.tone === 'Error').length,
      hidden: false
    },
    'erp.shell.angularRiskWorkbench': {
      id: 'erp-angular-risk-workbench-state',
      title: 'Angular Risk Workbench',
      risks: snapshot.loadLab.angularRiskWorkbench.length,
      critical: snapshot.loadLab.angularRiskWorkbench.filter((entry) => entry.tone === 'critical').length,
      exposure: Math.round(snapshot.loadLab.angularRiskWorkbench.reduce((total, entry) => total + entry.exposure, 0) * 100) / 100,
      hidden: false
    }
  };
}

export function createClientSnapshot(seed = 'demo-seed') {
  const snapshot = createErpSnapshot(seed);
  return {
    ...snapshot,
    rmtState: createRmtStateFromSnapshot(snapshot)
  };
}
