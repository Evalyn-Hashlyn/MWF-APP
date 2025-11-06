// Ensure the DOM is loaded before trying to access canvas elements
document.addEventListener("DOMContentLoaded", () => {
  // STOCK CHART (Furniture vs Wood)
  const stockCtx = document.getElementById("stockChart");
  if (stockCtx && window.stockData) {
    new Chart(stockCtx, {
      type: "bar",
      data: {
        labels: ["Furniture", "Wood"],
        datasets: [
          {
            label: "Stock Count",
            data: window.stockData,
            backgroundColor: ["#4CAF50", "#FF9800"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
        plugins: {
          title: {
            display: true,
            text: "Available Stock Summary",
          },
        },
      },
    });
  }

  // SALES TREND CHART (Last 7 Days)
  const salesCtx = document.getElementById("salesChart");
  if (salesCtx && window.salesLabels && window.salesValues) {
    new Chart(salesCtx, {
      type: "line",
      data: {
        labels: window.salesLabels,
        datasets: [
          {
            label: "Total Sales (UGX)",
            data: window.salesValues,
            borderColor: "#2196F3",
            backgroundColor: "rgba(33,150,243,0.2)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
        plugins: {
          title: {
            display: true,
            text: "Sales Over the Last 7 Days",
          },
        },
      },
    });
  }
});
