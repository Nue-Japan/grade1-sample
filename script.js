let bridgeChart;
let timeChart;
let currentLogicGate = 'AND';

const gateInfo = {
    'AND': {
        title: 'ANDゲート',
        description: '入力Aと入力Bが両方とも「1」(HIGH)のときだけ、出力Yが「1」になります。「論理積」とも呼ばれます。',
        symbol: 'A・B',
        truthTable: { headers: ['A', 'B', 'Y'], rows: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]] }
    },
    'OR': {
        title: 'ORゲート',
        description: '入力Aまたは入力Bのどちらか一方、あるいは両方が「1」のとき、出力Yが「1」になります。「論理和」とも呼ばれます。',
        symbol: 'A+B',
        truthTable: { headers: ['A', 'B', 'Y'], rows: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]] }
    },
    'NOT': {
        title: 'NOTゲート',
        description: '入力を反転させて出力します。入力が「1」なら出力は「0」、入力が「0」なら出力は「1」になります。「否定」とも呼ばれます。',
        symbol: 'Ā',
        truthTable: { headers: ['A', 'Y'], rows: [[0, 1], [1, 0]] }
    },
    'NAND': {
        title: 'NANDゲート',
        description: 'ANDゲートの出力を反転させたものです。入力AとBが両方とも「1」のときだけ、出力が「0」になります。',
        symbol: 'A・B',
        truthTable: { headers: ['A', 'B', 'Y'], rows: [[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 0]] }
    },
    'NOR': {
        title: 'NORゲート',
        description: 'ORゲートの出力を反転させたものです。入力AとBが両方とも「0」のときだけ、出力が「1」になります。',
        symbol: 'A+B',
        truthTable: { headers: ['A', 'B', 'Y'], rows: [[0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 0]] }
    },
    'XOR': {
        title: 'XORゲート',
        description: '入力AとBの値が異なるときだけ、出力が「1」になります。「排他的論理和」とも呼ばれます。',
        symbol: 'A⊕B',
        truthTable: { headers: ['A', 'B', 'Y'], rows: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]] }
    },
    'XNOR': {
        title: 'XNORゲート',
        description: 'XORゲートの出力を反転させたものです。入力AとBの値が同じときだけ、出力が「1」になります。',
        symbol: 'A⊕B',
        truthTable: { headers: ['A', 'B', 'Y'], rows: [[0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 1]] }
    }
};


function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionId}`);
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent.includes(document.querySelector(`#section-${sectionId} h2`).textContent.split('：')[0]));
    });
}

function switchMeter(meterType) {
    const isShunt = meterType === 'shunt';
    document.getElementById('shunt-calc').classList.toggle('hidden', !isShunt);
    document.getElementById('subtab-shunt').classList.toggle('active', isShunt);

    document.getElementById('multiplier-calc').classList.toggle('hidden', isShunt);
    document.getElementById('subtab-multiplier').classList.toggle('active', !isShunt);
}

function calculateShunt() {
    const ra = parseFloat(document.getElementById('shunt-ra').value);
    const n = parseFloat(document.getElementById('shunt-n').value);
    const resultEl = document.getElementById('shunt-result');
    if (isNaN(ra) || isNaN(n) || n <= 1) {
        resultEl.textContent = '無効な入力です';
        return;
    }
    const rs = ra / (n - 1);
    resultEl.textContent = `分流器の抵抗 (Rs) = ${rs.toFixed(2)} Ω`;
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
    resultEl.textContent = `倍率器の抵抗 (Rm) = ${rm.toFixed(2)} kΩ`;
}

function setupBridge() {
    const r1Input = document.getElementById('bridge-r1');
    const r2Input = document.getElementById('bridge-r2');
    const r3Input = document.getElementById('bridge-r3');
    const rxSlider = document.getElementById('bridge-rx-slider');
    
    const updateBridge = () => {
        const r1 = parseFloat(r1Input.value) || 0;
        const r2 = parseFloat(r2Input.value) || 0;
        const r3 = parseFloat(r3Input.value) || 0;
        const userRx = parseFloat(rxSlider.value) || 0;
        
        document.getElementById('bridge-rx-value').textContent = userRx.toFixed(2);
        
        let idealRx = (r1 > 0) ? (r2 * r3) / r1 : 0;
        document.getElementById('bridge-ideal-rx').textContent = idealRx.toFixed(2) + ' Ω';
        
        let unbalance = (idealRx > 0) ? ((userRx - idealRx) / idealRx * 100) : (userRx > 0 ? 100 : 0);
        renderBridgeChart(unbalance);
    };
    
    [r1Input, r2Input, r3Input, rxSlider].forEach(el => el.addEventListener('input', updateBridge));
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

function setupConverter() {
    const decIn = document.getElementById('conv-dec');
    const binIn = document.getElementById('conv-bin');
    const hexIn = document.getElementById('conv-hex');
    const inputs = { dec: decIn, bin: binIn, hex: hexIn };

    const convert = (source) => {
        let val;
        try {
            switch (source) {
                case 'dec':
                    val = parseInt(inputs.dec.value, 10);
                    if (!isNaN(val)) {
                        inputs.bin.value = val.toString(2);
                        inputs.hex.value = val.toString(16).toUpperCase();
                    } else { inputs.bin.value = ''; inputs.hex.value = ''; }
                    break;
                case 'bin':
                    val = parseInt(inputs.bin.value.replace(/[^01]/g, ''), 2);
                     if (!isNaN(val)) {
                        inputs.dec.value = val;
                        inputs.hex.value = val.toString(16).toUpperCase();
                    } else { inputs.dec.value = ''; inputs.hex.value = ''; }
                    break;
                case 'hex':
                    val = parseInt(inputs.hex.value.replace(/[^0-9A-Fa-f]/g, ''), 16);
                     if (!isNaN(val)) {
                        inputs.dec.value = val;
                        inputs.bin.value = val.toString(2);
                    } else { inputs.dec.value = ''; inputs.bin.value = ''; }
                    break;
            }
        } catch (e) { /* Ignore parsing errors during input */ }
    };
    Object.keys(inputs).forEach(key => inputs[key]?.addEventListener('input', () => convert(key)));
}

function selectLogicGate(gate) {
    currentLogicGate = gate;
    const info = gateInfo[gate];

    document.querySelectorAll('.logic-gate-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === gate);
    });
    
    document.getElementById('gate-title').textContent = info.title;
    document.getElementById('gate-description').textContent = info.description;
    document.getElementById('gate-symbol').textContent = info.symbol;
    document.getElementById('gate-input-b-container').style.display = gate === 'NOT' ? 'none' : '';
    
    renderTruthTable(info.truthTable);
    updateGateOutput();
    renderTimeChart(gate);
}

function renderTruthTable(tableData) {
    const tableEl = document.getElementById('truth-table');
    if (!tableEl) return;
    tableEl.innerHTML = `<thead><tr>${tableData.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                         <tbody>${tableData.rows.map(r => `<tr>${r.map(d => `<td>${d}</td>`).join('')}</tr>`).join('')}</tbody>`;
}

function updateGateOutput() {
    const inputA = document.getElementById('gate-input-a').checked;
    const inputB = document.getElementById('gate-input-b').checked;
    const outputEl = document.getElementById('gate-output');
    let outputVal = 0;

    switch (currentLogicGate) {
        case 'AND': outputVal = inputA & inputB; break;
        case 'OR':  outputVal = inputA | inputB; break;
        case 'NOT': outputVal = !inputA; break;
        case 'NAND':outputVal = !(inputA & inputB); break;
        case 'NOR': outputVal = !(inputA | inputB); break;
        case 'XOR': outputVal = inputA ^ inputB; break;
        case 'XNOR':outputVal = !(inputA ^ inputB); break;
    }
    
    outputVal = Number(outputVal);
    outputEl.textContent = outputVal;
    outputEl.classList.toggle('high', outputVal === 1);
}

function setupTimeChart() {
    const ctx = document.getElementById('timeChart')?.getContext('2d');
    if (!ctx) return;
    timeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 12}, (_, i) => i),
            datasets: [
                { label: '入力A', data: [], borderColor: 'rgb(59, 130, 246)', stepped: true },
                { label: '入力B', data: [], borderColor: 'rgb(239, 68, 68)', stepped: true },
                { label: '出力Y', data: [], borderColor: 'rgb(22, 163, 74)', stepped: true, borderWidth: 3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { min: -0.2, max: 1.2, ticks: { stepSize: 1, callback: (v) => (v === 0 ? 'L' : (v === 1 ? 'H' : '')) } },
                x: { ticks: { display: false }, grid: { drawOnChartArea: false } }
            }
        }
    });
}

function renderTimeChart(gate) {
    if (!timeChart) return;
    const inputA = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1];
    const inputB = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0];
    let outputY = inputA.map((a, i) => {
        const b = inputB[i];
        switch (gate) {
            case 'AND':  return a & b;
            case 'OR':   return a | b;
            case 'NOT':  return 1 - a;
            case 'NAND': return 1 - (a & b);
            case 'NOR':  return 1 - (a | b);
            case 'XOR':  return a ^ b;
            case 'XNOR': return 1 - (a ^ b);
            default: return 0;
        }
    });
    
    timeChart.data.datasets[0].data = inputA;
    timeChart.data.datasets[1].data = inputB;
    timeChart.data.datasets[1].hidden = (gate === 'NOT');
    timeChart.data.datasets[2].data = outputY;
    time-chart.update();
}

document.addEventListener('DOMContentLoaded', () => {
    showSection('home');
    
    // Electric Circuits
    calculateShunt();
    calculateMultiplier();
    setupBridge();
    
    // Digital Fundamentals
    setupConverter();
    
    // Logic Circuits
    selectLogicGate('AND');
    document.getElementById('gate-input-a')?.addEventListener('change', updateGateOutput);
    document.getElementById('gate-input-b')?.addEventListener('change', updateGateOutput);
    setupTimeChart();
});

