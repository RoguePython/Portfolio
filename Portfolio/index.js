// Smooth scrolling to main components (Home, About me, Work experience etc.)
document.addEventListener('DOMContentLoaded', function() { 
    document.querySelectorAll('.navbar a').forEach(anchor => {
        anchor.addEventListener('click', function (scrollanimation) {
            scrollanimation.preventDefault();

            const targetId = this.getAttribute('href').substring(1); // Get the ID of the target section
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const offset = 50; // Adjust this value to set how much higher you want to scroll
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Dropdown table for showing skills learned at previous work experiences
document.addEventListener("DOMContentLoaded", function() {
    const expandableRows = document.querySelectorAll('.expandable-row');

    expandableRows.forEach(row => {
        row.addEventListener('click', function() {
            const detailsRow = this.nextElementSibling;
            const isVisible = detailsRow.classList.contains('active-row');

            // Toggle the visibility of the details row
            if (isVisible) {
                detailsRow.classList.remove('active-row');
            } else {
                detailsRow.classList.add('active-row');
            }
        });
    });
});
