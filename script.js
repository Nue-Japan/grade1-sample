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
    'AND': { name: 'AND', truthTable: (a, b) => a & b },
    'OR': { name: 'OR', truthTable: (a, b) => a | b },
    'NOT': { name: 'NOT', truthTable: (a) => 1 - a },
    'NAND': { name: 'NAND', truthTable: (a, b) => 1 - (a & b) },
    'NOR': { name: 'NOR', truthTable: (a, b) => 1 - (a | b) },
    'XOR': { name: 'XOR', truthTable: (a, b) => a ^ b },
    'XNOR': { name: 'XNOR', truthTable: (a, b) => 1 - (a ^ b) },
};

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    // ページセクションの初期化
    showSection('home');
    
    // 電気回路
    calculateShunt();
    calculateMultiplier();
    setupBridge();
    
    // デジタル基礎
    setupConverter();
    
    // 論理回路
    selectLogicGate('AND');
    setupTimeChart();

    // 回路問題
    setupCircuitProblems();
    document.getElementById('check-circuit-answer-btn').addEventListener('click', checkCircuitAnswer);
    document.getElementById('next-circuit-problem-btn').addEventListener('click', () => {
        circuitProblemNumber++;
        setupCircuitProblems();
    });

    // タイムチャート問題
    setupTimingProblems();
    document.getElementById('check-timing-answer-btn').addEventListener('click', checkTimingAnswer);
    document.getElementById('next-timing-problem-btn').addEventListener('click', () => {
        timingProblemNumber++;
        setupTimingProblems();
    });
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
    if (isNaN(ra) || isNaN(n) || n <= 1) {
        resultEl.textContent = '無効な入力です';
        return;
    }
    const rs = ra / (n - 1);
    resultEl.innerHTML = `分流器の抵抗 (Rs) = <span class="text-2xl">${rs.toFixed(2)}</span> Ω`;
}

function calculateMultiplier() {
    const rv = parseFloat(document.getElementById('multiplier-rv').value);
    const n = parseFloat(document.getElementById('multiplier-n').value);
    const resultEl = document.getElementById('multiplier-result');
    if (isNaN(rv) || isNaN(n) || n <= 1) {
        resultEl.textContent = '無効な入力です';
        return;
    }
    const rm = rv * (n - 1);
    resultEl.innerHTML = `倍率器の抵抗 (Rm) = <span class="text-2xl">${rm.toFixed(2)}</span> kΩ`;
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
            type: 'bar',
            data: {
                labels: ['検流計の振れ'],
                datasets: [{ label: '不平衡度 (%)', data: [0], backgroundColor: ['#ef4444'], borderWidth: 1 }]
            },
            options: {
                indexAxis: 'y',
                scales: { x: { min: -100, max: 100, title: { display: true, text: '不平衡度 (%)' } } },
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }
    bridgeChart.data.datasets[0].data[0] = unbalance;
    bridgeChart.data.datasets[0].backgroundColor[0] = Math.abs(unbalance) < 1 ? '#22c55e' : '#3b82f6';
    bridgeChart.update();
}

// --- デジタル基礎セクション ---
function setupConverter() {
    const inputs = {
        dec: document.getElementById('conv-dec'),
        bin: document.getElementById('conv-bin'),
        hex: document.getElementById('conv-hex')
    };
    Object.keys(inputs).forEach(key => {
        inputs[key]?.addEventListener('input', () => {
            let val;
            const sourceElem = inputs[key];
            if (sourceElem.value === '') {
                inputs.dec.value = '';
                inputs.bin.value = '';
                inputs.hex.value = '';
                return;
            }
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
    document.querySelectorAll('.logic-gate-btn').forEach(btn => btn.classList.toggle('active', btn.textContent === gate));
    
    document.getElementById('gate-title').textContent = `${gate}ゲート`;
    renderTruthTable(gate);
    renderTimeChart(gate);
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
            [0, 0, gateInfo[gate].truthTable(0, 0)],
            [0, 1, gateInfo[gate].truthTable(0, 1)],
            [1, 0, gateInfo[gate].truthTable(1, 0)],
            [1, 1, gateInfo[gate].truthTable(1, 1)]
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
                y: { min: -0.2, max: 1.2, display: false },
                y1: { min: 1.8, max: 3.2, display: false },
                y2: { min: 3.8, max: 5.2, display: false },
                x: { ticks: { display: false }, grid: { drawOnChartArea: false } }
            },
             plugins: { legend: { position: 'right' } }
        }
    });
}

function renderTimeChart(gate) {
    if (!timeChart) return;
    const inputA = [0, 0, 1, 1, 0, 1, 0, 1];
    const inputB = [0, 1, 0, 1, 1, 0, 1, 0];
    let outputY = inputA.map((a, i) => gateInfo[gate].truthTable(a, inputB[i]));
    
    timeChart.data.datasets[0].data = inputA;
    timeChart.data.datasets[1].data = inputB.map(b => b + 2);
    timeChart.data.datasets[1].hidden = (gate === 'NOT');
    timeChart.data.datasets[2].data = outputY.map(y => y + 4);
    timeChart.update();
}


// --- 回路問題セクション ---
function setupCircuitProblems() {
    document.getElementById('circuit-problem-number').textContent = circuitProblemNumber;
    
    // UIリセット
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
    const r1 = randInt(1, 10) * 10;
    const r2 = randInt(1, 10) * 10;
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
            r3 = randInt(1, 10) * 10;
            const r23_parallel = (r2 * r3) / (r2 + r3);
            answer = r1 + r23_parallel;
            explanation = `まずR2とR3の並列部分を計算します。<br>R23 = (R2 * R3) / (R2 + R3) = (${r2} * ${r3}) / (${r2} + ${r3}) = ${r23_parallel.toFixed(2)} Ω<br>次に、R1と直列接続なので足し合わせます。<br>R = R1 + R23 = ${r1} + ${r23_parallel.toFixed(2)} = ${answer.toFixed(2)} Ω`;
            resistors = { type: 'series-parallel', r1, r2, r3 };
            break;
    }

    currentCircuitProblem = {
        resistors,
        answer,
        explanation
    };
}

function drawCircuitDiagram() {
    const container = document.getElementById('circuit-diagram-problem');
    const { type, r1, r2, r3 } = currentCircuitProblem.resistors;
    
    const resistorSVG = (x, y, val, vertical = false) => {
        const rotation = vertical ? `transform="rotate(90, ${x}, ${y})"` : '';
        const textPos = vertical ? `x="${x+15}" y="${y+5}"` : `x="${x+40}" y="${y-5}"`;
        return `
            <g ${rotation}>
                <path d="M ${x} ${y} h 20 l 5 -10 l 10 20 l 10 -20 l 10 20 l 5 -10 h 20" stroke="black" fill="none" stroke-width="2"/>
                <text ${textPos} font-size="14">${val}Ω</text>
            </g>`;
    };

    let svgContent = '';
    switch (type) {
        case 'series':
            svgContent = `
                <line x1="10" y1="50" x2="50" y2="50" stroke="black" stroke-width="2"/>
                ${resistorSVG(50, 50, r1)}
                ${resistorSVG(150, 50, r2)}
                <line x1="250" y1="50" x2="290" y2="50" stroke="black" stroke-width="2"/>
            `;
            break;
        case 'parallel':
            svgContent = `
                <path d="M 50 50 h -40 v -30 h 120 v 30 h -40 m -40 0 v 30 h 120 v -30 h -80" stroke="black" fill="none" stroke-width="2"/>
                ${resistorSVG(70, 20, r1)}
                ${resistorSVG(70, 80, r2)}
            `;
            break;
        case 'series-parallel':
             svgContent = `
                <line x1="10" y1="75" x2="50" y2="75" stroke="black" stroke-width="2"/>
                ${resistorSVG(50, 75, r1)}
                <path d="M 150 75 h 20 m 0 -30 v 60 m -20 0 h 20 v -60 h 80 v 60 h 20 m 0 -30 h 20" stroke="black" fill="none" stroke-width="2"/>
                ${resistorSVG(190, 45, r2)}
                ${resistorSVG(190, 105, r3)}
            `;
            break;
    }
    
    container.innerHTML = `<svg viewBox="0 0 300 150" width="300" height="150" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="50" r="5" fill="black" /><text x="5" y="40">A</text>
        ${type === 'series' ? `<circle cx="290" cy="50" r="5" fill="black" /><text x="285" y="40">B</text>` : ''}
        ${type === 'parallel' ? `<circle cx="50" cy="50" r="5" fill="black" /><text x="45" y="40">B</text>` : ''}
        ${type === 'series-parallel' ? `<circle cx="310" cy="75" r="5" fill="black" /><text x="305" y="65">B</text>` : ''}
        ${svgContent}
    </svg>`;
}


function generateCircuitOptions() {
    const container = document.getElementById('circuit-options-container');
    const { answer } = currentCircuitProblem;
    let options = [parseFloat(answer.toFixed(2))];

    while (options.length < 4) {
        let wrongAnswer = answer * (Math.random() * 1.5 + 0.5);
        wrongAnswer = parseFloat(wrongAnswer.toFixed(2));
        if (!options.includes(wrongAnswer) && wrongAnswer > 0) {
            options.push(wrongAnswer);
        }
    }

    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    container.innerHTML = options.map(opt => `
        <button class="circuit-option-btn" data-value="${opt}">${opt} Ω</button>
    `).join('');

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

    const selectedValue = parseFloat(selectedBtn.dataset.value);
    const correctAnswer = parseFloat(currentCircuitProblem.answer.toFixed(2));
    const resultMsg = document.getElementById('circuit-result-message');
    const isCorrect = selectedValue === correctAnswer;

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
    
    // UIリセット
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
    const correctAnswer = inputA.map((a, i) => gateInfo[correctGate].truthTable(a, inputB[i]));

    let options = [{ gate: correctGate, waveform: correctAnswer, isCorrect: true }];
    let wrongGates = gates.filter(g => g !== correctGate);
    
    while (options.length < 4) {
        const wrongGate = wrongGates.splice(Math.floor(Math.random() * wrongGates.length), 1)[0];
        const wrongAnswer = inputA.map((a, i) => gateInfo[wrongGate].truthTable(a, inputB[i]));
        options.push({ gate: wrongGate, waveform: wrongAnswer, isCorrect: false });
    }

    options.sort(() => Math.random() - 0.5);

    currentTimingProblem = {
        gate: correctGate,
        inputA,
        inputB,
        options,
        explanation: `このゲートは${correctGate}ゲートです。入力AとBの両方が1のときだけ出力が1になる(AND)、どちらかが1なら1になる(OR)など、各ゲートの真理値表に従って出力が決まります。`
    };
}

function drawTimingProblemCharts() {
    const { gate, inputA, inputB, options } = currentTimingProblem;
    document.getElementById('timing-problem-gate-type').textContent = gate;

    // 入力チャートの描画
    const inputCtx = document.getElementById('timing-problem-chart-input').getContext('2d');
    timingChartInstances.push(new Chart(inputCtx, createTimingChartConfig(inputA, inputB)));

    // 選択肢の描画
    const optionsContainer = document.getElementById('timing-options-container');
    optionsContainer.innerHTML = '';
    options.forEach((opt, index) => {
        const optionId = `timing-option-chart-${index}`;
        const card = document.createElement('div');
        card.className = 'timing-option-card';
        card.dataset.isCorrect = opt.isCorrect;
        card.innerHTML = `
            <p class="font-bold text-center mb-2">選択肢 ${index + 1}</p>
            <div class="chart-container-option"><canvas id="${optionId}"></canvas></div>
        `;
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
        type: 'line',
        data: {
            labels: Array.from({length: 8}, (_, i) => i),
            datasets: datasets
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { min: -0.5, max: (dataY ? 1.5 : 3.5), ticks: { display: false }, grid: { color: '#e5e7eb' } },
                x: { ticks: { display: false }, grid: { display: false } }
            },
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
