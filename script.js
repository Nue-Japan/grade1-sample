let bridgeChart;
let timeChart;
let currentLogicGate = 'AND';

// --- 問題用のグローバル変数 ---
let circuitProblemNumber = 1;
let currentCircuitProblem = {};
let timingProblemNumber = 1;
let currentTimingProblem = {};
let timingChartInstances = [];

const gateInfo = {
    'AND':  { title: 'ANDゲート',  description: '入力Aと入力Bが両方とも「1」(HIGH)のときだけ、出力Yが「1」になります。「論理積」とも呼ばれます。',  symbol: 'A・B', calculate: (a, b) => a & b },
    'OR':   { title: 'ORゲート',   description: '入力Aまたは入力Bのどちらか一方、あるいは両方が「1」のとき、出力Yが「1」になります。「論理和」とも呼ばれます。', symbol: 'A+B', calculate: (a, b) => a | b },
    'NOT':  { title: 'NOTゲート',  description: '入力を反転させて出力します。入力が「1」なら出力は「0」、入力が「0」なら出力は「1」になります。「否定」とも呼ばれます。', symbol: 'Ā',   calculate: (a, b) => 1 - a },
    'NAND': { title: 'NANDゲート', description: 'ANDゲートの出力を反転させたものです。入力AとBが両方とも「1」のときだけ、出力が「0」になります。', symbol: 'A・B', calculate: (a, b) => 1 - (a & b) },
    'NOR':  { title: 'NORゲート',  description: 'ORゲートの出力を反転させたものです。入力AとBが両方とも「0」のときだけ、出力が「1」になります。', symbol: 'A+B', calculate: (a, b) => 1 - (a | b) },
    'XOR':  { title: 'XORゲート',  description: '入力AとBの値が異なるときだけ、出力が「1」になります。「排他的論理和」とも呼ばれます。', symbol: 'A⊕B', calculate: (a, b) => a ^ b },
    'XNOR': { title: 'XNORゲート', description: 'XORゲートの出力を反転させたものです。入力AとBの値が同じときだけ、出力が「1」になります。', symbol: 'A⊕B', calculate: (a, b) => 1 - (a ^ b) }
};


// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    showSection('home');
    
    // 電気回路
    calculateShunt();
    calculateMultiplier();
    setupBridge();
    
    // デジタル基礎
    setupConverter();
    
    // 論理回路
    selectLogicGate('AND');
    document.getElementById('gate-input-a')?.addEventListener('change', updateGateOutput);
    document.getElementById('gate-input-b')?.addEventListener('change', updateGateOutput);
    setupTimeChart();

    // 回路問題
    setupCircuitProblems();
    document.getElementById('check-circuit-answer-btn').addEventListener('click', checkCircuitAnswer);
    document.getElementById('next-circuit-problem-btn').addEventListener('click', () => { circuitProblemNumber++; setupCircuitProblems(); });

    // タイムチャート問題
    setupTimingProblems();
    document.getElementById('check-timing-answer-btn').addEventListener('click', checkTimingAnswer);
    document.getElementById('next-timing-problem-btn').addEventListener('click', () => { timingProblemNumber++; setupTimingProblems(); });
});

// --- ページナビゲーション ---
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionId}`);
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.section === sectionId);
    });
}

function switchMeter(meterType) {
    const isShunt = meterType === 'shunt';
    document.getElementById('shunt-calc').classList.toggle('hidden', !isShunt);
    document.getElementById('subtab-shunt').classList.toggle('active', isShunt);
    document.getElementById('multiplier-calc').classList.toggle('hidden', isShunt);
    document.getElementById('subtab-multiplier').classList.toggle('active', !isShunt);
}

// --- 電気回路セクション ---
function calculateShunt() {
    const ra = parseFloat(document.getElementById('shunt-ra').value);
    const n = parseFloat(document.getElementById('shunt-n').value);
    const resultEl = document.getElementById('shunt-result');
    if (isNaN(ra) || isNaN(n) || n <= 1) { resultEl.textContent = '無効な入力です'; return; }
    const rs = ra / (n - 1);
    resultEl.innerHTML = `Rs = <span class="text-2xl">${rs.toFixed(2)}</span> Ω`;
}

function calculateMultiplier() {
    const rv = parseFloat(document.getElementById('multiplier-rv').value);
    const n = parseFloat(document.getElementById('multiplier-n').value);
    const resultEl = document.getElementById('multiplier-result');
    if (isNaN(rv) || isNaN(n) || n <= 1) { resultEl.textContent = '無効な入力です'; return; }
    const rm = rv * (n - 1);
    resultEl.innerHTML = `Rm = <span class="text-2xl">${rm.toFixed(2)}</span> kΩ`;
}

function setupBridge() {
    const inputs = ['bridge-r1', 'bridge-r2', 'bridge-r3', 'bridge-rx-slider'].map(id => document.getElementById(id));
    const updateBridge = () => {
        const r1 = parseFloat(inputs[0].value) || 0;
        const r2 = parseFloat(inputs[1].value) || 0;
        const r3 = parseFloat(inputs[2].value) || 0;
        const userRx = parseFloat(inputs[3].value) || 0;
        
        document.getElementById('bridge-rx-value').textContent = userRx.toFixed(2);
        let idealRx = (r1 > 0) ? (r2 * r3) / r1 : 0;
        document.getElementById('bridge-ideal-rx').textContent = idealRx.toFixed(2) + ' Ω';
        let unbalance = (idealRx > 0) ? ((userRx - idealRx) / idealRx * 100) : (userRx > 0 ? 100 : 0);
        renderBridgeChart(unbalance);
    };
    inputs.forEach(el => el.addEventListener('input', updateBridge));
    updateBridge();
}

function renderBridgeChart(unbalance) {
    const ctx = document.getElementById('bridgeChart')?.getContext('2d');
    if (!ctx) return;
    if (!bridgeChart) {
        bridgeChart = new Chart(ctx, {
            type: 'bar', data: { labels: ['検流計の振れ'], datasets: [{ label: '不平衡度 (%)', data: [0], backgroundColor: ['#ef4444'], borderWidth: 1 }] },
            options: { indexAxis: 'y', scales: { x: { min: -100, max: 100, title: { display: true, text: '不平衡度 (%)' } } }, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
    }
    bridgeChart.data.datasets[0].data[0] = unbalance;
    bridgeChart.data.datasets[0].backgroundColor[0] = Math.abs(unbalance) < 1 ? '#22c55e' : '#3b82f6';
    bridgeChart.update();
}

// --- デジタル基礎セクション ---
function setupConverter() {
    const inputs = { dec: document.getElementById('conv-dec'), bin: document.getElementById('conv-bin'), hex: document.getElementById('conv-hex') };
    Object.keys(inputs).forEach(key => {
        inputs[key]?.addEventListener('input', () => {
            let val;
            const sourceElem = inputs[key];
            if (sourceElem.value === '') { inputs.dec.value = ''; inputs.bin.value = ''; inputs.hex.value = ''; return; }
            try {
                switch (key) {
                    case 'dec': val = parseInt(sourceElem.value, 10); break;
                    case 'bin': val = parseInt(sourceElem.value.replace(/[^01]/g, ''), 2); break;
                    case 'hex': val = parseInt(sourceElem.value.replace(/[^0-9A-Fa-f]/g, ''), 16); break;
                }
                if (!isNaN(val)) {
                    if (key !== 'dec') inputs.dec.value = val;
                    if (key !== 'bin') inputs.bin.value = val.toString(2);
                    if (key !== 'hex') inputs.hex.value = val.toString(16).toUpperCase();
                }
            } catch (e) { /* ignore errors */ }
        });
    });
}

// --- 論理回路セクション ---
function selectLogicGate(gate) {
    currentLogicGate = gate;
    const info = gateInfo[gate];
    document.querySelectorAll('.logic-gate-btn').forEach(btn => btn.classList.toggle('active', btn.textContent === gate));
    
    document.getElementById('gate-title').textContent = info.title;
    document.getElementById('gate-description').textContent = info.description;
    document.getElementById('gate-symbol').textContent = info.symbol;
    document.getElementById('gate-input-b-container').style.display = gate === 'NOT' ? 'none' : '';

    renderTruthTable(gate);
    updateGateOutput();
    renderTimeChart(gate);
}

function updateGateOutput() {
    const inputA = document.getElementById('gate-input-a').checked;
    const inputB = document.getElementById('gate-input-b').checked;
    const outputEl = document.getElementById('gate-output');
    let outputVal = gateInfo[currentLogicGate].calculate(Number(inputA), Number(inputB));
    
    outputEl.textContent = outputVal;
    outputEl.classList.toggle('high', outputVal === 1);
}

function renderTruthTable(gate) {
    const tableEl = document.getElementById('truth-table');
    let headers, rows;
    if (gate === 'NOT') {
        headers = ['A', 'Y'];
        rows = [[0, 1], [1, 0]];
    } else {
        headers = ['A', 'B', 'Y'];
        rows = [
            [0, 0, gateInfo[gate].calculate(0, 0)], [0, 1, gateInfo[gate].calculate(0, 1)],
            [1, 0, gateInfo[gate].calculate(1, 0)], [1, 1, gateInfo[gate].calculate(1, 1)]
        ];
    }
    tableEl.innerHTML = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                         <tbody>${rows.map(r => `<tr>${r.map(d => `<td>${d}</td>`).join('')}</tr>`).join('')}</tbody>`;
}

function setupTimeChart() {
    const ctx = document.getElementById('timeChart')?.getContext('2d');
    if (!ctx) return;
    timeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 8}, (_, i) => i),
            datasets: [
                { label: '入力A', data: [], borderColor: 'rgb(59, 130, 246)', stepped: true, yAxisID: 'y' },
                { label: '入力B', data: [], borderColor: 'rgb(239, 68, 68)', stepped: true, yAxisID: 'y1' },
                { label: '出力Y', data: [], borderColor: 'rgb(22, 163, 74)', stepped: true, borderWidth: 3, yAxisID: 'y2' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { min: -0.2, max: 1.2, display: false }, y1: { min: 1.8, max: 3.2, display: false },
                y2: { min: 3.8, max: 5.2, display: false }, x: { ticks: { display: false }, grid: { drawOnChartArea: false } }
            },
             plugins: { legend: { position: 'right' } }
        }
    });
}

function renderTimeChart(gate) {
    if (!timeChart) return;
    const inputA = [0, 0, 1, 1, 0, 1, 0, 1];
    const inputB = [0, 1, 0, 1, 1, 0, 1, 0];
    let outputY = inputA.map((a, i) => gateInfo[gate].calculate(a, inputB[i]));
    
    timeChart.data.datasets[0].data = inputA;
    timeChart.data.datasets[1].data = inputB.map(b => b + 2);
    timeChart.data.datasets[1].hidden = (gate === 'NOT');
    timeChart.data.datasets[2].data = outputY.map(y => y + 4);
    timeChart.update();
}


// --- 回路問題セクション ---
function setupCircuitProblems() {
    document.getElementById('circuit-problem-number').textContent = circuitProblemNumber;
    document.getElementById('check-circuit-answer-btn').classList.remove('hidden');
    document.getElementById('next-circuit-problem-btn').classList.add('hidden');
    document.getElementById('circuit-result-message').textContent = '';
    document.getElementById('circuit-explanation-container').classList.add('hidden');
    generateCircuitProblem();
    drawCircuitDiagram();
    generateCircuitOptions();
}

function generateCircuitProblem() {
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const type = randInt(0, 2);
    const r1 = randInt(1, 10) * 10; const r2 = randInt(1, 10) * 10;
    let r3, answer, explanation, resistors;
    switch (type) {
        case 0: // 直列
            answer = r1 + r2;
            explanation = `直列接続なので、単純に抵抗値を足し合わせます。<br>R = R1 + R2 = ${r1} + ${r2} = ${answer} Ω`;
            resistors = { type: 'series', r1, r2 };
            break;
        case 1: // 並列
            answer = (r1 * r2) / (r1 + r2);
            explanation = `並列接続の合成抵抗は「和分の積」で求めます。<br>R = (R1 * R2) / (R1 + R2) = (${r1} * ${r2}) / (${r1} + ${r2}) = ${answer.toFixed(2)} Ω`;
            resistors = { type: 'parallel', r1, r2 };
            break;
        case 2: // 直並列
            r3 = randInt(1, 10) * 10; const r23_parallel = (r2 * r3) / (r2 + r3);
            answer = r1 + r23_parallel;
            explanation = `まずR2とR3の並列部分を計算します。<br>R23 = (R2 * R3) / (R2 + R3) = (${r2} * ${r3}) / (${r2} + ${r3}) = ${r23_parallel.toFixed(2)} Ω<br>次に、R1と直列接続なので足し合わせます。<br>R = R1 + R23 = ${r1} + ${r23_parallel.toFixed(2)} = ${answer.toFixed(2)} Ω`;
            resistors = { type: 'series-parallel', r1, r2, r3 };
            break;
    }
    currentCircuitProblem = { resistors, answer, explanation };
}

function drawCircuitDiagram() {
    const container = document.getElementById('circuit-diagram-problem');
    const { type, r1, r2, r3 } = currentCircuitProblem.resistors;
    // フォントサイズを大きくし、見やすいフォントファミリーを指定
    const resistorSVG = (x, y, val, vert = false) => `<g ${vert?`transform="rotate(90 ${x} ${y})"`:''}><path d="M ${x} ${y} h 20 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10 h 20" stroke="black" fill="none" stroke-width="2"/><text ${vert?`x="${x+15}" y="${y+5}"`:`x="${x+40}" y="${y-5}"`} font-size="16" font-family="sans-serif">${val}Ω</text></g>`;
    let svg = '';
    let viewBoxWidth = 320;
    
    switch (type) {
        case 'series': 
            svg=`<circle cx="10" cy="50" r="5" fill="black"/><text x="5" y="40">A</text>
                 <line x1="10" y1="50" x2="50" y2="50" stroke="black" stroke-width="2"/>
                 ${resistorSVG(50,50,r1)}
                 ${resistorSVG(150,50,r2)}
                 <line x1="250" y1="50" x2="290" y2="50" stroke="black" stroke-width="2"/>
                 <circle cx="290" cy="50" r="5" fill="black"/><text x="285" y="40">B</text>`; 
            break;
        case 'parallel': 
            viewBoxWidth = 260;
            svg=`<circle cx="10" cy="50" r="5" fill="black"/><text x="5" y="40">A</text>
                 <path d="M 10 50 H 30 V 20 H 50" stroke="black" fill="none" stroke-width="2"/>
                 <path d="M 150 20 H 170 V 50 H 190" stroke="black" fill="none" stroke-width="2"/>
                 ${resistorSVG(50,20,r1)}
                 
                 <path d="M 30 50 V 80 H 50" stroke="black" fill="none" stroke-width="2"/>
                 <path d="M 150 80 H 170 V 50" stroke="black" fill="none" stroke-width="2"/>
                 ${resistorSVG(50,80,r2)}
                 <circle cx="190" cy="50" r="5" fill="black"/><text x="185" y="40">B</text>`;
            break;
        case 'series-parallel':
            viewBoxWidth = 360;
            svg = `
                <circle cx="10" cy="75" r="5" fill="black"/><text x="5" y="65">A</text>
                <rect x="155" y="25" width="150" height="100" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4"/>
                <text x="195" y="20" font-size="12" fill="#64748b">並列部分</text>

                <line x1="10" y1="75" x2="30" y2="75" stroke="black" stroke-width="2"/>
                ${resistorSVG(30, 75, r1)}
                <line x1="130" y1="75" x2="160" y2="75" stroke="black" stroke-width="2"/>
                
                <path d="M 160 75 V 40 H 180" stroke="black" fill="none" stroke-width="2"/>
                ${resistorSVG(180, 40, r2)}
                <path d="M 280 40 H 300 V 75" stroke="black" fill="none" stroke-width="2"/>
                
                <path d="M 160 75 V 110 H 180" stroke="black" fill="none" stroke-width="2"/>
                ${resistorSVG(180, 110, r3)}
                <path d="M 280 110 H 300 V 75" stroke="black" fill="none" stroke-width="2"/>

                <line x1="300" y1="75" x2="330" y2="75" stroke="black" stroke-width="2"/>
                <circle cx="330" cy="75" r="5" fill="black"/><text x="325" y="65">B</text>
            `;
            break;
    }
    container.innerHTML = `<svg viewBox="0 0 ${viewBoxWidth} 150" width="${viewBoxWidth}" height="150" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
}

function generateCircuitOptions() {
    const container = document.getElementById('circuit-options-container');
    const { answer } = currentCircuitProblem;
    let options = [parseFloat(answer.toFixed(2))];
    while (options.length < 4) {
        let wrongAnswer = parseFloat((answer * (Math.random() * 1.5 + 0.5)).toFixed(2));
        if (!options.includes(wrongAnswer) && wrongAnswer > 0) options.push(wrongAnswer);
    }
    options.sort(() => Math.random() - 0.5);
    container.innerHTML = options.map(opt => `<button class="circuit-option-btn" data-value="${opt}">${opt} Ω</button>`).join('');
    document.querySelectorAll('.circuit-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.circuit-option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

function checkCircuitAnswer() {
    const selectedBtn = document.querySelector('.circuit-option-btn.selected');
    if (!selectedBtn) return;
    const isCorrect = parseFloat(selectedBtn.dataset.value) === parseFloat(currentCircuitProblem.answer.toFixed(2));
    const resultMsg = document.getElementById('circuit-result-message');
    resultMsg.textContent = isCorrect ? '正解！' : '不正解...';
    resultMsg.className = isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
    document.getElementById('circuit-explanation-text').innerHTML = currentCircuitProblem.explanation;
    document.getElementById('circuit-explanation-container').classList.remove('hidden');
    document.getElementById('check-circuit-answer-btn').classList.add('hidden');
    document.getElementById('next-circuit-problem-btn').classList.remove('hidden');
}

// --- タイムチャート問題セクション ---
function setupTimingProblems() {
    document.getElementById('timing-problem-number').textContent = timingProblemNumber;
    document.getElementById('check-timing-answer-btn').classList.remove('hidden');
    document.getElementById('next-timing-problem-btn').classList.add('hidden');
    document.getElementById('timing-result-message').textContent = '';
    document.getElementById('timing-explanation-container').classList.add('hidden');
    timingChartInstances.forEach(chart => chart.destroy());
    timingChartInstances = [];
    generateTimingProblem();
    drawTimingProblemCharts();
}

function generateTimingProblem() {
    const gates = ['AND', 'OR', 'NAND', 'NOR', 'XOR'];
    const correctGate = gates[Math.floor(Math.random() * gates.length)];
    const inputA = Array.from({length: 8}, () => Math.round(Math.random()));
    const inputB = Array.from({length: 8}, () => Math.round(Math.random()));
    const correctAnswer = inputA.map((a, i) => gateInfo[correctGate].calculate(a, inputB[i]));
    let options = [{ gate: correctGate, waveform: correctAnswer, isCorrect: true }];
    let wrongGates = gates.filter(g => g !== correctGate);
    while (options.length < 4) {
        const wrongGate = wrongGates.splice(Math.floor(Math.random() * wrongGates.length), 1)[0];
        const wrongAnswer = inputA.map((a, i) => gateInfo[wrongGate].calculate(a, inputB[i]));
        options.push({ gate: wrongGate, waveform: wrongAnswer, isCorrect: false });
    }
    options.sort(() => Math.random() - 0.5);
    currentTimingProblem = { gate: correctGate, inputA, inputB, options, explanation: `この波形は${gateInfo[correctGate].title}の動作を示します。${gateInfo[correctGate].description}`};
}

function drawTimingProblemCharts() {
    const { gate, inputA, inputB, options } = currentTimingProblem;
    document.getElementById('timing-problem-gate-type').textContent = gate;
    const inputCtx = document.getElementById('timing-problem-chart-input').getContext('2d');
    timingChartInstances.push(new Chart(inputCtx, createTimingChartConfig(inputA, inputB, null)));
    const optionsContainer = document.getElementById('timing-options-container');
    optionsContainer.innerHTML = '';
    options.forEach((opt, index) => {
        const optionId = `timing-option-chart-${index}`;
        const card = document.createElement('div');
        card.className = 'timing-option-card';
        card.dataset.isCorrect = opt.isCorrect;
        card.innerHTML = `<p class="font-bold text-center mb-2">選択肢 ${index + 1}</p><div class="chart-container-option"><canvas id="${optionId}"></canvas></div>`;
        optionsContainer.appendChild(card);
        const optCtx = document.getElementById(optionId).getContext('2d');
        timingChartInstances.push(new Chart(optCtx, createTimingChartConfig(null, null, opt.waveform)));
        card.addEventListener('click', () => {
            document.querySelectorAll('.timing-option-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
}

function createTimingChartConfig(dataA, dataB, dataY) {
    const datasets = [];
    if (dataA) datasets.push({ label: '入力A', data: dataA.map(d => d + 2), borderColor: 'rgb(59, 130, 246)', stepped: true });
    if (dataB) datasets.push({ label: '入力B', data: dataB, borderColor: 'rgb(239, 68, 68)', stepped: true });
    if (dataY) datasets.push({ label: '出力Y', data: dataY, borderColor: 'rgb(22, 163, 74)', stepped: true, borderWidth: 3 });
    return {
        type: 'line', data: { labels: Array.from({length: 8}, (_, i) => i), datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { min: -0.5, max: (dataY ? 1.5 : 3.5), ticks: { display: false }, grid: { color: '#e5e7eb' } }, x: { ticks: { display: false }, grid: { display: false } } },
            plugins: { legend: { display: !!(dataA || dataB) } }
        }
    };
}

function checkTimingAnswer() {
    const selected = document.querySelector('.timing-option-card.selected');
    if (!selected) return;
    const isCorrect = selected.dataset.isCorrect === 'true';
    const resultMsg = document.getElementById('timing-result-message');
    resultMsg.textContent = isCorrect ? '正解！' : '不正解...';
    resultMsg.className = isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
    document.getElementById('timing-explanation-text').innerHTML = currentTimingProblem.explanation;
    document.getElementById('timing-explanation-container').classList.remove('hidden');
    document.getElementById('check-timing-answer-btn').classList.add('hidden');
    document.getElementById('next-timing-problem-btn').classList.remove('hidden');
}



