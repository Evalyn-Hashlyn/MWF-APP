document.addEventListener("DOMContentLoaded", () => {
  const quantityInput = document.getElementById('quantity');
  const unitPriceInput = document.getElementById('unitPrice');
  const transportCheckbox = document.getElementById('transport');
  const totalPriceInput = document.getElementById('totalPrice');
  const salesForm = document.getElementById('salesForm');

  function calculateTotal() {
    const qty = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(unitPriceInput.value) || 0;
    let total = qty * price;

    if (transportCheckbox && transportCheckbox.checked) {
      total = total * 1.05; // Add 5% for transport
    }

    totalPriceInput.value = total ? total.toFixed(2) : '';
  }

  // calculate on inputs
  if (quantityInput) quantityInput.addEventListener('input', calculateTotal);
  if (unitPriceInput) unitPriceInput.addEventListener('input', calculateTotal);
  if (transportCheckbox) transportCheckbox.addEventListener('change', calculateTotal);

  // Ensure totalPrice is calculated before normal form submit
  if (salesForm) {
    salesForm.addEventListener('submit', (e) => {
      // calculate one last time to ensure totalPrice input is filled
      calculateTotal();
      // allow normal submission (server will recalculate and save definitive value)
    });
  }

  // Fade out alerts after 4 seconds
  setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    });
  }, 4000);
});
