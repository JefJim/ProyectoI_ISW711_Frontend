// Variable global para almacenar los países
let countriesData = [];

// function to load countries from API
async function loadCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        countriesData = await response.json();
        
        // order countries alphabetically
        countriesData.sort((a, b) => a.name.common.localeCompare(b.name.common));
        
        const countrySelect = document.getElementById('country');
        const countryCodeSelect = document.getElementById('countryCode');
        
        // clean select options
        countrySelect.innerHTML = '<option value="">Seleccione un país</option>';
        countryCodeSelect.innerHTML = '<option value="">Código</option>';
        
        // recolect phone codes 
        const phoneCodes = [];
        
        countriesData.forEach(country => {
            if (country.idd?.root && country.idd?.suffixes) {
                const phonePrefix = country.idd.root + (country.idd.suffixes[0] || '');
                phoneCodes.push({
                    prefix: phonePrefix,
                    country: country
                });
            }
        });
        
        // order by phone codes descending
        phoneCodes.sort((a, b) => {
            // convertir prefix to number and compare
            const numA = parseInt(a.prefix.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.prefix.replace(/\D/g, '')) || 0;
            return numB - numA; // descending order
        });
        
        // first fill the select of countries (alphabetically)
        countriesData.forEach(country => {
            if (country.idd?.root && country.idd?.suffixes) {
                const countryOption = new Option(
                    `${country.flag} ${country.name.common}`,
                    country.name.common
                );
                countryOption.dataset.phonePrefix = country.idd.root + (country.idd.suffixes[0] || '');
                countrySelect.add(countryOption);
            }
        });
        
        // then load the phone codes (descending order)
        phoneCodes.forEach(item => {
            const codeOption = new Option(
                `${item.country.flag} ${item.prefix} ${item.country.name.common}`,
                item.prefix
            );
            codeOption.dataset.countryName = item.country.name.common;
            countryCodeSelect.add(codeOption);
        });
        
        // config for bidirectionality
        countrySelect.addEventListener('change', function() {
            const selectedCountry = this.value;
            if (selectedCountry) {
                const selectedOption = this.options[this.selectedIndex];
                const phonePrefix = selectedOption.dataset.phonePrefix;
                
                // search and select the phone code corresponding to the country
                for (let i = 0; i < countryCodeSelect.options.length; i++) {
                    if (countryCodeSelect.options[i].value === phonePrefix) {
                        countryCodeSelect.selectedIndex = i;
                        break;
                    }
                }
            } else {
                countryCodeSelect.selectedIndex = 0;
            }
        });
        
        countryCodeSelect.addEventListener('change', function() {
            const selectedCode = this.value;
            if (selectedCode) {
                const selectedOption = this.options[this.selectedIndex];
                const countryName = selectedOption.dataset.countryName;
                
                // find and select the country corresponding to the phone code
                for (let i = 0; i < countrySelect.options.length; i++) {
                    if (countrySelect.options[i].value === countryName) {
                        countrySelect.selectedIndex = i;
                        break;
                    }
                }
            } else {
                countrySelect.selectedIndex = 0;
            }
        });
        
    } catch (error) {
        console.error('Error al cargar países:', error);
        document.getElementById('country').innerHTML = '<option value="">Error al cargar países</option>';
    }
}

// Manejo del formulario (existente)
document.addEventListener('DOMContentLoaded', () => {
    loadCountries(); // Carga los países al iniciar
    
    const urlParams = new URLSearchParams(window.location.search);
    const tempToken = urlParams.get('token');
    
    document.getElementById('completeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            tempToken,
            phone: document.getElementById('countryCode').value + document.getElementById('phone').value, // Combina código + teléfono
            pin: document.getElementById('pin').value,
            country: document.getElementById('country').value,
            birthDate: document.getElementById('birthDate').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/auth/google/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al completar registro');
            }

            const result = await response.json();
            localStorage.setItem('token', result.token);
            window.location.href = '../pages/dashboard.html';
        } catch (error) {
            alert(error.message);
        }
    });
});