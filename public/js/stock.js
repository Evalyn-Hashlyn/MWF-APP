const ctx1 = document.getElementById('stockDistributionChart').getContext('2d');
    const stockDistributionChart = new Chart(ctx1, {
    type: 'pie',
    data: {
        labels: stockData.labels,
        datasets: [{
        data: stockData.values,
        backgroundColor: ['#f6c2b0', '#a1887f', '#d7ccc8', '#c18632', '#84520d']
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
    }
    });

    const ctx2 = document.getElementById('lowStockChart').getContext('2d');
    const lowStockChart = new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: lowStockData.labels,
        datasets: [{
        label: 'Quantity',
        data: lowStockData.values,
        backgroundColor: '#ed9417'
        }]
    },
    options: {
        responsive: true,
        scales: {
        y: { beginAtZero: true }
        }
    }
    });