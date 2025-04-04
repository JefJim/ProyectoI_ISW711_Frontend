document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {  //form information
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value,
        pin: document.getElementById('pin').value,
        name: document.getElementById('name').value,
        lastName: document.getElementById('lastName').value,
        country: document.getElementById('country').value,
        birthDate: document.getElementById('birthDate').value,
    };

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Usuario registrado exitosamente');
            window.location.href = '../pages/login.html'; // Redirigir al login
        } else {
            alert(data.error || 'Error al registrar el usuario');
        }
    } catch (error) {
        alert('Error al conectar con el servidor');
    }
});