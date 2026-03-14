// Auth Logic
let currentAuthMode = 'login';

function switchAuth(mode) {
    currentAuthMode = mode;
    const tabs = document.querySelectorAll('.tab-btn');
    if (tabs.length === 0) return;
    tabs.forEach(tab => tab.classList.remove('active'));

    if (mode === 'login') {
        tabs[0].classList.add('active');
        document.querySelector('.signup-field').style.display = 'none';
        document.getElementById('auth-submit-btn').innerText = 'Login to Continue';
    } else {
        tabs[1].classList.add('active');
        document.querySelector('.signup-field').style.display = 'block';
        document.getElementById('auth-submit-btn').innerText = 'Create Account';
    }
}

function handleAuth(e) {
    e.preventDefault();
    localStorage.setItem('isAuthenticated', 'true');
    window.location.href = '/dashboard.html';
}

function logout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/';
}

// Check auth on protected pages
if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('analysis')) {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = '/';
    }
}

// Prediction Logic
async function handlePredict(e) {
    e.preventDefault();
    const btn = document.getElementById('predict-btn');
    btn.innerText = 'Analyzing...';
    btn.disabled = true;

    const payload = {
        Country: document.getElementById('Country').value,
        ISO: document.getElementById('ISO').value,
        Region: document.getElementById('Region').value,
        Currency: document.getElementById('Currency').value,
        Before_War_Price: parseFloat(document.getElementById('Before_War_Price').value),
        Unit: document.getElementById('Unit').value,
        Trend: document.getElementById('Trend').value,
        Before_War_USD: parseFloat(document.getElementById('Before_War_USD').value),
        Mar7_USD: parseFloat(document.getElementById('Mar7_USD').value),
        Oil_Import_Dep: document.getElementById('Oil_Import_Dep').value
    };

    localStorage.setItem('lastPredictionInputs', JSON.stringify(payload));

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('lastPredictionPrice', data.predicted_price);
            window.location.href = '/analysis.html';
        } else {
            alert('Error: ' + data.detail);
            btn.innerText = 'Generate Prediction';
            btn.disabled = false;
        }
    } catch (err) {
        alert('Failed to connect to backend: ' + err.message);
        btn.innerText = 'Generate Prediction';
        btn.disabled = false;
    }
}

// Analysis Page Logic
function initAnalysis() {
    if (!document.getElementById('analysis-summary')) return;

    const inputsStr = localStorage.getItem('lastPredictionInputs');
    const price = localStorage.getItem('lastPredictionPrice');

    if (!inputsStr || !price) {
        document.getElementById('analysis-summary').innerText = 'No prediction data found. Please run a prediction first.';
        return;
    }

    const inputs = JSON.parse(inputsStr);
    const predictedPrice = parseFloat(price).toFixed(2);
    const predictedPriceINR = (parseFloat(price) * 83.5).toFixed(2); // Approximate conversion rate

    // Animate price counter
    animateValue("predicted-value", 0, parseFloat(predictedPrice), 1500);
    animateValue("predicted-value-inr", 0, parseFloat(predictedPriceINR), 1500);

    // Calculate shift percentage
    const previousPrice = parseFloat(inputs.Mar7_USD);
    const predictedValue = parseFloat(predictedPrice);
    let shiftPercent = 0;
    if (previousPrice > 0) {
        shiftPercent = ((predictedValue - previousPrice) / previousPrice) * 100;
    }
    const shiftText = (shiftPercent > 0 ? '+' : '') + shiftPercent.toFixed(2) + '%';

    // Set UI Stats
    document.getElementById('stat-currency').innerText = inputs.Currency;

    const shiftEl = document.getElementById('stat-shift');
    shiftEl.innerText = shiftText;
    if (shiftPercent > 0) shiftEl.style.color = '#ef4444'; // Red for increase
    else if (shiftPercent < 0) shiftEl.style.color = '#34d399'; // Green for decrease
    else shiftEl.style.color = 'var(--text-primary)';

    document.getElementById('stat-risk').innerText = inputs.Oil_Import_Dep + ' Risk';
    if (inputs.Oil_Import_Dep === 'High') document.getElementById('stat-risk').style.color = '#ef4444';
    else if (inputs.Oil_Import_Dep === 'Medium') document.getElementById('stat-risk').style.color = '#f59e0b';
    else document.getElementById('stat-risk').style.color = '#34d399';

    // Summary Text
    const trendText = inputs.Trend.toLowerCase() === 'up' ? 'shows historical upward momentum' : 'has a stable/downward trajectory';

    let analysisMsg = `In ${inputs.Country} (${inputs.Region}), the market ${trendText}. `;
    if (shiftPercent > 0) {
        analysisMsg += `The model anticipates a significant price surge of ${shiftPercent.toFixed(2)}% compared to March levels, primarily influenced by your ${inputs.Oil_Import_Dep.toLowerCase()} dependency on oil imports.`;
    } else if (shiftPercent < 0) {
        analysisMsg += `The model suggests a price relief of ${Math.abs(shiftPercent).toFixed(2)}%, offering a stabilization period despite the ${inputs.Oil_Import_Dep.toLowerCase()} import dependency.`;
    } else {
        analysisMsg += `Prices are projected to remain relatively stable.`;
    }
    document.getElementById('analysis-summary').innerText = analysisMsg;

    // Render Chart
    const ctx = document.getElementById('comparisonChart').getContext('2d');

    const gradientPre = ctx.createLinearGradient(0, 0, 0, 400);
    gradientPre.addColorStop(0, 'rgba(192, 132, 252, 0.8)');
    gradientPre.addColorStop(1, 'rgba(192, 132, 252, 0.2)');

    const gradientPost = ctx.createLinearGradient(0, 0, 0, 400);
    gradientPost.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
    gradientPost.addColorStop(1, 'rgba(56, 189, 248, 0.2)');

    const gradientPred = ctx.createLinearGradient(0, 0, 0, 400);
    gradientPred.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
    gradientPred.addColorStop(1, 'rgba(52, 211, 153, 0.2)');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Before War (USD)', 'March 7 (USD)', 'Predicted Future (USD)'],
            datasets: [{
                label: 'Global Petrol Price',
                data: [inputs.Before_War_USD, inputs.Mar7_USD, predictedPrice],
                backgroundColor: [gradientPre, gradientPost, gradientPred],
                borderColor: ['#c084fc', '#38bdf8', '#34d399'],
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#38bdf8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    var range = end - start;
    var current = start;
    var stepTime = 30; // ms
    var steps = duration / stepTime;
    var increment = range / steps;
    var obj = document.getElementById(id);
    var timer = setInterval(function () {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            obj.innerHTML = end.toFixed(2);
            clearInterval(timer);
        } else {
            obj.innerHTML = current.toFixed(2);
        }
    }, stepTime);
}
