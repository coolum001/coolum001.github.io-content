document.addEventListener('DOMContentLoaded', () => {
    const inputSection = document.getElementById('inputSection');
    const resultsSection = document.getElementById('resultsSection');
    const birthdateInput = document.getElementById('birthdate');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const errorMessage = document.getElementById('errorMessage');
    const maleRadio = document.getElementById('male');
    const femaleRadio = document.getElementById('female');
    
    const daysValue = document.getElementById('daysValue');
    const secondsValue = document.getElementById('secondsValue');

    let intervalId = null;
    let expectedDeathDate = null;

    // Create subtle animated particle background
    createParticles();

    calculateBtn.addEventListener('click', startCalculation);
    birthdateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startCalculation();
    });

    // Formatting for input box (auto-add spaces or just limit length)
    birthdateInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(intervalId);
        resultsSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        birthdateInput.value = '';
        errorMessage.classList.remove('visible');
        if (maleRadio) maleRadio.disabled = false;
        if (femaleRadio) femaleRadio.disabled = false;
        setTimeout(() => birthdateInput.focus(), 100);
    });

    function startCalculation() {
        const val = birthdateInput.value.trim();
        
        // Ensure strictly 8 digits
        if (!/^\d{8}$/.test(val)) {
            showError('Please enter exactly 8 digits (YYYYMMDD).');
            return;
        }

        const year = parseInt(val.substring(0, 4), 10);
        const month = parseInt(val.substring(4, 6), 10);
        const day = parseInt(val.substring(6, 8), 10);

        const birthDate = new Date(year, month - 1, day);
        
        // Basic date validation
        if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
            showError('Invalid date. Please check the month and day.');
            return;
        }

        if (birthDate > new Date()) {
            showError('Birth date cannot be in the future.');
            return;
        }

        // Calculate current integer age
        const now = new Date();
        let currentAgeYears = now.getFullYear() - birthDate.getFullYear();
        if (now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
            currentAgeYears--;
        }

        const isMale = document.getElementById('male')?.checked;
        
        // Actuarial life expectation arrays (remaining years)
        const maleExpected = [81.31, 80.59, 79.61, 78.62, 77.63, 76.64, 75.64, 74.65, 73.65, 72.66, 71.66, 70.67, 69.67, 68.68, 67.69, 66.70, 65.71, 64.74, 63.76, 62.80, 61.83, 60.86, 59.90, 58.93, 57.97, 57.01, 56.04, 55.08, 54.12, 53.16, 52.19, 51.23, 50.27, 49.31, 48.35, 47.40, 46.44, 45.49, 44.53, 43.58, 42.63, 41.68, 40.74, 39.80, 38.86, 37.92, 36.99, 36.07, 35.14, 34.22, 33.31, 32.40, 31.50, 30.60, 29.70, 28.82, 27.93, 27.06, 26.19, 25.32, 24.47, 23.62, 22.78, 21.94, 21.12, 20.30, 19.48, 18.68, 17.89, 17.10, 16.32, 15.56, 14.80, 14.06, 13.33, 12.62, 11.92, 11.24, 10.58, 9.94, 9.32, 8.72, 8.14, 7.59, 7.06, 6.55, 6.08, 5.63, 5.21, 4.83, 4.48, 4.16, 3.88, 3.62, 3.39, 3.18, 2.99, 2.81, 2.65, 2.50, 2.37, 2.25, 2.15, 2.06, 1.98, 1.90, 1.83, 1.77, 1.72, 1.67];
        const femaleExpected = [85.34, 84.59, 83.61, 82.62, 81.62, 80.63, 79.64, 78.64, 77.65, 76.65, 75.66, 74.66, 73.67, 72.67, 71.68, 70.68, 69.69, 68.71, 67.72, 66.74, 65.75, 64.77, 63.78, 62.80, 61.81, 60.83, 59.84, 58.86, 57.87, 56.89, 55.91, 54.92, 53.94, 52.96, 51.98, 51.00, 50.03, 49.05, 48.08, 47.11, 46.14, 45.17, 44.21, 43.24, 42.28, 41.33, 40.37, 39.42, 38.47, 37.53, 36.58, 35.64, 34.71, 33.78, 32.85, 31.92, 31.00, 30.08, 29.17, 28.26, 27.35, 26.45, 25.56, 24.67, 23.78, 22.90, 22.02, 21.15, 20.29, 19.43, 18.59, 17.75, 16.92, 16.10, 15.30, 14.50, 13.72, 12.96, 12.21, 11.48, 10.77, 10.08, 9.42, 8.78, 8.16, 7.57, 7.01, 6.48, 5.98, 5.51, 5.09, 4.69, 4.33, 4.00, 3.71, 3.44, 3.20, 2.99, 2.80, 2.63, 2.49, 2.36, 2.24, 2.14, 2.04, 1.96, 1.88, 1.81, 1.74, 1.68];
        
        // Provide the remaining expected years based on current age.
        // Cap at 109 years.
        const lookupAge = Math.max(0, Math.min(currentAgeYears, 109));
        const additionalYears = isMale ? maleExpected[lookupAge] : femaleExpected[lookupAge];

        // Display the remaining expected years to live
        const lifespanDisplay = document.getElementById('expectedLifespanDisplay');
        if (lifespanDisplay) lifespanDisplay.textContent = additionalYears.toFixed(1) + ' Years';

        // Calculate expected end date by adding expected remaining MS to today
        expectedDeathDate = new Date(now.getTime() + additionalYears * 365.2425 * 24 * 60 * 60 * 1000);

        hideError();
        
        // Switch views
        inputSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        if (maleRadio) maleRadio.disabled = true;
        if (femaleRadio) femaleRadio.disabled = true;

        // Immediately update and then start interval
        updateStats();
        intervalId = setInterval(updateStats, 100); // 100ms = 1/10th second update
    }

    function updateStats() {
        const now = new Date();
        const diffMs = expectedDeathDate - now;

        if (diffMs <= 0) {
            clearInterval(intervalId);
            daysValue.textContent = "0.00000";
            secondsValue.textContent = "0.0";
            return;
        }

        const days = diffMs / (1000 * 60 * 60 * 24);
        const seconds = diffMs / 1000;

        // Use locale string for nice comma formatting for days
        const daysParts = days.toFixed(5).split('.');
        daysParts[0] = parseInt(daysParts[0]).toLocaleString();
        daysValue.textContent = daysParts.join('.');
        
        // Format to 1 decimal place. Use a more manual approach to keep commas on large numbers
        const parts = seconds.toFixed(1).split('.');
        parts[0] = parseInt(parts[0]).toLocaleString();
        secondsValue.textContent = parts.join('.');
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.add('visible');
    }

    function hideError() {
        errorMessage.classList.remove('visible');
    }

    // Creates atmospheric steam particles for Steampunk theme
    function createParticles() {
        const container = document.getElementById('particles-container');
        const particleCount = 40;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            
            // Random sizes for steam puffs
            const size = Math.random() * 60 + 30 + 'px';
            particle.style.width = size;
            particle.style.height = size;
            
            // Soft gradient smoke/steam dots
            particle.style.background = 'radial-gradient(circle, rgba(180, 160, 140, 0.15) 0%, rgba(200, 200, 200, 0) 70%)';
            particle.style.borderRadius = '50%';
            particle.style.top = (100 + Math.random() * 20) + '%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.filter = 'blur(8px)';
            
            // Rising float animation
            const duration = Math.random() * 20 + 15;
            const xMovement = (Math.random() - 0.5) * 150;
            const targetY = -window.innerHeight - 200;
            
            particle.animate([
                { transform: 'translate(0px, 0px)', opacity: 0 },
                { opacity: Math.random() * 0.4 + 0.1, offset: 0.2 },
                { transform: `translate(${xMovement}px, ${targetY}px)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                iterations: Infinity,
                easing: 'ease-out'
            });

            container.appendChild(particle);
        }
    }
});
