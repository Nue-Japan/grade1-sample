// --- グローバル変数定義 ---
let bridgeChart, timeChart;
let circuitProblems = [], userCircuitResults = [], currentCircuitProblemIndex = 0, selectedCircuitAnswer = null;
let timingProblems = [], userTimingResults = [], currentTimingProblemIndex = 0, selectedTimingOption = null, timingOptionCharts = [];
const TOTAL_PROBLEMS = 30;

// --- データ定義 ---
const circuitProblemBank = [
    { type: 'series', resistors: [10, 20], correctAnswer: 30, explanation: '直列接続なので、単純に抵抗値を足し合わせます。R = R1 + R2 = 10Ω + 20Ω = 30Ω となります。' },
    { type: 'parallel', resistors: [10, 10], correctAnswer: 5, explanation: '並列接続の合成抵抗は「和分の積」で計算できます。R = (R1 * R2) / (R1 + R2) = (10 * 10) / (10 + 10) = 100 / 20 = 5Ω となります。' },
    { type: 'series-parallel', resistors: [10, 10, 10], correctAnswer: 15, explanation: 'まず並列部分(R2, R3)を計算します。(10 * 10) / (10 + 10) = 5Ω。次に直列のR1を足します。10Ω + 5Ω = 15Ω。' },
    { type: 'complex1', resistors: [30, 60, 10], correctAnswer: 30, explanation: '並列部分(R1, R2)は (30 * 60) / (30 + 60) = 20Ω。これと直列のR3を足し、20Ω + 10Ω = 30Ω。' },
    { type: 'complex2', resistors: [5, 60, 30, 20], correctAnswer: 15, explanation: '3つの並列部分は 1 / (1/60 + 1/30 + 1/20) = 10Ω。これと直列のR1を足し、5Ω + 10Ω = 15Ω。' },
    { type: 'complex3', resistors: [10, 20, 30], correctAnswer: 15, explanation: '直列部分(R1, R2)は 10 + 20 = 30Ω。これと並列のR3との合成抵抗は (30 * 30) / (30 + 30) = 15Ω。' },
    { type: 'complex4', resistors: [10, 20, 20, 40], correctAnswer: 30, explanation: '内側の直列(R2, R3)は 40Ω。R4との並列で (40*40)/(40+40) = 20Ω。最後にR1と直列で 10Ω+20Ω = 30Ω。' },
    { type: 'series', resistors: [100, 150], correctAnswer: 250, explanation: '直列接続: R = R1 + R2 = 100Ω + 150Ω = 250Ω。' },
    { type: 'parallel', resistors: [20, 30], correctAnswer: 12, explanation: '並列接続: R = (20 * 30) / (20 + 30) = 600 / 50 = 12Ω。' },
    { type: 'series-parallel', resistors: [5, 20, 20], correctAnswer: 15, explanation: '並列部分(R2, R3)は (20*20)/(20+20) = 10Ω。直列のR1を足し 5Ω+10Ω=15Ω。' },
    { type: 'complex1', resistors: [10, 40, 22], correctAnswer: 30, explanation: '並列部分(R1, R2)は(10*40)/(10+40)=8Ω。直列のR3を足し 8Ω+22Ω=30Ω。' },
    { type: 'complex3', resistors: [5, 15, 20], correctAnswer: 10, explanation: '直列部分(R1, R2)は 5+15=20Ω。R3との並列で (20*20)/(20+20)=10Ω。' },
    { type: 'series', resistors: [47, 33], correctAnswer: 80, explanation: '直列接続: R = 47Ω + 33Ω = 80Ω。' },
    { type: 'parallel', resistors: [100, 100, 100], correctAnswer: 33.3, explanation: '3つの並列接続: 1 / (1/100 + 1/100 + 1/100) = 100/3 ≈ 33.3Ω。' },
    { type: 'complex4', resistors: [20, 10, 10, 20], correctAnswer: 30, explanation: '内側直列(R2,R3)は20Ω。R4との並列で(20*20)/(20+20)=10Ω。外側R1と直列で20+10=30Ω。' },
    { type: 'series-parallel', resistors: [18, 30, 60], correctAnswer: 38, explanation: '並列部分(R2,R3)は(30*60)/(30+60)=20Ω。直列R1を足し 18Ω+20Ω=38Ω。' },
    { type: 'complex1', resistors: [6, 3, 18], correctAnswer: 20, explanation: '並列部分(R1,R2)は(6*3)/(6+3)=2Ω。直列R3を足し 2Ω+18Ω=20Ω。' },
    { type: 'parallel', resistors: [8, 12], correctAnswer: 4.8, explanation: '並列接続: R = (8 * 12) / (8 + 12) = 96 / 20 = 4.8Ω。' },
    { type: 'complex2', resistors: [10, 10, 20, 20], correctAnswer: 15, explanation: '3つの並列部分は1/(1/10+1/20+1/20)=5Ω。直列R1を足し 10Ω+5Ω=15Ω。' },
    { type: 'series', resistors: [220, 470], correctAnswer: 690, explanation: '直列接続: R = 220Ω + 470Ω = 690Ω。' },
    { type: 'complex3', resistors: [12, 18, 15], correctAnswer: 10, explanation: '直列部分(R1,R2)は12+18=30Ω。R3との並列で(30*15)/(30+15)=10Ω。' },
    { type: 'series-parallel', resistors: [50, 100, 100], correctAnswer: 100, explanation: '並列部分(R2,R3)は(100*100)/(100+100)=50Ω。直列R1を足し 50Ω+50Ω=100Ω。' },
    { type: 'parallel', resistors: [2.2, 2.2], correctAnswer: 1.1, explanation: '並列接続: R = (2.2 * 2.2) / (2.2 + 2.2) = 1.1Ω。' },
    { type: 'complex4', resistors: [5, 5, 5, 10], correctAnswer: 10, explanation: '内側直列(R2,R3)は10Ω。R4との並列で(10*10)/(10+10)=5Ω。外側R1と直列で5+5=10Ω。' },
    { type: 'complex1', resistors: [180, 90, 40], correctAnswer: 100, explanation: '並列部分(R1,R2)は(180*90)/(180+90)=60Ω。直列R3を足し 60Ω+40Ω=100Ω。' },
    { type: 'series', resistors: [1000, 2200], correctAnswer: 3200, explanation: '直列接続: R = 1kΩ + 2.2kΩ = 3.2kΩ = 3200Ω。' },
    { type: 'complex2', resistors: [30, 60, 60, 60], correctAnswer: 50, explanation: '3つの並列部分は1/(1/60+1/60+1/60)=20Ω。直列R1を足し 30Ω+20Ω=50Ω。' },
    { type: 'parallel', resistors: [470, 470], correctAnswer: 235, explanation: '並列接続: R = (470 * 470) / (470 + 470) = 235Ω。' },
    { type: 'series-parallel', resistors: [7, 10, 15], correctAnswer: 13, explanation: '並列部分(R2,R3)は(10*15)/(10+15)=6Ω。直列R1を足し 7Ω+6Ω=13Ω。' },
    { type: 'complex3', resistors: [25, 25, 50], correctAnswer: 25, explanation: '直列部分(R1,R2)は25+25=50Ω。R3との並列で(50*50)/(50+50)=25Ω。' }
].map(p => {
    if (p.correctAnswer % 1 !== 0) {
        p.correctAnswer = parseFloat(p.correctAnswer.toFixed(1));
    }
    return p;
});

const timingProblemBank = [
    { gate: 'AND',  inputA: [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0], inputB: [0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1] },
    { gate: 'OR',   inputA: [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0], inputB: [1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0] },
    { gate: 'XOR',  inputA: [1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1], inputB: [1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1] },
    { gate: 'NAND', inputA: [1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1], inputB: (a => a.map(bit => 1 - bit))([1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1]) },
    { gate: 'NOT',  inputA: [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1], inputB: null },
    { gate: 'XNOR', inputA: [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0], inputB: [0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1] },
    { gate: 'NOR',  inputA: [1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1], inputB: (a => a.map(bit => 1 - bit))([1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1]) },
    ...Array.from({ length: 23 }).map(() => {
        const gates = ['AND', 'OR', 'XOR', 'NAND', 'NOT', 'XNOR', 'NOR'];
        const gate = gates[Math.floor(Math.random() * gates.length)];
        const len = 16;
        const inputA = Array.from({ length: len }, () => Math.round(Math.random()));
        let inputB = null;
        if (gate !== 'NOT') {
            inputB = Array.from({ length: len }, () => Math.round(Math.random()));
        }
        return { gate, inputA, inputB };
    })
];

const gateInfo = {
    'AND': { description: '入力Aと入力Bが両方とも「1」のときだけ、出力Yが「1」になります。', truthTable: [[0,0,0],[0,1,0],[1,0,0],[1,1,1]]}, 'OR': { description: '入力Aまたは入力Bのどちらか一方、あるいは両方が「1」のとき、出力Yが「1」になります。', truthTable: [[0,0,0],[0,1,1],[1,0,1],[1,1,1]]}, 'NOT': { description: '入力を反転させて出力します。入力が「1」なら「0」に、「0」なら「1」になります。', truthTable: [[0,1],[1,0]]}, 'NAND': { description: 'ANDゲートの出力を反転させたものです。入力AとBが両方とも「1」のときだけ「0」になり、それ以外は「1」になります。', truthTable: [[0,0,1],[0,1,1],[1,0,1],[1,1,0]]}, 'NOR': { description: 'ORゲートの出力を反転させたものです。入力AとBが両方とも「0」のときだけ「1」になり、それ以外は「0」になります。', truthTable: [[0,0,1],[0,1,0],[1,0,0],[1,1,0]]}, 'XOR': { description: '入力AとBの値が異なるときだけ、出力が「1」になります。(排他的論理和)', truthTable: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}, 'XNOR': { description: '入力AとBの値が同じときだけ、出力が「1」になります。(XORの反転)', truthTable: [[0,0,1],[0,1,0],[1,0,0],[1,1,1]]}
};

// --- ナビゲーションとUI制御 ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
}

function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionId}`).classList.add('active');
    
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    element.classList.add('active');
    
    if (window.innerWidth < 1024) {
        toggleSidebar();
    }
    window.scrollTo(0, 0);
}

function switchSubTab(subTabId) {
    document.querySelectorAll('.sub-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${subTabId}-calc`).classList.add('active');
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`subtab-${subTabId}`).classList.add('active');
}

// --- Gemini提案機能：Toast Notification ---
function showToast(message, isSuccess) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.className = 'toast show';
    toast.classList.add(isSuccess ? 'success' : 'error');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Gemini提案機能：Confetti ---
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const confettiPieces = [];
    const pieceCount = 200;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

    for (let i = 0; i < pieceCount; i++) {
        confettiPieces.push({
            x: Math.random() * canvas.width,
            y: -Math.random() * canvas.height,
            radius: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 3 + 2,
            tilt: Math.random() * 10,
            tiltAngle: Math.random() * Math.PI * 2
        });
    }

    let animationFrame;
    function update() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiPieces.forEach(p => {
            p.y += p.speed;
            p.tiltAngle += 0.05;
            p.x += Math.sin(p.tiltAngle + p.x/100);
            if (p.y > canvas.height) {
                p.x = Math.random() * canvas.width;
                p.y = -20;
            }
            ctx.beginPath();
            ctx.lineWidth = p.radius;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt, p.y);
            ctx.lineTo(p.x, p.y + p.tilt + p.radius);
            ctx.stroke();
        });
        animationFrame = requestAnimationFrame(update);
    }
    
    update();
    setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        if (ctx) {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, 5000);
}


// --- 電気回路セクション ---
function calculateShunt() {
    const ra = parseFloat(document.getElementById('shunt-ra').value);
    const n = parseFloat(document.getElementById('shunt-n').value);
    const resultEl = document.getElementById('shunt-result');
    if (!isNaN(ra) && !isNaN(n) && n > 1) {
        resultEl.textContent = `分流器の抵抗 (Rs) = ${(ra / (n - 1)).toFixed(3)} Ω`;
    } else {
        resultEl.textContent = '有効な値を入力してください (倍率は1より大きい値)。';
    }
}
function calculateMultiplier() {
    const ra = parseFloat(document.getElementById('multiplier-ra').value);
    const n = parseFloat(document.getElementById('multiplier-n').value);
    const resultEl = document.getElementById('multiplier-result');
     if (!isNaN(ra) && !isNaN(n) && n > 1) {
        resultEl.textContent = `倍率器の抵抗 (Rm) = ${(ra * (n - 1)).toFixed(3)} Ω`;
    } else {
        resultEl.textContent = '有効な値を入力してください (倍率は1より大きい値)。';
    }
}
function calculateBridge() {
    const r1 = parseFloat(document.getElementById('bridge-r1').value);
    const r2 = parseFloat(document.getElementById('bridge-r2').value);
    const r3 = parseFloat(document.getElementById('bridge-r3').value);
    const resultEl = document.getElementById('bridge-result');
    if (!isNaN(r1) && !isNaN(r2) && !isNaN(r3) && r1 > 0) {
        const rx = (r2 * r3) / r1;
        resultEl.textContent = `未知の抵抗 (Rx) = ${rx.toFixed(3)} Ω`;
        updateBridgeChart(r1, r2, r3, rx);
    } else {
        resultEl.textContent = 'R1, R2, R3に有効な正の値を入力してください。';
    }
}
function updateBridgeChart(r1, r2, r3, rx) {
    if (!bridgeChart) return;
    bridgeChart.data.datasets[0].data = [r1, r2, r3, rx];
    bridgeChart.update();
}

// --- デジタル基礎セクション ---
function convertBase(from) {
    const decIn = document.getElementById('dec-input'), binIn = document.getElementById('bin-input'), hexIn = document.getElementById('hex-input');
    let val;
    if (from === 'dec') val = parseInt(decIn.value, 10);
    if (from === 'bin') val = parseInt(binIn.value, 2);
    if (from === 'hex') val = parseInt(hexIn.value, 16);
    if (isNaN(val) || val < 0) { decIn.value = binIn.value = hexIn.value = ''; return; }
    if (from !== 'dec') decIn.value = val;
    if (from !== 'bin') binIn.value = val.toString(2);
    if (from !== 'hex') hexIn.value = val.toString(16).toUpperCase();
}

// --- 論理回路セクション ---
function switchGate(gate) {
    document.querySelectorAll('.logic-gate-btn').forEach(b => b.classList.toggle('active', b.textContent === gate));
    document.getElementById('gate-title').textContent = `${gate}ゲート`;
    document.getElementById('gate-description').textContent = gateInfo[gate].description;
    updateTruthTable(gate);
    updateTimeChart(gate);
}

function updateTruthTable(gate) {
    const table = document.getElementById('truth-table');
    table.innerHTML = '';
    const isNot = gate === 'NOT';
    const header = `<thead><tr><th>入力A</th>${!isNot ? '<th>入力B</th>' : ''}<th>出力Y</th></tr></thead>`;
    table.innerHTML = header;
    const tbody = document.createElement('tbody');
    gateInfo[gate].truthTable.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join('');
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

function updateTimeChart(gate) {
    if (!timeChart) return;
    const inputA = [0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0];
    const inputB = [0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0];
    const outputY = calculateGateOutput(gate, inputA, inputB);
    
    const datasets = [];
    datasets.push({ label: '入力A', data: inputA, borderColor: '#38bdf8', stepped: true, pointRadius: 0, borderWidth: 2 });
    if (gate !== 'NOT') {
        datasets.push({ label: '入力B', data: inputB, borderColor: '#f472b6', stepped: true, pointRadius: 0, borderWidth: 2 });
    }
    datasets.push({ label: '出力Y', data: outputY, borderColor: '#34d399', stepped: true, pointRadius: 0, borderWidth: 3 });

    timeChart.data.labels = Array.from({length: inputA.length}, (_, i) => i);
    timeChart.data.datasets = datasets;
    timeChart.update();
}

// --- 問題解答汎用ロジック ---
function calculateGateOutput(gate, inputA, inputB) {
    return inputA.map((a, i) => {
        const b = (inputB && inputB[i] !== undefined) ? inputB[i] : 0;
        switch (gate) {
            case 'AND':  return a & b; case 'OR':   return a | b;
            case 'NOT':  return 1 - a; case 'NAND': return 1 - (a & b);
            case 'NOR':  return 1 - (a | b); case 'XOR':  return a ^ b;
            case 'XNOR': return 1 - (a ^ b); default: return 0;
        }
    });
}

// --- 回路問題セクション ---
function setupCircuitProblems() {
    circuitProblems = [...circuitProblemBank].sort(() => Math.random() - 0.5).slice(0, TOTAL_PROBLEMS);
    userCircuitResults = new Array(circuitProblems.length).fill(null);
    loadCircuitProblem(0);
    updateCircuitResultsPanel();
}
function resetCircuitProblems() {
    setupCircuitProblems();
    showToast("回路問題をリセットしました！", true);
}


function loadCircuitProblem(index, isReview = false) {
    currentCircuitProblemIndex = index;
    const problem = circuitProblems[index];
    selectedCircuitAnswer = null;
    document.getElementById('circuit-problem-number').textContent = index + 1;
    drawCircuitDiagram(problem);

    const optionsContainer = document.getElementById('circuit-options-container');
    optionsContainer.innerHTML = '';
    generateCircuitOptions(problem.correctAnswer).forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = `${opt} Ω`;
        btn.onclick = () => selectCircuitOption(btn, opt);
        optionsContainer.appendChild(btn);
    });
    
    document.getElementById('circuit-explanation-container').classList.add('hidden');
    document.getElementById('check-circuit-answer-btn').classList.remove('hidden');
    document.getElementById('next-circuit-problem-btn').classList.add('hidden');

    const result = userCircuitResults[index];
    if (isReview && result) {
        selectedCircuitAnswer = result.selected;
        checkCircuitAnswer(true);
    }
}

function drawCircuitDiagram(problem) {
    const container = document.getElementById('circuit-diagram-problem');
    let html = 'A -- ';
    const r = problem.resistors;
    switch (problem.type) {
        case 'series': html += `[R1:${r[0]}Ω]--[R2:${r[1]}Ω]`; break;
        case 'parallel': html += `<div class="inline-block text-center align-middle">[R1:${r[0]}Ω]<br>|<br>[R2:${r[1]}Ω]</div>`; break;
        case 'series-parallel': html += `[R1:${r[0]}Ω]--<div class="inline-block text-center align-middle">[R2:${r[1]}Ω]<br>|<br>[R3:${r[2]}Ω]</div>`; break;
        case 'complex1': html += `<div class="inline-block text-center align-middle">[R1:${r[0]}Ω]<br>|<br>[R2:${r[1]}Ω]</div>--[R3:${r[2]}Ω]`; break;
        case 'complex2': html += `[R1:${r[0]}Ω]--<div class="inline-block text-center align-middle">[R2:${r[1]}Ω]<br>|<br>[R3:${r[2]}Ω]<br>|<br>[R4:${r[3]}Ω]</div>`; break;
        case 'complex3': html += `<div class="inline-block text-center align-middle">[R1:${r[0]}Ω]--[R2:${r[1]}Ω]<br>|<br>[R3:${r[2]}Ω]</div>`; break;
        case 'complex4': html += `[R1:${r[0]}Ω]--<div class="inline-block text-center align-middle">[R2:${r[1]}Ω]--[R3:${r[2]}Ω]<br>|<br>[R4:${r[3]}Ω]</div>`; break;
    }
    container.innerHTML = html + ' -- B';
}

function generateCircuitOptions(correct) {
    let opts = new Set([correct]);
    while (opts.size < 4) {
        const factor = Math.random() < 0.5 ? 0.6 + Math.random() * 0.3 : 1.1 + Math.random() * 0.5;
        let randOpt = correct * factor + (Math.random() * 10 - 5);
        if (randOpt !== correct && randOpt > 0) {
            if (randOpt % 1 !== 0) {
                opts.add(parseFloat(randOpt.toFixed(1)));
            } else {
                opts.add(Math.round(randOpt));
            }
        }
    }
    return Array.from(opts).sort((a, b) => a - b);
}

function selectCircuitOption(btn, answer) {
    if (userCircuitResults[currentCircuitProblemIndex] !== null) return;
    document.querySelectorAll('#circuit-options-container .option-btn.selected').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedCircuitAnswer = answer;
}

function checkCircuitAnswer(isReview) {
    if (selectedCircuitAnswer === null && !isReview) return;
    const problem = circuitProblems[currentCircuitProblemIndex];
    const isCorrect = selectedCircuitAnswer === problem.correctAnswer;
    
    if (!isReview) {
        userCircuitResults[currentCircuitProblemIndex] = { selected: selectedCircuitAnswer, correct: isCorrect };
        updateCircuitResultsPanel();
        showToast(isCorrect ? "正解です！" : "不正解です...", isCorrect);
        if (userCircuitResults.filter(r => r !== null).length === circuitProblems.length) {
            startConfetti();
        }
    }
    
    document.querySelectorAll('#circuit-options-container .option-btn').forEach(btn => {
        const answer = parseFloat(btn.textContent);
        btn.classList.add('disabled');
        if (answer === problem.correctAnswer) btn.classList.add('correct');
        else if (answer === selectedCircuitAnswer) btn.classList.add('incorrect');
    });

    document.getElementById('circuit-explanation-text').textContent = problem.explanation;
    document.getElementById('circuit-explanation-container').classList.remove('hidden');
    document.getElementById('check-circuit-answer-btn').classList.add('hidden');
    document.getElementById('next-circuit-problem-btn').classList.remove('hidden');
}

function updateCircuitResultsPanel() {
    const answered = userCircuitResults.filter(r => r).length;
    const correct = userCircuitResults.filter(r => r?.correct).length;
    const percentage = answered === 0 ? 0 : Math.round((correct / answered) * 100);
    document.getElementById('circuit-score').textContent = `正解率: ${correct}/${answered}問 (${percentage}%)`;
    
    const progressBar = document.getElementById('circuit-progress-bar');
    progressBar.style.width = `${(answered / circuitProblems.length) * 100}%`;

    const listEl = document.getElementById('circuit-results-list');
    listEl.innerHTML = '';
    circuitProblems.forEach((_, index) => {
        const result = userCircuitResults[index];
        const li = document.createElement('li');
        li.className = 'result-item';
        li.onclick = () => loadCircuitProblem(index, true);
        const status = result ? (result.correct ? '<span class="status-icon correct">〇</span>' : '<span class="status-icon incorrect">×</span>') : '';
        li.innerHTML = `<span>問題 ${index + 1}</span> ${status}`;
        listEl.appendChild(li);
    });
}

// --- タイムチャート問題セクション ---
function setupTimingProblems() {
    timingProblems = [...timingProblemBank].sort(() => Math.random() - 0.5).slice(0, TOTAL_PROBLEMS);
    userTimingResults = new Array(timingProblems.length).fill(null);
    loadTimingProblem(0);
    updateTimingResultsPanel();
}
function resetTimingProblems() {
    setupTimingProblems();
    showToast("チャート問題をリセットしました！", true);
}

function loadTimingProblem(index, isReview = false) {
    currentTimingProblemIndex = index;
    const problem = timingProblems[index];
    selectedTimingOption = null;
    document.getElementById('timing-problem-number').textContent = index + 1;
    document.getElementById('timing-problem-gate-type').textContent = problem.gate;
    const datasets = [{ label: '入力A', data: problem.inputA, borderColor: '#38bdf8' }];
    if (problem.inputB) datasets.push({ label: '入力B', data: problem.inputB, borderColor: '#f472b6' });
    renderTimingChart('timing-problem-chart-input', datasets, true);

    const optionsContainer = document.getElementById('timing-options-container');
    optionsContainer.innerHTML = '';
    const correctOutput = calculateGateOutput(problem.gate, problem.inputA, problem.inputB);
    let options = [{ data: correctOutput, isCorrect: true }];
    while (options.length < 4) {
        options.push({ data: generateDistractorOutput(correctOutput, options), isCorrect: false });
    }
    options.sort(() => Math.random() - 0.5);
    
    timingOptionCharts.forEach(chart => chart.destroy());
    timingOptionCharts = [];

    options.forEach((opt, i) => {
        const card = document.createElement('div');
        card.className = 'timing-option-card';
        card.onclick = () => selectTimingOption(card, i, opt.isCorrect);
        card.dataset.isCorrect = String(opt.isCorrect);
        card.dataset.index = i;
        card.innerHTML = `<p class="font-bold text-center">選択肢 ${i + 1}</p><div class="chart-container h-24 max-h-24 mt-2"><canvas id="option-chart-${i}"></canvas></div>`;
        optionsContainer.appendChild(card);
        timingOptionCharts.push(renderTimingChart(`option-chart-${i}`, [{ label: '出力Y', data: opt.data, borderColor: '#34d399', borderWidth: 3 }], false));
    });

    document.getElementById('timing-explanation-container').classList.add('hidden');
    document.getElementById('check-timing-answer-btn').classList.remove('hidden');
    document.getElementById('next-timing-problem-btn').classList.add('hidden');

    const result = userTimingResults[index];
    if (isReview && result) {
        selectedTimingOption = result.selected;
        checkTimingAnswer(true);
    }
}

function renderTimingChart(canvasId, datasets, isInputChart) {
    const ctx = document.getElementById(canvasId)?.getContext('2d'); if (!ctx) return null; Chart.getChart(canvasId)?.destroy(); return new Chart(ctx, { type: 'line', data: { labels: Array.from({length: datasets[0].data.length}, (_, i) => i), datasets: datasets.map(ds => ({ ...ds, stepped: true, pointRadius: 0, borderWidth: 2 })) }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: isInputChart, position: 'bottom', labels: { boxWidth: 20, padding: 20 } }, tooltip: { enabled: false } }, scales: { y: { min: -0.2, max: 1.2, ticks: { stepSize: 1, callback: (v) => (v === 0 ? 'L' : (v === 1 ? 'H' : '')) } }, x: { display: false } } } });
}

function generateDistractorOutput(correct, existing) {
    let distractor; let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 20) {
        distractor = [...correct];
        const type = Math.floor(Math.random() * 4);
        const idx1 = Math.floor(Math.random() * distractor.length);
        if (type === 0) distractor[idx1] = 1 - distractor[idx1];
        else if (type === 1) { let idx2; do { idx2 = Math.floor(Math.random() * distractor.length); } while (idx1 === idx2); distractor[idx1] = 1 - distractor[idx1]; distractor[idx2] = 1 - distractor[idx2]; }
        else if (type === 2) { distractor.pop(); distractor.unshift(Math.round(Math.random())); }
        else distractor = distractor.map(bit => 1 - bit);
        isUnique = !existing.some(out => JSON.stringify(out.data) === JSON.stringify(distractor));
        attempts++;
    }
    return distractor;
}

function selectTimingOption(card, index, isCorrect) {
    if (userTimingResults[currentTimingProblemIndex] !== null) return;
    document.querySelectorAll('.timing-option-card.selected').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedTimingOption = { index, isCorrect };
}

function checkTimingAnswer(isReview) {
    if (!isReview && !selectedTimingOption) {
        return;
    }

    const problem = timingProblems[currentTimingProblemIndex];
    let answerInfo;

    if (isReview) {
        const result = userTimingResults[currentTimingProblemIndex];
        if (!result) return;
        answerInfo = result.selected;
    } else {
        answerInfo = selectedTimingOption;
        const isCorrect = selectedTimingOption.isCorrect;
        
        userTimingResults[currentTimingProblemIndex] = { selected: answerInfo, correct: isCorrect };
        updateTimingResultsPanel();
        showToast(isCorrect ? "正解です！" : "不正解です...", isCorrect);
        
        if (userTimingResults.filter(r => r !== null).length === timingProblems.length) {
            startConfetti();
        }
    }

    document.querySelectorAll('.timing-option-card').forEach(card => {
        card.classList.add('disabled');
        const isCorrectOption = card.dataset.isCorrect === 'true';
        const isSelectedOption = answerInfo && (card.dataset.index == answerInfo.index);

        if (isCorrectOption) {
            card.classList.add('correct');
        } else if (isSelectedOption) {
            card.classList.add('incorrect');
        }
    });

    document.getElementById('timing-explanation-text').textContent = `${problem.gate}ゲートは、${gateInfo[problem.gate].description} このルールに従って入力を確認すると、正解の波形が導き出せます。`;
    document.getElementById('timing-explanation-container').classList.remove('hidden');
    document.getElementById('check-timing-answer-btn').classList.add('hidden');
    document.getElementById('next-timing-problem-btn').classList.remove('hidden');
}

function updateTimingResultsPanel() {
    const answered = userTimingResults.filter(r => r).length;
    const correct = userTimingResults.filter(r => r?.correct).length;
    const percentage = answered === 0 ? 0 : Math.round((correct / answered) * 100);
    document.getElementById('timing-score').textContent = `正解率: ${correct}/${answered}問 (${percentage}%)`;
    
    const progressBar = document.getElementById('timing-progress-bar');
    progressBar.style.width = `${(answered / timingProblems.length) * 100}%`;

    const listEl = document.getElementById('timing-results-list');
    listEl.innerHTML = '';
    timingProblems.forEach((problem, index) => {
        const result = userTimingResults[index];
        const li = document.createElement('li');
        li.className = 'result-item';
        li.onclick = () => loadTimingProblem(index, true);
        const status = result ? (result.correct ? '<span class="status-icon correct">〇</span>' : '<span class="status-icon incorrect">×</span>') : '';
        li.innerHTML = `<span>問題 ${index + 1} (${problem.gate})</span> ${status}`;
        listEl.appendChild(li);
    });
}

// --- 初期化処理 ---
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar setup
    document.getElementById('menu-button').addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', toggleSidebar);
    document.getElementById('reset-circuit-btn').addEventListener('click', resetCircuitProblems);
    document.getElementById('reset-timing-btn').addEventListener('click', resetTimingProblems);
    document.getElementById('check-circuit-answer-btn').addEventListener('click', () => checkCircuitAnswer(false));
    document.getElementById('check-timing-answer-btn').addEventListener('click', () => checkTimingAnswer(false));
    document.getElementById('next-circuit-problem-btn').addEventListener('click', () => {
        let nextIdx = userCircuitResults.findIndex(r => r === null);
        if (nextIdx === -1) nextIdx = (currentCircuitProblemIndex + 1) % circuitProblems.length;
        loadCircuitProblem(nextIdx);
    });
    document.getElementById('next-timing-problem-btn').addEventListener('click', () => {
        let nextIdx = userTimingResults.findIndex(r => r === null);
        if (nextIdx === -1) nextIdx = (currentTimingProblemIndex + 1) % timingProblems.length;
        loadTimingProblem(nextIdx);
    });


    // Chart.js Global Config
    Chart.defaults.font.family = "'Noto Sans JP', sans-serif";

    // Initialize charts
    const bridgeCtx = document.getElementById('bridge-chart')?.getContext('2d');
    if (bridgeCtx) bridgeChart = new Chart(bridgeCtx, { type: 'bar', data: { labels: ['R1', 'R2', 'R3', 'Rx'], datasets: [{ label: '抵抗値 [Ω]', data: [0,0,0,0], backgroundColor: ['#60a5fa', '#f87171', '#4ade80', '#c084fc'] }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    
    const timeCtx = document.getElementById('time-chart')?.getContext('2d');
    if(timeCtx) timeChart = new Chart(timeCtx, { type: 'line', options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: -0.2, max: 1.2, ticks: { stepSize: 1, callback: (v) => (v === 0 ? 'L' : 'H') } } }, plugins: { legend: { position: 'bottom' } } }});
    
    // Initialize sections
    switchGate('AND');
    setupCircuitProblems();
    setupTimingProblems();

    // Set initial active section
    showSection('home', document.querySelector('.sidebar-link'));
});

