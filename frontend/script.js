// ========================================
// UNIGUARD - COMPLETE DASHBOARD FUNCTIONALITY
// Full Integration with Your Backend API
// ========================================

const API_BASE_URL = 'http://localhost:5000/api';

// ========== STATE MANAGEMENT ==========
let currentUser = null;
let darkMode = localStorage.getItem('darkMode') === 'true';
let currentPrediction = null;
let apexChart = null;
let analyticsChart = null;
let currentFeedbackPrediction = null;
let modelMetrics = {
    r2_percentage: 93.72,
    rmse: 1.04,
    mse: 1.07,
    mape: 0.38
};

// ========== DOM ELEMENTS ==========
const elements = {
    loadingScreen: document.getElementById('loadingScreen'),
    menuToggle: document.getElementById('menuToggle'),
    sidebar: document.getElementById('sidebar'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    logoutBtn: document.getElementById('logoutBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    userName: document.getElementById('userName'),
    welcomeName: document.getElementById('welcomeName'),
    mainContent: document.getElementById('mainContent'),
    
    pages: {
        dashboard: document.getElementById('dashboardPage'),
        predict: document.getElementById('predictPage'),
        history: document.getElementById('historyPage'),
        analytics: document.getElementById('analyticsPage'),
        feedback: document.getElementById('feedbackPage')
    },
    
    // Dashboard
    totalHalls: document.getElementById('totalHalls'),
    totalPredictions: document.getElementById('totalPredictions'),
    highRiskCount: document.getElementById('highRiskCount'),
    modelAccuracy: document.getElementById('modelAccuracy'),
    quickHall: document.getElementById('quickHall'),
    quickPredict: document.getElementById('quickPredict'),
    recentTable: document.getElementById('recentTable'),
    
    // Predict
    hallSelect: document.getElementById('hallSelect'),
    semesterSelect: document.getElementById('semesterSelect'),
    yearSelect: document.getElementById('yearSelect'),
    predictionForm: document.getElementById('predictionForm'),
    emptyState: document.getElementById('emptyState'),
    resultsContainer: document.getElementById('resultsContainer'),
    resultHallName: document.getElementById('resultHallName'),
    resultSemester: document.getElementById('resultSemester'),
    resultDate: document.getElementById('resultDate'),
    totalIncidents: document.getElementById('totalIncidents'),
    misconductChart: document.getElementById('misconductChart'),
    detailedResults: document.getElementById('detailedResults'),
    savePrediction: document.getElementById('savePrediction'),
    newPrediction: document.getElementById('newPrediction'),
    predictAllBtn: document.getElementById('predictAllBtn'),
    
    // History
    historyTable: document.getElementById('historyTable'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    
    // Analytics
    hallChart: document.getElementById('hallChart'),
    
    // Feedback
    feedbackSemester: document.getElementById('feedbackSemester'),
    feedbackYear: document.getElementById('feedbackYear'),
    loadPredictionsBtn: document.getElementById('loadPredictionsForFeedback'),
    feedbackHallSelect: document.getElementById('feedbackHallSelect'),
    hallFeedbackSection: document.getElementById('hallFeedbackSection'),
    feedbackFormSection: document.getElementById('feedbackFormSection'),
    selectedHallName: document.getElementById('selectedHallName'),
    selectedSemester: document.getElementById('selectedSemester'),
    selectedYear: document.getElementById('selectedYear'),
    feedbackTableBody: document.getElementById('feedbackTableBody'),
    totalPredicted: document.getElementById('totalPredicted'),
    totalActual: document.getElementById('totalActual'),
    totalDifference: document.getElementById('totalDifference'),
    totalAccuracy: document.getElementById('totalAccuracy'),
    submitFeedbackBtn: document.getElementById('submitFeedbackBtn'),
    resetFeedbackBtn: document.getElementById('resetFeedbackBtn'),
    improvementStats: document.getElementById('improvementStats'),
    accuracyImprovement: document.getElementById('accuracyImprovement'),
    newTrainingSamples: document.getElementById('newTrainingSamples'),
    newModelAccuracy: document.getElementById('newModelAccuracy'),
    downloadFeedbackBtn: document.getElementById('downloadFeedbackData'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ========== INITIALIZATION ==========
async function init() {
    try {
        await checkAuth();
        setupDarkMode();
        setupEventListeners();
        await loadInitialData();
        showPage('dashboard');
        
        setTimeout(() => {
            if (elements.loadingScreen) {
                elements.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    elements.loadingScreen.classList.add('hidden');
                }, 500);
            }
        }, 800);
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// ========== AUTHENTICATION ==========
async function checkAuth() {
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    try {
        currentUser = JSON.parse(userData);
        updateUserInfo();
    } catch (error) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

function updateUserInfo() {
    if (!currentUser) return;
    const name = currentUser.full_name || currentUser.username;
    if (elements.userName) elements.userName.textContent = name;
    if (elements.welcomeName) elements.welcomeName.textContent = name;
}

// ========== DARK MODE ==========
function setupDarkMode() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        if (elements.darkModeToggle) {
            elements.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (elements.darkModeToggle) {
            elements.darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
}

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    setupDarkMode();
    if (currentPrediction) createMisconductChart(currentPrediction.predictions);
    loadAnalytics();
    showToast(`Switched to ${darkMode ? 'dark' : 'light'} mode`, 'info');
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    if (elements.darkModeToggle) {
        elements.darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            showPage(page);
            if (window.innerWidth < 1024 && elements.sidebar) {
                elements.sidebar.classList.remove('active');
                elements.menuToggle?.classList.remove('active');
                const icon = elements.menuToggle?.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
                if (elements.mainContent) elements.mainContent.classList.add('expanded');
            }
        });
    });
    
    if (elements.quickPredict) {
        elements.quickPredict.addEventListener('click', handleQuickPrediction);
    }
    
    if (elements.predictionForm) {
        elements.predictionForm.addEventListener('submit', handlePrediction);
    }
    
    if (elements.predictAllBtn) {
        elements.predictAllBtn.addEventListener('click', handlePredictAll);
    }
    
    if (elements.savePrediction) {
        elements.savePrediction.addEventListener('click', saveCurrentPrediction);
    }
    
    if (elements.newPrediction) {
        elements.newPrediction.addEventListener('click', resetPredictionForm);
    }
    
    if (elements.clearHistoryBtn) {
        elements.clearHistoryBtn.addEventListener('click', clearAllHistory);
    }
    
    if (elements.loadPredictionsBtn) {
        elements.loadPredictionsBtn.addEventListener('click', loadPredictionsForFeedback);
    }
    
    if (elements.feedbackHallSelect) {
        elements.feedbackHallSelect.addEventListener('change', loadHallPredictionForFeedback);
    }
    
    if (elements.submitFeedbackBtn) {
        elements.submitFeedbackBtn.addEventListener('click', submitFeedback);
    }
    
    if (elements.resetFeedbackBtn) {
        elements.resetFeedbackBtn.addEventListener('click', resetFeedbackForm);
    }
    
    if (elements.downloadFeedbackBtn) {
        elements.downloadFeedbackBtn.addEventListener('click', exportFeedbackData);
    }
}

function logout() {
    localStorage.removeItem('user');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ========== PAGE NAVIGATION ==========
function showPage(pageName) {
    Object.values(elements.pages).forEach(page => {
        if (page) page.classList.remove('active');
    });
    
    elements.navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (elements.pages[pageName]) {
        elements.pages[pageName].classList.add('active');
    }
    
    const activeNavItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    switch (pageName) {
        case 'dashboard': loadDashboardData(); break;
        case 'predict': loadHalls(); break;
        case 'history': loadHistory(); break;
        case 'analytics': loadAnalytics(); break;
        case 'feedback': initFeedbackPage(); loadHalls(); break;
    }
}

// ========== LOAD INITIAL DATA ==========
async function loadInitialData() {
    await Promise.all([loadHalls(), loadDashboardData(), loadModelMetrics()]);
}

// ========== LOAD MODEL METRICS FROM BACKEND ==========
async function loadModelMetrics() {
    try {
        const response = await fetch(`${API_BASE_URL}/model-info`);
        if (response.ok) {
            const data = await response.json();
            if (data.metrics) {
                modelMetrics = {
                    r2_percentage: data.metrics.r2_percentage || 93.72,
                    rmse: data.metrics.rmse || 1.04,
                    mse: data.metrics.mse || 1.07,
                    mape: data.metrics.mape || 0.38
                };
                
                // Update dashboard with R² percentage
                if (elements.modelAccuracy) {
                    elements.modelAccuracy.textContent = `${modelMetrics.r2_percentage.toFixed(2)}%`;
                }
                
                // Store in localStorage as backup
                localStorage.setItem('model_accuracy', modelMetrics.r2_percentage.toString());
                localStorage.setItem('model_metrics', JSON.stringify(modelMetrics));
                
                console.log('✅ Loaded real XGBoost metrics:', modelMetrics);
            }
        } else {
            // Fallback to stored or default values
            const savedMetrics = localStorage.getItem('model_metrics');
            if (savedMetrics) {
                modelMetrics = JSON.parse(savedMetrics);
            }
            if (elements.modelAccuracy) {
                elements.modelAccuracy.textContent = `${modelMetrics.r2_percentage.toFixed(2)}%`;
            }
        }
    } catch (error) {
        console.error('Error loading model metrics:', error);
        // Fallback to your actual XGBoost metrics
        if (elements.modelAccuracy) {
            elements.modelAccuracy.textContent = '93.72%';
        }
    }
}

// ========== HALLS MANAGEMENT ==========
async function loadHalls() {
    try {
        const response = await fetch(`${API_BASE_URL}/halls`);
        if (!response.ok) throw new Error('Failed to fetch halls');
        
        const data = await response.json();
        
        if (data.halls && Array.isArray(data.halls)) {
            const dropdowns = [
                elements.hallSelect, 
                elements.quickHall,
                elements.feedbackHallSelect
            ];
            
            dropdowns.forEach(select => {
                if (select) {
                    select.innerHTML = '<option value="">Select Hall</option>';
                    data.halls.forEach(hall => {
                        const option = document.createElement('option');
                        option.value = hall.id;
                        option.textContent = hall.name;
                        select.appendChild(option);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error loading halls:', error);
        loadSampleHalls();
    }
}

function loadSampleHalls() {
    const sampleHalls = [
        { id: 1, name: 'WELCH HALL' }, { id: 2, name: 'WINSLOW HALL' },
        { id: 3, name: 'BETHEL HALL' }, { id: 4, name: 'NELSON M HALL' },
        { id: 5, name: 'SAMUEL. A HALL' }, { id: 6, name: 'NEAL WILSON HALL' },
        { id: 7, name: 'GIDEON TROOPERS HALL' }, { id: 8, name: 'ADELEKE HALL' },
        { id: 9, name: 'HAVILAH HALL' }, { id: 10, name: 'FAD HALL' },
        { id: 11, name: 'WHITE HALL' }, { id: 12, name: 'NYBERG HALL' },
        { id: 13, name: 'OGDEN HALL' }, { id: 14, name: 'MARIGOLD HALL' },
        { id: 15, name: 'CRYSTAL HALL' }, { id: 16, name: 'QUEEN ESTHER HALL' },
        { id: 17, name: 'PLATINUM HALL' }, { id: 18, name: 'IPERU' },
        { id: 19, name: 'OFF CAMPUS' }
    ];
    
    const dropdowns = [elements.hallSelect, elements.quickHall, elements.feedbackHallSelect];
    dropdowns.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select Hall</option>';
            sampleHalls.forEach(hall => {
                const option = document.createElement('option');
                option.value = hall.id;
                option.textContent = hall.name;
                select.appendChild(option);
            });
        }
    });
}

// ========== DASHBOARD ==========
async function loadDashboardData() {
    try {
        const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        const localCount = localPredictions.length;
        
        if (elements.totalPredictions) {
            elements.totalPredictions.textContent = localCount.toString();
        }
        
        const highRiskHalls = calculateHighRiskHalls(localPredictions);
        if (elements.highRiskCount) {
            elements.highRiskCount.textContent = highRiskHalls.toString();
        }
        
        if (elements.totalHalls) {
            elements.totalHalls.textContent = '19';
        }
        
        // Ensure model accuracy is showing the real value
        if (elements.modelAccuracy) {
            elements.modelAccuracy.textContent = `${modelMetrics.r2_percentage.toFixed(2)}%`;
        }
        
        let recentPredictions = [];
        if (localPredictions.length > 0) {
            recentPredictions = localPredictions.slice(0, 5).map((pred, index) => ({
                id: pred.id || `local-${Date.now()}-${index}`,
                hall_name: pred.hall_name,
                semester: pred.semester,
                year: pred.year,
                total_count: pred.total_incidents,
                predicted_at: pred.saved_at || pred.timestamp,
                local: true
            }));
        }
        
        updateRecentTable(recentPredictions);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function calculateHighRiskHalls(predictions) {
    const highRiskHalls = new Set();
    predictions.forEach(pred => {
        if (pred.total_incidents > 50) {
            highRiskHalls.add(pred.hall_name);
        }
    });
    return highRiskHalls.size;
}

function updateRecentTable(predictions) {
    const tbody = elements.recentTable;
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!predictions || predictions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No predictions yet. Generate one in the Predict page!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    predictions.forEach(pred => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pred.hall_name || 'Unknown'}</td>
            <td><span class="badge ${pred.semester == 1 ? 'info' : 'warning'}">S${pred.semester || 'N/A'}</span></td>
            <td>${pred.year || 'N/A'}</td>
            <td><strong>${pred.total_count || 0}</strong></td>
            <td>${formatDate(pred.predicted_at) || 'N/A'}</td>
            <td>
                <button class="btn btn-secondary small" onclick="viewPrediction('${pred.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========== PREDICTION ==========
async function handlePrediction(e) {
    e.preventDefault();
    
    const hallId = elements.hallSelect.value;
    const semester = elements.semesterSelect.value;
    const year = elements.yearSelect.value;
    
    if (!hallId || !semester || !year) {
        showToast('Please fill all fields', 'warning');
        return;
    }
    
    showToast('Generating prediction...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hall_id: parseInt(hallId),
                semester: parseInt(semester),
                year: year
            })
        });
        
        if (!response.ok) throw new Error('Prediction failed');
        
        const result = await response.json();
        displayPredictionResults(result);
        
        // CRITICAL - These lines show the results
        if (elements.emptyState) elements.emptyState.classList.add('hidden');
        if (elements.resultsContainer) elements.resultsContainer.classList.remove('hidden');
        
        showToast('Prediction generated!', 'success');
        
    } catch (error) {
        console.error('Prediction error:', error);
        showToast('Failed to generate prediction', 'error');
    }
}

function handleQuickPrediction() {
    const hallId = elements.quickHall.value;
    if (!hallId) {
        showToast('Select a hall first', 'warning');
        return;
    }
    
    showPage('predict');
    elements.hallSelect.value = hallId;
    elements.semesterSelect.value = '1';
    elements.yearSelect.value = new Date().getFullYear().toString();
    
    setTimeout(() => {
        if (elements.predictionForm) {
            elements.predictionForm.dispatchEvent(new Event('submit'));
        }
    }, 100);
}

async function handlePredictAll() {
    const semester = elements.semesterSelect.value;
    const year = elements.yearSelect.value;
    
    if (!semester || !year) {
        showToast('Select semester and year first', 'warning');
        return;
    }
    
    showToast('Predicting all 19 halls...', 'info');
    
    try {
        const hallOptions = Array.from(elements.hallSelect.options).filter(opt => opt.value !== '');
        const hallIds = hallOptions.map(opt => parseInt(opt.value));
        let successCount = 0;
        
        for (let i = 0; i < hallIds.length; i++) {
            try {
                const response = await fetch(`${API_BASE_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hall_id: hallIds[i],
                        semester: parseInt(semester),
                        year: year
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
                    
                    // Create a complete prediction object
                    const newPrediction = {
                        id: 'pred-' + Date.now() + '-' + i,
                        hall_id: hallIds[i],
                        hall_name: result.hall_name,
                        semester: result.semester,
                        year: result.year,
                        predictions: result.predictions,
                        total_incidents: result.total_incidents,
                        saved_at: new Date().toISOString(),
                        timestamp: result.timestamp
                    };
                    
                    localPredictions.unshift(newPrediction);
                    localStorage.setItem('predictions', JSON.stringify(localPredictions));
                    successCount++;
                }
            } catch (e) {
                console.error(`Failed for hall ${hallIds[i]}:`, e);
            }
        }
        
        showToast(`✅ Predicted ${successCount}/${hallIds.length} halls`, 'success');
        await loadDashboardData();
        await loadHistory();
        
    } catch (error) {
        console.error('Predict all error:', error);
        showToast('Error generating predictions', 'error');
    }
}

// ========== DISPLAY PREDICTION RESULTS ==========
function displayPredictionResults(result) {
    console.log('Displaying prediction results:', result);
    
    // Update header
    if (elements.resultHallName) elements.resultHallName.textContent = result.hall_name || 'Unknown Hall';
    if (elements.resultSemester) elements.resultSemester.textContent = `Semester ${result.semester || '1'}, ${result.year || '2025'}`;
    if (elements.resultDate) {
        elements.resultDate.textContent = formatDate(result.timestamp || new Date().toISOString());
    }
    if (elements.totalIncidents) elements.totalIncidents.textContent = result.total_incidents || 0;
    
    // Populate detailed results table
    const tbody = elements.detailedResults;
    if (tbody) {
        tbody.innerHTML = '';
        
        if (result.predictions && Array.isArray(result.predictions)) {
            result.predictions.forEach(pred => {
                const row = document.createElement('tr');
                const riskClass = pred.risk === 'High' ? 'danger' : pred.risk === 'Medium' ? 'warning' : 'success';
                row.innerHTML = `
                    <td>${pred.type || 'Unknown'}</td>
                    <td><strong>${pred.count || 0}</strong></td>
                    <td><span class="badge ${riskClass}">${pred.risk || 'Low'}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    // ========== CRITICAL FIX - SHOW RESULTS, HIDE EMPTY STATE ==========
    if (elements.emptyState) {
        elements.emptyState.classList.add('hidden');
        console.log('✅ Empty state hidden');
    }
    
    if (elements.resultsContainer) {
        elements.resultsContainer.classList.remove('hidden');
        console.log('✅ Results container shown - PREDICTION VISIBLE!');
    }
    
    // ========== FIXED: Store current prediction with ALL required fields ==========
    currentPrediction = {
        id: 'pred-' + Date.now(),
        hall_id: parseInt(elements.hallSelect?.value) || result.hall_id,
        hall_name: result.hall_name,
        semester: result.semester,
        year: result.year,
        predictions: result.predictions,
        total_incidents: result.total_incidents,
        timestamp: result.timestamp || new Date().toISOString()
    };
    
    console.log('✅ Current prediction stored:', currentPrediction);
    
    // Create chart
    if (result.predictions) {
        createMisconductChart(result.predictions);
    }
    
    console.log('Prediction display complete');
}

function createMisconductChart(predictions) {
    if (!elements.misconductChart) return;
    elements.misconductChart.innerHTML = '';
    
    const types = predictions.map(p => p.type.substring(0, 25) + (p.type.length > 25 ? '...' : ''));
    const counts = predictions.map(p => p.count);
    
    const colors = counts.map(count => {
        if (count > 15) return '#EF4444';
        if (count > 8) return '#F59E0B';
        return '#10B981';
    });
    
    const options = {
        series: [{ name: 'Count', data: counts }],
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: false },
            background: 'transparent',
            foreColor: darkMode ? '#F1F5F9' : '#0F172A'
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                horizontal: true,
                distributed: true,
                dataLabels: { position: 'top' }
            }
        },
        colors: colors,
        dataLabels: {
            enabled: true,
            formatter: val => val,
            offsetX: 30,
            style: { fontSize: '11px', colors: ['#fff'] }
        },
        xaxis: {
            categories: types,
            labels: { style: { colors: darkMode ? '#CBD5E1' : '#334155', fontSize: '11px' } }
        },
        yaxis: {
            labels: { style: { colors: darkMode ? '#CBD5E1' : '#334155', fontSize: '11px' } }
        },
        grid: { borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
        tooltip: { theme: darkMode ? 'dark' : 'light' }
    };
    
    if (window.ApexCharts) {
        try {
            if (apexChart) apexChart.destroy();
            apexChart = new ApexCharts(elements.misconductChart, options);
            apexChart.render();
        } catch (e) {
            console.error('Chart error:', e);
        }
    }
}

// ========== SAVE PREDICTION ==========
async function saveCurrentPrediction() {
    if (!currentPrediction) {
        showToast('No prediction to save', 'warning');
        return;
    }
    
    // Check if we have all required fields
    if (!currentPrediction.hall_name || !currentPrediction.predictions || !currentPrediction.total_incidents) {
        console.error('Invalid prediction data:', currentPrediction);
        showToast('Invalid prediction data', 'error');
        return;
    }
    
    try {
        showToast('Saving prediction...', 'info');
        
        const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        
        // Create a clean prediction object with all required fields
        const predictionToSave = {
            id: 'pred-' + Date.now(),
            hall_id: currentPrediction.hall_id,
            hall_name: currentPrediction.hall_name,
            semester: currentPrediction.semester,
            year: currentPrediction.year,
            predictions: currentPrediction.predictions,
            total_incidents: currentPrediction.total_incidents,
            saved_at: new Date().toISOString(),
            timestamp: currentPrediction.timestamp || new Date().toISOString()
        };
        
        localPredictions.unshift(predictionToSave);
        localStorage.setItem('predictions', JSON.stringify(localPredictions));
        
        // Update dashboard counters
        if (elements.totalPredictions) {
            elements.totalPredictions.textContent = localPredictions.length.toString();
        }
        
        const highRiskCount = calculateHighRiskHalls(localPredictions);
        if (elements.highRiskCount) {
            elements.highRiskCount.textContent = highRiskCount.toString();
        }
        
        showToast('Prediction saved successfully!', 'success');
        
        // Refresh dashboard data
        await loadDashboardData();
        await loadHistory();
        
        // Optionally reset the form after saving
        setTimeout(() => resetPredictionForm(), 1500);
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save prediction', 'error');
    }
}

function resetPredictionForm() {
    if (elements.predictionForm) elements.predictionForm.reset();
    if (elements.emptyState) elements.emptyState.classList.remove('hidden');
    if (elements.resultsContainer) elements.resultsContainer.classList.add('hidden');
    currentPrediction = null;
    if (elements.misconductChart) elements.misconductChart.innerHTML = '';
}

// ========== HISTORY ==========
async function loadHistory() {
    try {
        const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        
        // Sort by date (newest first)
        localPredictions.sort((a, b) => {
            const dateA = new Date(a.saved_at || a.timestamp || 0);
            const dateB = new Date(b.saved_at || b.timestamp || 0);
            return dateB - dateA;
        });
        
        const localFormatted = localPredictions.map((pred, index) => ({
            id: pred.id || `local-${index}`,
            hall_name: pred.hall_name,
            semester: pred.semester,
            year: pred.year,
            total_count: pred.total_incidents,
            predicted_at: pred.saved_at || pred.timestamp,
            local: true
        }));
        
        updateHistoryTable(localFormatted);
        
    } catch (error) {
        console.error('Error loading history:', error);
        updateHistoryTable([]);
    }
}

function updateHistoryTable(predictions) {
    const tbody = elements.historyTable;
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!predictions || predictions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No predictions found. Save some predictions to see them here!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    predictions.forEach((pred, index) => {
        const row = document.createElement('tr');
        const riskClass = pred.total_count > 50 ? 'danger' : pred.total_count > 30 ? 'warning' : 'success';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${pred.hall_name || 'Unknown'}</strong></td>
            <td><span class="badge ${pred.semester == 1 ? 'info' : 'warning'}">S${pred.semester || 'N/A'}</span></td>
            <td>${pred.year || 'N/A'}</td>
            <td><span class="badge ${riskClass}">${pred.total_count || 0}</span></td>
            <td>${formatDate(pred.predicted_at) || 'N/A'}</td>
            <td>
                <button class="btn btn-secondary small" onclick="viewPrediction('${pred.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-danger small" onclick="deletePrediction('${pred.id}')" style="margin-left: 5px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========== DELETE PREDICTIONS ==========
window.deletePrediction = function(predictionId) {
    if (!predictionId) {
        showToast('Invalid ID', 'error');
        return;
    }
    
    try {
        let localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        const prediction = localPredictions.find(p => p.id === predictionId);
        
        if (!prediction) {
            showToast('Prediction not found', 'error');
            return;
        }
        
        if (confirm(`Delete prediction for ${prediction.hall_name}?`)) {
            localPredictions = localPredictions.filter(p => p.id !== predictionId);
            localStorage.setItem('predictions', JSON.stringify(localPredictions));
            showToast('Prediction deleted', 'success');
            
            // Refresh the current page
            if (elements.pages.history.classList.contains('active')) {
                loadHistory();
            } else {
                loadDashboardData();
            }
            
            // ====== FIX: Refresh analytics if it's visible ======
            if (elements.pages.analytics.classList.contains('active')) {
                loadAnalytics();
            }
            
            // Update dashboard counters
            if (elements.totalPredictions) {
                elements.totalPredictions.textContent = localPredictions.length.toString();
            }
            
            const highRiskCount = calculateHighRiskHalls(localPredictions);
            if (elements.highRiskCount) {
                elements.highRiskCount.textContent = highRiskCount.toString();
            }
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete prediction', 'error');
    }
};

// ========== CLEAR ALL HISTORY - FIXED: Also clears analytics ==========
window.clearAllHistory = function() {
    try {
        const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        
        if (localPredictions.length === 0) {
            showToast('No predictions to clear', 'info');
            return;
        }
        
        if (confirm(`Delete ALL ${localPredictions.length} predictions? This cannot be undone.`)) {
            localStorage.removeItem('predictions');
            showToast('All predictions cleared', 'success');
            
            // Refresh the current page
            if (elements.pages.history.classList.contains('active')) {
                loadHistory();
            } else {
                loadDashboardData();
            }
            
            // ====== FIX: Also refresh analytics if it's visible ======
            if (elements.pages.analytics.classList.contains('active')) {
                loadAnalytics();
            }
            
            // Reset counters
            if (elements.totalPredictions) elements.totalPredictions.textContent = '0';
            if (elements.highRiskCount) elements.highRiskCount.textContent = '0';
            
            // Clear current prediction if any
            currentPrediction = null;
            if (elements.misconductChart) elements.misconductChart.innerHTML = '';
        }
    } catch (error) {
        console.error('Clear error:', error);
        showToast('Failed to clear history', 'error');
    }
};

// ========== VIEW PREDICTION ==========
window.viewPrediction = function(predictionId) {
    if (!predictionId) {
        showToast('Invalid ID', 'error');
        return;
    }
    
    try {
        const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        let prediction = localPredictions.find(p => p.id === predictionId);
        
        if (!prediction) {
            showToast('Prediction not found', 'error');
            return;
        }
        
        showPage('predict');
        
        const formatted = {
            hall_name: prediction.hall_name,
            semester: prediction.semester,
            year: prediction.year,
            total_incidents: prediction.total_incidents,
            predictions: prediction.predictions,
            timestamp: prediction.saved_at || prediction.timestamp
        };
        
        displayPredictionResults(formatted);
        
        // CRITICAL - These lines show the results
        if (elements.emptyState) elements.emptyState.classList.add('hidden');
        if (elements.resultsContainer) elements.resultsContainer.classList.remove('hidden');
        
        showToast('Prediction loaded', 'success');
    } catch (error) {
        console.error('View error:', error);
        showToast('Failed to load prediction', 'error');
    }
};

// ========== ANALYTICS ==========
async function loadAnalytics() {
    const chartContainer = elements.hallChart;
    if (!chartContainer) return;
    
    try {
        const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        
        if (localPredictions.length === 0) {
            chartContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>No data yet. Save some predictions to see analytics!</p>
                </div>
            `;
            return;
        }
        
        // Calculate hall totals
        const hallTotals = {};
        const semesterData = { '1': 0, '2': 0 };
        const yearData = {};
        
        localPredictions.forEach(pred => {
            const hallName = pred.hall_name;
            if (!hallTotals[hallName]) hallTotals[hallName] = 0;
            hallTotals[hallName] += pred.total_incidents || 0;
            
            // Track semester data
            if (pred.semester) {
                semesterData[pred.semester] = (semesterData[pred.semester] || 0) + pred.total_incidents;
            }
            
            // Track year data
            if (pred.year) {
                if (!yearData[pred.year]) yearData[pred.year] = 0;
                yearData[pred.year] += pred.total_incidents;
            }
        });
        
        // Sort halls by total incidents (highest first)
        const sortedHalls = Object.entries(hallTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 halls
        
        const hallNames = sortedHalls.map(h => h[0]);
        const hallCounts = sortedHalls.map(h => h[1]);
        
        chartContainer.innerHTML = '';
        
        const options = {
            series: [{ name: 'Total Incidents', data: hallCounts }],
            chart: {
                type: 'bar',
                height: 400,
                toolbar: { show: true },
                background: 'transparent',
                foreColor: darkMode ? '#F1F5F9' : '#0F172A'
            },
            plotOptions: {
                bar: {
                    borderRadius: 6,
                    columnWidth: '60%',
                    dataLabels: { position: 'top' },
                    colors: {
                        ranges: [{
                            from: 0,
                            to: 1000,
                            color: '#3B82F6'
                        }]
                    }
                }
            },
            colors: ['#3B82F6'],
            dataLabels: {
                enabled: true,
                formatter: val => val,
                offsetY: -20,
                style: { fontSize: '11px', colors: [darkMode ? '#F1F5F9' : '#0F172A'] }
            },
            xaxis: {
                categories: hallNames,
                labels: { 
                    rotate: -45,
                    style: { fontSize: '11px', colors: darkMode ? '#CBD5E1' : '#334155' }
                }
            },
            yaxis: {
                title: { text: 'Total Incidents' },
                labels: { style: { fontSize: '11px', colors: darkMode ? '#CBD5E1' : '#334155' } }
            },
            grid: { borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
            tooltip: { theme: darkMode ? 'dark' : 'light' }
        };
        
        if (window.ApexCharts) {
            if (analyticsChart) analyticsChart.destroy();
            analyticsChart = new ApexCharts(chartContainer, options);
            analyticsChart.render();
        }
        
        // Add summary stats below chart
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'analytics-summary';
        summaryDiv.style.marginTop = '20px';
        summaryDiv.style.padding = '20px';
        summaryDiv.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
        summaryDiv.style.borderRadius = '8px';
        
        const totalPredictions = localPredictions.length;
        const totalIncidents = localPredictions.reduce((sum, p) => sum + (p.total_incidents || 0), 0);
        const avgIncidents = Math.round(totalIncidents / totalPredictions);
        
        summaryDiv.innerHTML = `
            <h4 style="margin-bottom: 15px; color: ${darkMode ? '#F1F5F9' : '#0F172A'};">Summary Statistics</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div style="padding: 10px; background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; border-radius: 6px;">
                    <div style="font-size: 0.8rem; color: ${darkMode ? '#94A3B8' : '#475569'};">Total Predictions</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${darkMode ? '#F1F5F9' : '#0F172A'};">${totalPredictions}</div>
                </div>
                <div style="padding: 10px; background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; border-radius: 6px;">
                    <div style="font-size: 0.8rem; color: ${darkMode ? '#94A3B8' : '#475569'};">Total Incidents</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${darkMode ? '#F1F5F9' : '#0F172A'};">${totalIncidents}</div>
                </div>
                <div style="padding: 10px; background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; border-radius: 6px;">
                    <div style="font-size: 0.8rem; color: ${darkMode ? '#94A3B8' : '#475569'};">Avg per Prediction</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${darkMode ? '#F1F5F9' : '#0F172A'};">${avgIncidents}</div>
                </div>
            </div>
        `;
        
        chartContainer.parentNode.appendChild(summaryDiv);
        
    } catch (error) {
        console.error('Analytics error:', error);
        chartContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading analytics. Please try again.</p>
            </div>
        `;
    }
}

// ========== FEEDBACK SYSTEM ==========
function initFeedbackPage() {
    if (elements.feedbackYear) {
        elements.feedbackYear.value = new Date().getFullYear().toString();
    }
}

function loadPredictionsForFeedback() {
    const semester = elements.feedbackSemester?.value;
    const year = elements.feedbackYear?.value;
    
    if (!semester || !year) {
        showToast('Select semester and year', 'warning');
        return;
    }
    
    showToast('Loading...', 'info');
    
    try {
        const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        const filtered = localPredictions.filter(p => p.semester == semester && p.year == year);
        
        if (filtered.length === 0) {
            showToast(`No predictions for S${semester} ${year}`, 'warning');
            return;
        }
        
        if (elements.feedbackHallSelect) {
            elements.feedbackHallSelect.innerHTML = '<option value="">Select Hall</option>';
            const uniqueHalls = [...new Set(filtered.map(p => p.hall_name))];
            uniqueHalls.sort().forEach(hall => {
                const option = document.createElement('option');
                option.value = hall;
                option.textContent = hall;
                elements.feedbackHallSelect.appendChild(option);
            });
        }
        
        if (elements.hallFeedbackSection) elements.hallFeedbackSection.style.display = 'block';
        if (elements.feedbackFormSection) elements.feedbackFormSection.style.display = 'none';
        if (elements.improvementStats) elements.improvementStats.style.display = 'none';
        
        showToast(`Found ${filtered.length} predictions`, 'success');
        
    } catch (error) {
        console.error('Feedback load error:', error);
        showToast('Failed to load predictions', 'error');
    }
}

function loadHallPredictionForFeedback() {
    const semester = elements.feedbackSemester?.value;
    const year = elements.feedbackYear?.value;
    const hallName = elements.feedbackHallSelect?.value;
    
    if (!hallName) {
        showToast('Select a hall', 'warning');
        return;
    }
    
    try {
        const localPredictions = JSON.parse(localStorage.getItem('predictions') || '[]');
        const prediction = localPredictions.find(p => 
            p.hall_name === hallName && 
            p.semester == semester && 
            p.year == year
        );
        
        if (!prediction) {
            showToast('Prediction not found', 'error');
            return;
        }
        
        currentFeedbackPrediction = prediction;
        
        if (elements.selectedHallName) elements.selectedHallName.textContent = hallName;
        if (elements.selectedSemester) elements.selectedSemester.textContent = semester;
        if (elements.selectedYear) elements.selectedYear.textContent = year;
        
        const tbody = elements.feedbackTableBody;
        if (tbody) {
            tbody.innerHTML = '';
            let total = 0;
            
            prediction.predictions.forEach((pred, i) => {
                total += pred.count;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pred.type}</td>
                    <td><strong>${pred.count}</strong></td>
                    <td>
                        <input type="number" id="actual_${i}" class="form-input" value="${pred.count}" min="0" style="width: 70px;" onchange="calculateFeedbackDifferences()">
                    </td>
                    <td id="diff_${i}">0</td>
                    <td id="acc_${i}">100%</td>
                `;
                tbody.appendChild(row);
            });
            
            if (elements.totalPredicted) elements.totalPredicted.textContent = total;
            if (elements.totalActual) elements.totalActual.textContent = total;
            if (elements.totalDifference) elements.totalDifference.textContent = '0';
            if (elements.totalAccuracy) elements.totalAccuracy.textContent = '100%';
        }
        
        if (elements.feedbackFormSection) elements.feedbackFormSection.style.display = 'block';
        
    } catch (error) {
        console.error('Load hall error:', error);
        showToast('Failed to load hall data', 'error');
    }
}

window.calculateFeedbackDifferences = function() {
    const prediction = currentFeedbackPrediction;
    if (!prediction) return;
    
    let totalPred = 0, totalAct = 0, totalDiff = 0, totalAcc = 0;
    
    prediction.predictions.forEach((pred, i) => {
        const input = document.getElementById(`actual_${i}`);
        if (!input) return;
        
        const actual = parseInt(input.value) || 0;
        const diff = actual - pred.count;
        const acc = pred.count === 0 ? 100 : Math.max(0, 100 - Math.abs(diff / pred.count * 100));
        
        const diffCell = document.getElementById(`diff_${i}`);
        const accCell = document.getElementById(`acc_${i}`);
        
        if (diffCell) {
            diffCell.textContent = diff > 0 ? `+${diff}` : diff;
            diffCell.style.color = diff > 0 ? '#EF4444' : diff < 0 ? '#10B981' : 'var(--text-muted)';
        }
        
        if (accCell) {
            accCell.textContent = `${acc.toFixed(1)}%`;
            accCell.style.color = acc > 90 ? '#10B981' : acc > 70 ? '#F59E0B' : '#EF4444';
        }
        
        totalPred += pred.count;
        totalAct += actual;
        totalDiff += Math.abs(diff);
        totalAcc += acc;
    });
    
    const avgAcc = totalAcc / prediction.predictions.length;
    
    if (elements.totalPredicted) elements.totalPredicted.textContent = totalPred;
    if (elements.totalActual) elements.totalActual.textContent = totalAct;
    if (elements.totalDifference) elements.totalDifference.textContent = totalDiff;
    if (elements.totalAccuracy) {
        elements.totalAccuracy.textContent = `${avgAcc.toFixed(1)}%`;
        elements.totalAccuracy.style.color = avgAcc > 90 ? '#10B981' : avgAcc > 70 ? '#F59E0B' : '#EF4444';
    }
};

function submitFeedback() {
    if (!currentFeedbackPrediction) {
        showToast('No prediction selected', 'warning');
        return;
    }
    
    try {
        const semester = elements.feedbackSemester?.value;
        const year = elements.feedbackYear?.value;
        const hallName = elements.feedbackHallSelect?.value;
        
        const actuals = [];
        let totalActual = 0;
        
        currentFeedbackPrediction.predictions.forEach((pred, i) => {
            const input = document.getElementById(`actual_${i}`);
            const actual = parseInt(input?.value) || 0;
            actuals.push({
                type: pred.type,
                predicted: pred.count,
                actual: actual,
                diff: actual - pred.count
            });
            totalActual += actual;
        });
        
        const totalPred = currentFeedbackPrediction.total_incidents;
        const accuracy = totalPred === 0 ? 100 : Math.max(0, 100 - (Math.abs(totalActual - totalPred) / totalPred * 100));
        const roundedAcc = Math.round(accuracy * 10) / 10;
        
        const feedbackData = {
            id: 'fb-' + Date.now(),
            hall_name: hallName,
            hall_id: currentFeedbackPrediction.hall_id,
            semester: semester,
            year: year,
            predictions: currentFeedbackPrediction.predictions,
            actuals: actuals,
            total_predicted: totalPred,
            total_actual: totalActual,
            accuracy: roundedAcc,
            timestamp: new Date().toISOString()
        };
        
        const feedbackHistory = JSON.parse(localStorage.getItem('feedback_history') || '[]');
        feedbackHistory.push(feedbackData);
        localStorage.setItem('feedback_history', JSON.stringify(feedbackHistory));
        
        updateTrainingData(feedbackData);
        showImprovementStats(feedbackData, roundedAcc);
        
        showToast('Feedback submitted! Model will improve.', 'success');
        
    } catch (error) {
        console.error('Submit feedback error:', error);
        showToast('Failed to submit feedback', 'error');
    }
}

function updateTrainingData(feedbackData) {
    let trainingData = JSON.parse(localStorage.getItem('training_data') || '[]');
    trainingData.push({
        features: {
            hall_id: feedbackData.hall_id,
            hall_name: feedbackData.hall_name,
            semester: feedbackData.semester,
            year: feedbackData.year
        },
        targets: feedbackData.actuals.map(a => a.actual),
        timestamp: feedbackData.timestamp,
        accuracy: feedbackData.accuracy
    });
    
    // Keep only last 500 samples
    if (trainingData.length > 500) trainingData = trainingData.slice(-500);
    localStorage.setItem('training_data', JSON.stringify(trainingData));
    updateModelAccuracy();
}

function updateModelAccuracy() {
    // Fetch real model metrics instead of calculating from feedback
    fetch(`${API_BASE_URL}/model-info`)
        .then(response => response.json())
        .then(data => {
            if (data.metrics && data.metrics.r2_percentage) {
                modelMetrics.r2_percentage = data.metrics.r2_percentage;
                if (elements.modelAccuracy) {
                    elements.modelAccuracy.textContent = `${modelMetrics.r2_percentage.toFixed(2)}%`;
                }
                localStorage.setItem('model_accuracy', modelMetrics.r2_percentage.toString());
            }
        })
        .catch(() => {
            // Keep existing value if fetch fails
            if (elements.modelAccuracy) {
                elements.modelAccuracy.textContent = `${modelMetrics.r2_percentage.toFixed(2)}%`;
            }
        });
}

function showImprovementStats(feedbackData, newAccuracy) {
    // Use real model accuracy instead of hardcoded
    const oldAccuracy = modelMetrics.r2_percentage;
    const improvement = (newAccuracy - oldAccuracy).toFixed(1);
    
    if (elements.accuracyImprovement) {
        elements.accuracyImprovement.textContent = improvement > 0 ? `+${improvement}%` : `${improvement}%`;
        elements.accuracyImprovement.style.color = improvement > 0 ? '#10B981' : '#EF4444';
    }
    
    const trainingData = JSON.parse(localStorage.getItem('training_data') || '[]');
    if (elements.newTrainingSamples) elements.newTrainingSamples.textContent = trainingData.length;
    if (elements.newModelAccuracy) elements.newModelAccuracy.textContent = `${newAccuracy}%`;
    if (elements.improvementStats) elements.improvementStats.style.display = 'block';
}

function resetFeedbackForm() {
    if (elements.feedbackFormSection) elements.feedbackFormSection.style.display = 'none';
    if (elements.feedbackHallSelect) elements.feedbackHallSelect.value = '';
    if (elements.hallFeedbackSection) elements.hallFeedbackSection.style.display = 'none';
    currentFeedbackPrediction = null;
}

function exportFeedbackData() {
    const feedback = JSON.parse(localStorage.getItem('feedback_history') || '[]');
    const training = JSON.parse(localStorage.getItem('training_data') || '[]');
    const predictions = JSON.parse(localStorage.getItem('predictions') || '[]');
    
    const exportData = {
        feedback: feedback,
        training_data: training,
        model_accuracy: modelMetrics.r2_percentage,
        model_metrics: modelMetrics,
        total_predictions: predictions.length,
        predictions: predictions.slice(0, 10), // Only include last 10 predictions to keep file size manageable
        export_date: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `uniguard-training-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('Training data exported successfully', 'success');
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info') {
    const container = elements.toastContainer;
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    switch (type) {
        case 'success': icon = 'check-circle'; break;
        case 'error': icon = 'exclamation-circle'; break;
        case 'warning': icon = 'exclamation-triangle'; break;
    }
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i><div>${message}</div>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ========== UTILITIES ==========
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// ========== GLOBAL ACCESS ==========
window.viewPrediction = viewPrediction;
window.deletePrediction = deletePrediction;
window.clearAllHistory = clearAllHistory;
window.calculateFeedbackDifferences = calculateFeedbackDifferences;
window.showToast = showToast;

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', init);