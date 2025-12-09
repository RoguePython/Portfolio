/**
 * Smooth scrolling to main components (Home, About me, Work experience etc.)
 */
document.addEventListener('DOMContentLoaded', function() {
    const navbarLinks = document.querySelectorAll('.navbar a');
    
    if (navbarLinks.length === 0) {
        console.warn('No navigation links found');
        return;
    }
    
    navbarLinks.forEach(anchor => {
        anchor.addEventListener('click', function (event) {
            event.preventDefault();

            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) {
                return; // Skip external links
            }

            const targetId = href.substring(1); // Get the ID of the target section
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const offset = 50; // Adjust this value to set how much higher you want to scroll
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });
            } else {
                console.warn(`Target element with ID "${targetId}" not found`);
            }
        });
    });
});

/**
 * Dropdown table for showing skills learned at previous work experiences
 */
document.addEventListener("DOMContentLoaded", function() {
    const expandableRows = document.querySelectorAll('.expandable-row');

    if (expandableRows.length === 0) {
        return; // No expandable rows found, exit gracefully
    }

    expandableRows.forEach(row => {
        row.addEventListener('click', function() {
            const detailsRow = this.nextElementSibling;
            
            if (!detailsRow || !detailsRow.classList.contains('details-row')) {
                console.warn('Details row not found for expandable row');
                return;
            }

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
