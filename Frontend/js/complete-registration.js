document.addEventListener('DOMContentLoaded', () => {
    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    document.getElementById('token').value = token;
    
    // Manejar envío del formulario
    document.getElementById('completeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        token: document.getElementById('token').value,
        phone: document.getElementById('phone').value,
        pin: document.getElementById('pin').value,
        country: document.getElementById('country').value,
        birthDate: document.getElementById('birthDate').value
      };
      
      try {
        // Validar PIN
        if (!/^\d{6}$/.test(data.pin)) {
          throw new Error('El PIN debe tener 6 dígitos');
        }
        
        // Validar edad
        const age = Math.floor((new Date() - new Date(data.birthDate)) / (1000 * 60 * 60 * 24 * 365));
        if (age < 18) {
          throw new Error('Debes tener al menos 18 años');
        }
        
        const response = await fetch('/api/auth/complete-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', result.token);
          window.location.href = '/dashboard.html';
        } else {
          throw new Error(result.error || 'Error al completar registro');
        }
      } catch (error) {
        alert(error.message);
      }
    });
  });