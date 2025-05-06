document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
  
    if (!token) {
      document.body.innerHTML = "<h2>❌ Token no encontrado</h2>";
      return;
    }
  
    try {
      const res = await fetch(`http://localhost:3000/api/auth/verify?token=${token}`);
      const data = await res.json();
  
      if (data.success) {
        document.body.innerHTML = "<h2>✅ Cuenta verificada correctamente. Redirigiendo al login...</h2>";
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 3000); // Redirige después de 3 segundos
      } else {
        document.body.innerHTML = `<h2>❌ ${data.message}</h2>`;
      }
    } catch (error) {
      document.body.innerHTML = "<h2>❌ Error al verificar la cuenta</h2>";
    }
  });
  