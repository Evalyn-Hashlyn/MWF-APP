    const quantityInput = document.getElementById('quantity');
    const unitPriceInput = document.getElementById('unitPrice');
    const transportCheckbox = document.getElementById('transport');
    const totalPriceInput = document.getElementById('totalPrice');

    function calculateTotal() {
      const qty = parseFloat(quantityInput.value) || 0;
      const price = parseFloat(unitPriceInput.value) || 0;
      let total = qty * price;

      if (transportCheckbox.checked) {
        total += total * 0.05; // Add 5% for transport
      }

      totalPriceInput.value = total.toFixed(2);
    }

    quantityInput.addEventListener('input', calculateTotal);
    unitPriceInput.addEventListener('input', calculateTotal);
    transportCheckbox.addEventListener('change', calculateTotal);

  // Fade out alerts after 4 seconds
  setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    });
  }, 4000);

